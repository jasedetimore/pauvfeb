-- =============================================================================
-- pg_cron Scheduled Jobs for Pauv
-- =============================================================================
-- 
-- PREREQUISITES:
-- 1. Enable pg_cron extension in Supabase Dashboard:
--    Database > Extensions > Search "pg_cron" > Enable
-- 2. pg_cron is only available on Supabase Pro plan and above
--
-- =============================================================================

-- Create extension if not exists (this may fail on free tier)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (needed for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;

-- =============================================================================
-- JOB 1: Refresh Issuer Stats Cache every 5 minutes
-- Updates price changes, volume, holders, market cap for all issuers
-- =============================================================================
SELECT cron.schedule(
    'refresh-issuer-stats-cache',           -- job name
    '*/5 * * * *',                           -- every 5 minutes
    $$SELECT refresh_issuer_stats_cache()$$  -- SQL to execute
);

-- =============================================================================
-- JOB 2: Record hourly price snapshots for OHLC charts
-- Captures current price for each issuer every hour
-- =============================================================================
SELECT cron.schedule(
    'hourly-price-snapshot',                 -- job name
    '0 * * * *',                             -- every hour at minute 0
    $$
    INSERT INTO public.price_history (ticker, price, supply, volume_24h, recorded_at)
    SELECT 
        it.ticker,
        it.current_price,
        it.current_supply,
        COALESCE((
            SELECT SUM(ABS(amount_usdp))
            FROM public.transactions t
            WHERE t.ticker = it.ticker
              AND t.status = 'completed'
              AND t.date >= NOW() - INTERVAL '24 hours'
        ), 0),
        NOW()
    FROM public.issuer_trading it
    INNER JOIN public.issuer_details id ON it.ticker = id.ticker
    ON CONFLICT (ticker, recorded_at) DO NOTHING
    $$
);

-- =============================================================================
-- Queue Processing Functions
-- These are called by the Edge Function (triggered via Database Webhook)
-- NOT by pg_cron - event-driven is more efficient for queue processing
-- =============================================================================

-- Function to process the next pending order
CREATE OR REPLACE FUNCTION process_next_queue_order()
RETURNS jsonb AS $$
DECLARE
    v_order RECORD;
    v_user RECORD;
    v_issuer RECORD;
    v_portfolio RECORD;
    v_current_price NUMERIC;
    v_price_step NUMERIC;
    v_current_supply NUMERIC;
    v_total_usdp NUMERIC;
    v_tokens_received NUMERIC;
    v_usdp_received NUMERIC;
    v_new_price NUMERIC;
    v_new_supply NUMERIC;
    v_new_total_usdp NUMERIC;
    v_avg_price NUMERIC;
    v_new_pv_amount NUMERIC;
    v_new_cost_basis NUMERIC;
    v_transaction_id UUID;
    v_result jsonb;
BEGIN
    -- Get the next pending order (with row lock)
    SELECT * INTO v_order
    FROM public.queue
    WHERE status = 'pending'
    ORDER BY date ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    -- No pending orders
    IF v_order IS NULL THEN
        RETURN jsonb_build_object('processed', false, 'message', 'No pending orders');
    END IF;
    
    -- Mark as processing
    UPDATE public.queue 
    SET status = 'processing', updated_at = NOW()
    WHERE id = v_order.id;
    
    BEGIN
        -- Get user data
        SELECT * INTO v_user
        FROM public.users
        WHERE user_id = v_order.user_id;
        
        IF v_user IS NULL THEN
            RAISE EXCEPTION 'User not found: %', v_order.user_id;
        END IF;
        
        -- Get issuer trading data
        SELECT * INTO v_issuer
        FROM public.issuer_trading
        WHERE ticker = v_order.ticker;
        
        IF v_issuer IS NULL THEN
            RAISE EXCEPTION 'Issuer not found: %', v_order.ticker;
        END IF;
        
        v_current_price := v_issuer.current_price;
        v_price_step := v_issuer.price_step;
        v_current_supply := v_issuer.current_supply;
        v_total_usdp := v_issuer.total_usdp;
        
        -- Get portfolio (may not exist)
        SELECT * INTO v_portfolio
        FROM public.portfolio
        WHERE user_id = v_order.user_id AND ticker = v_order.ticker;
        
        IF v_order.order_type = 'buy' THEN
            -- Check user has enough USDP
            IF v_user.usdp_balance < v_order.amount_usdp THEN
                RAISE EXCEPTION 'Insufficient USDP balance. Has: %, Needs: %', 
                    v_user.usdp_balance, v_order.amount_usdp;
            END IF;
            
            -- Calculate tokens received using bonding curve formula
            -- Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
            v_tokens_received := (
                -v_current_price + 
                SQRT(v_current_price * v_current_price + 2 * v_price_step * v_order.amount_usdp)
            ) / v_price_step;
            
            v_new_price := v_current_price + (v_tokens_received * v_price_step);
            v_new_supply := v_current_supply + v_tokens_received;
            v_new_total_usdp := v_total_usdp + v_order.amount_usdp;
            v_avg_price := CASE WHEN v_tokens_received > 0 
                THEN v_order.amount_usdp / v_tokens_received 
                ELSE 0 END;
            
            -- Calculate new portfolio values
            IF v_portfolio IS NOT NULL THEN
                v_new_pv_amount := v_portfolio.pv_amount + v_tokens_received;
                v_new_cost_basis := (
                    v_portfolio.pv_amount * v_portfolio.avg_cost_basis + 
                    v_tokens_received * v_avg_price
                ) / v_new_pv_amount;
            ELSE
                v_new_pv_amount := v_tokens_received;
                v_new_cost_basis := v_avg_price;
            END IF;
            
            -- Update issuer trading
            UPDATE public.issuer_trading
            SET current_price = v_new_price,
                current_supply = v_new_supply,
                total_usdp = v_new_total_usdp,
                updated_at = NOW()
            WHERE ticker = v_order.ticker;
            
            -- Create transaction record
            INSERT INTO public.transactions (
                user_id, amount_usdp, ticker, order_type, status,
                avg_price_paid, pv_traded, start_price, end_price, date, queue_id
            ) VALUES (
                v_order.user_id, v_order.amount_usdp, v_order.ticker, 'buy', 'completed',
                v_avg_price, v_tokens_received, v_current_price, v_new_price, NOW(), v_order.id
            ) RETURNING id INTO v_transaction_id;
            
            -- Update user USDP balance
            UPDATE public.users
            SET usdp_balance = usdp_balance - v_order.amount_usdp,
                updated_at = NOW()
            WHERE user_id = v_order.user_id;
            
            -- Upsert portfolio
            INSERT INTO public.portfolio (user_id, ticker, pv_amount, avg_cost_basis, updated_at)
            VALUES (v_order.user_id, v_order.ticker, v_new_pv_amount, v_new_cost_basis, NOW())
            ON CONFLICT (user_id, ticker) 
            DO UPDATE SET 
                pv_amount = EXCLUDED.pv_amount,
                avg_cost_basis = EXCLUDED.avg_cost_basis,
                updated_at = NOW();
            
            v_result := jsonb_build_object(
                'processed', true,
                'order_id', v_order.id,
                'order_type', 'buy',
                'tokens_received', v_tokens_received,
                'usdp_spent', v_order.amount_usdp,
                'transaction_id', v_transaction_id
            );
            
        ELSE -- SELL order
            -- Check user has enough PV tokens
            IF v_portfolio IS NULL OR v_portfolio.pv_amount < v_order.amount_pv THEN
                RAISE EXCEPTION 'Insufficient PV balance. Has: %, Needs: %', 
                    COALESCE(v_portfolio.pv_amount, 0), v_order.amount_pv;
            END IF;
            
            -- Calculate USDP received
            -- Average price = (start_price + end_price) / 2
            v_new_price := v_current_price - (v_order.amount_pv * v_price_step);
            IF v_new_price < 0 THEN
                RAISE EXCEPTION 'Trade would result in negative price';
            END IF;
            
            v_avg_price := (v_current_price + v_new_price) / 2;
            v_usdp_received := v_avg_price * v_order.amount_pv;
            v_new_supply := v_current_supply - v_order.amount_pv;
            v_new_total_usdp := v_total_usdp - v_usdp_received;
            
            IF v_new_total_usdp < 0 THEN
                RAISE EXCEPTION 'Trade would result in negative USDP pool';
            END IF;
            
            -- Calculate new portfolio values
            v_new_pv_amount := v_portfolio.pv_amount - v_order.amount_pv;
            v_new_cost_basis := CASE WHEN v_new_pv_amount > 0 
                THEN v_portfolio.avg_cost_basis 
                ELSE 0 END;
            
            -- Update issuer trading
            UPDATE public.issuer_trading
            SET current_price = v_new_price,
                current_supply = v_new_supply,
                total_usdp = v_new_total_usdp,
                updated_at = NOW()
            WHERE ticker = v_order.ticker;
            
            -- Create transaction record
            INSERT INTO public.transactions (
                user_id, amount_usdp, ticker, order_type, status,
                avg_price_paid, pv_traded, start_price, end_price, date, queue_id
            ) VALUES (
                v_order.user_id, v_usdp_received, v_order.ticker, 'sell', 'completed',
                v_avg_price, v_order.amount_pv, v_current_price, v_new_price, NOW(), v_order.id
            ) RETURNING id INTO v_transaction_id;
            
            -- Update user USDP balance
            UPDATE public.users
            SET usdp_balance = usdp_balance + v_usdp_received,
                updated_at = NOW()
            WHERE user_id = v_order.user_id;
            
            -- Update portfolio
            UPDATE public.portfolio
            SET pv_amount = v_new_pv_amount,
                avg_cost_basis = v_new_cost_basis,
                updated_at = NOW()
            WHERE user_id = v_order.user_id AND ticker = v_order.ticker;
            
            v_result := jsonb_build_object(
                'processed', true,
                'order_id', v_order.id,
                'order_type', 'sell',
                'tokens_sold', v_order.amount_pv,
                'usdp_received', v_usdp_received,
                'transaction_id', v_transaction_id
            );
        END IF;
        
        -- Mark order as completed
        UPDATE public.queue 
        SET status = 'completed', updated_at = NOW()
        WHERE id = v_order.id;
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Mark order as failed
        UPDATE public.queue 
        SET status = 'failed', updated_at = NOW()
        WHERE id = v_order.id;
        
        RETURN jsonb_build_object(
            'processed', false,
            'order_id', v_order.id,
            'error', SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_next_queue_order() TO service_role;

-- Comment
COMMENT ON FUNCTION process_next_queue_order IS 'Processes the next pending order from the queue. Called by process_all_pending_orders().';

-- Function to process ALL pending orders in a single call
CREATE OR REPLACE FUNCTION process_all_pending_orders()
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_all_results jsonb := '[]'::jsonb;
    v_processed_count INTEGER := 0;
    v_success_count INTEGER := 0;
    v_fail_count INTEGER := 0;
BEGIN
    -- Process orders until none remain
    LOOP
        v_result := process_next_queue_order();
        
        -- Check if we processed anything
        IF NOT (v_result->>'processed')::boolean THEN
            EXIT;
        END IF;
        
        v_all_results := v_all_results || v_result;
        v_processed_count := v_processed_count + 1;
        
        IF v_result->>'error' IS NULL THEN
            v_success_count := v_success_count + 1;
        ELSE
            v_fail_count := v_fail_count + 1;
        END IF;
        
        -- Safety limit to prevent infinite loops
        IF v_processed_count >= 100 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'total_processed', v_processed_count,
        'successful', v_success_count,
        'failed', v_fail_count,
        'results', v_all_results
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_all_pending_orders() TO service_role;

-- Comment
COMMENT ON FUNCTION process_all_pending_orders IS 'Processes all pending orders from the queue. Called by Edge Function via Database Webhook.';

-- =============================================================================
-- NOTE: Queue processing is NOT done via pg_cron
-- Instead, it uses an event-driven model:
-- 1. New order inserted into queue table
-- 2. Database Webhook triggers Edge Function
-- 3. Edge Function calls process_all_pending_orders()
-- 4. Edge Function goes back to sleep
--
-- This is more efficient and provides instant processing!
-- =============================================================================

-- =============================================================================
-- JOB 3: Cleanup old completed/failed queue entries (daily at 3 AM)
-- Keeps queue table size manageable
-- =============================================================================
SELECT cron.schedule(
    'cleanup-old-queue-entries',             -- job name
    '0 3 * * *',                             -- daily at 3 AM
    $$
    DELETE FROM public.queue
    WHERE status IN ('completed', 'failed')
      AND updated_at < NOW() - INTERVAL '7 days'
    $$
);

-- =============================================================================
-- SETUP INSTRUCTIONS
-- =============================================================================
-- 
-- 1. ENABLE pg_cron in Supabase Dashboard:
--    - Go to Database > Extensions
--    - Search for "pg_cron"
--    - Click Enable
--
-- 2. DEPLOY the Edge Function:
--    npx supabase functions deploy process-queue --project-ref YOUR_PROJECT_REF
--
-- 3. SET the service role secret:
--    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
--
-- 4. CREATE Database Webhook in Supabase Dashboard:
--    - Go to Database > Webhooks
--    - Click "Create a new webhook"
--    - Name: process-queue-webhook
--    - Table: queue
--    - Events: INSERT
--    - Type: Supabase Edge Functions
--    - Edge Function: process-queue
--    - HTTP Headers: (leave default)
--
-- 5. VERIFY the setup:
--    - Insert a test order into the queue table
--    - Check Edge Function logs in Dashboard
--
-- =============================================================================
-- Useful queries for monitoring
-- =============================================================================

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View recent cron job runs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Unschedule a job:
-- SELECT cron.unschedule('job-name');

-- Check queue status:
-- SELECT status, COUNT(*) FROM public.queue GROUP BY status;

-- Check recent cache refresh:
-- SELECT ticker, cached_at FROM public.issuer_stats_cache ORDER BY cached_at DESC LIMIT 5;
