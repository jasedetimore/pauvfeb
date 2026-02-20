-- Migration: Atomic Functions for Payments and Trading
-- Solves race conditions by moving logic into ACID-compliant database functions.

-- 1. Atomic Balance Increment (for Payments)
CREATE OR REPLACE FUNCTION increment_user_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    v_new_balance NUMERIC;
BEGIN
    -- Update balance atomically. 
    -- If p_amount is negative (withdrawal), the CHECK(usdp_balance >= 0) constraint 
    -- on the table will automatically prevent over-withdrawal.
    UPDATE public.users
    SET usdp_balance = usdp_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING usdp_balance INTO v_new_balance;
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trading Helper Functions (Math from formulas.ts)

-- Calculate tokens received for BUY
CREATE OR REPLACE FUNCTION calculate_buy_tokens(
    p_usdp_amount NUMERIC,
    p_current_price NUMERIC,
    p_price_step NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_discriminant NUMERIC;
BEGIN
    IF p_usdp_amount <= 0 THEN RETURN 0; END IF;
    -- Formula: (-P + SQRT(P^2 + 2 * S * U)) / S
    v_discriminant := (p_current_price * p_current_price) + (2 * p_price_step * p_usdp_amount);
    IF v_discriminant < 0 THEN RAISE EXCEPTION 'Invalid calculation'; END IF;
    
    RETURN (-p_current_price + SQRT(v_discriminant)) / p_price_step;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate USDP received for SELL
CREATE OR REPLACE FUNCTION calculate_sell_usdp(
    p_tokens_amount NUMERIC,
    p_current_price NUMERIC,
    p_price_step NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_end_price NUMERIC;
    v_avg_price NUMERIC;
BEGIN
    IF p_tokens_amount <= 0 THEN RETURN 0; END IF;
    
    v_end_price := p_current_price - (p_tokens_amount * p_price_step);
    if v_end_price < 0 THEN RAISE EXCEPTION 'Cannot sell more tokens than would drive price below zero'; END IF;
    
    v_avg_price := (p_current_price + v_end_price) / 2;
    RETURN v_avg_price * p_tokens_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 3. Execute BUY Order (Atomic Transaction)
CREATE OR REPLACE FUNCTION execute_buy_order(
    p_user_id UUID,
    p_ticker TEXT,
    p_amount_usdp NUMERIC,
    p_queue_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_user_balance NUMERIC;
    v_trading_state public.issuer_trading%ROWTYPE;
    v_tokens_received NUMERIC;
    v_new_price NUMERIC;
    v_new_supply NUMERIC;
    v_new_total_usdp NUMERIC;
    v_avg_price_paid NUMERIC;
    v_portfolio_exists BOOLEAN;
    v_current_pv NUMERIC := 0;
    v_current_cost_basis NUMERIC := 0;
    v_new_pv NUMERIC;
    v_new_cost_basis NUMERIC;
    v_tx_id UUID;
BEGIN
    -- A. Lock User Row & Check Balance
    SELECT usdp_balance INTO v_user_balance FROM public.users WHERE user_id = p_user_id FOR UPDATE;
    IF v_user_balance < p_amount_usdp THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient USDP balance');
    END IF;

    -- B. Lock Issuer Trading Row
    SELECT * INTO v_trading_state FROM public.issuer_trading WHERE ticker = p_ticker FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Issuer not found');
    END IF;

    -- C. Calculate Trade Values
    v_tokens_received := calculate_buy_tokens(p_amount_usdp, v_trading_state.current_price, v_trading_state.price_step);
    v_new_price := v_trading_state.current_price + (v_tokens_received * v_trading_state.price_step);
    v_new_supply := v_trading_state.current_supply + v_tokens_received;
    v_new_total_usdp := v_trading_state.total_usdp + p_amount_usdp;
    v_avg_price_paid := CASE WHEN v_tokens_received > 0 THEN p_amount_usdp / v_tokens_received ELSE 0 END;

    -- D. Update Issuer State
    UPDATE public.issuer_trading
    SET current_price = v_new_price,
        current_supply = v_new_supply,
        total_usdp = v_new_total_usdp,
        updated_at = NOW()
    WHERE ticker = p_ticker;

    -- E. Deduct User Balance
    UPDATE public.users
    SET usdp_balance = usdp_balance - p_amount_usdp,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- F. Update Portfolio (Upsert)
    SELECT EXISTS(SELECT 1 FROM public.portfolio WHERE user_id = p_user_id AND ticker = p_ticker) INTO v_portfolio_exists;
    
    IF v_portfolio_exists THEN
        SELECT pv_amount, avg_cost_basis INTO v_current_pv, v_current_cost_basis 
        FROM public.portfolio WHERE user_id = p_user_id AND ticker = p_ticker;
    END IF;

    v_new_pv := v_current_pv + v_tokens_received;
    -- Weighted average cost basis calculation
    v_new_cost_basis := ((v_current_pv * v_current_cost_basis) + (v_tokens_received * v_avg_price_paid)) / NULLIF(v_new_pv, 0);
    IF v_new_pv = 0 THEN v_new_cost_basis := 0; END IF;

    INSERT INTO public.portfolio (user_id, ticker, pv_amount, avg_cost_basis, updated_at)
    VALUES (p_user_id, p_ticker, v_new_pv, v_new_cost_basis, NOW())
    ON CONFLICT (user_id, ticker) 
    DO UPDATE SET pv_amount = EXCLUDED.pv_amount, avg_cost_basis = EXCLUDED.avg_cost_basis, updated_at = NOW();

    -- G. Record Transaction
    INSERT INTO public.transactions (
        user_id, ticker, order_type, amount_usdp, status, 
        avg_price_paid, pv_traded, start_price, end_price, date, queue_id
    ) VALUES (
        p_user_id, p_ticker, 'buy', p_amount_usdp, 'completed',
        v_avg_price_paid, v_tokens_received, v_trading_state.current_price, v_new_price, NOW(), p_queue_id
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true, 
        'tokens_received', v_tokens_received,
        'transaction_id', v_tx_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Execute SELL Order (Atomic Transaction)
CREATE OR REPLACE FUNCTION execute_sell_order(
    p_user_id UUID,
    p_ticker TEXT,
    p_amount_pv NUMERIC,
    p_queue_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_portfolio public.portfolio%ROWTYPE;
    v_trading_state public.issuer_trading%ROWTYPE;
    v_usdp_received NUMERIC;
    v_new_price NUMERIC;
    v_new_supply NUMERIC;
    v_new_total_usdp NUMERIC;
    v_avg_price_paid NUMERIC;
    v_new_pv NUMERIC;
    v_tx_id UUID;
BEGIN
    -- A. Lock Portfolio Row & Check Balance
    SELECT * INTO v_portfolio FROM public.portfolio WHERE user_id = p_user_id AND ticker = p_ticker FOR UPDATE;
    IF NOT FOUND OR v_portfolio.pv_amount < p_amount_pv THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient PV balance');
    END IF;

    -- B. Lock Issuer Trading Row
    SELECT * INTO v_trading_state FROM public.issuer_trading WHERE ticker = p_ticker FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Issuer not found');
    END IF;
    
    IF p_amount_pv > v_trading_state.current_supply THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sell more than current supply');
    END IF;

    -- C. Calculate Trade Values
    v_usdp_received := calculate_sell_usdp(p_amount_pv, v_trading_state.current_price, v_trading_state.price_step);
    v_new_price := v_trading_state.current_price - (p_amount_pv * v_trading_state.price_step);
    v_new_supply := v_trading_state.current_supply - p_amount_pv;
    v_new_total_usdp := v_trading_state.total_usdp - v_usdp_received;
    v_avg_price_paid := CASE WHEN p_amount_pv > 0 THEN v_usdp_received / p_amount_pv ELSE 0 END;

    -- D. Update Issuer State
    UPDATE public.issuer_trading
    SET current_price = v_new_price,
        current_supply = v_new_supply,
        total_usdp = v_new_total_usdp,
        updated_at = NOW()
    WHERE ticker = p_ticker;

    -- E. Credit User Balance
    UPDATE public.users
    SET usdp_balance = usdp_balance + v_usdp_received,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- F. Update Portfolio
    v_new_pv := v_portfolio.pv_amount - p_amount_pv;
    UPDATE public.portfolio
    SET pv_amount = v_new_pv,
        updated_at = NOW()
    WHERE user_id = p_user_id AND ticker = p_ticker;

    -- G. Record Transaction
    INSERT INTO public.transactions (
        user_id, ticker, order_type, amount_usdp, status, 
        avg_price_paid, pv_traded, start_price, end_price, date, queue_id
    ) VALUES (
        p_user_id, p_ticker, 'sell', v_usdp_received, 'completed',
        v_avg_price_paid, p_amount_pv, v_trading_state.current_price, v_new_price, NOW(), p_queue_id
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true, 
        'usdp_received', v_usdp_received,
        'transaction_id', v_tx_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
