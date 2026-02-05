-- Fix market cap calculation to use total_usdp from issuer_trading
-- instead of current_price * current_supply
-- total_usdp represents total USDP invested, which is the correct market cap figure

CREATE OR REPLACE FUNCTION refresh_issuer_stats_cache()
RETURNS void AS $$
DECLARE
    r RECORD;
    v_current_price NUMERIC;
    v_circulating_supply NUMERIC;
    v_price_1h_change NUMERIC;
    v_price_24h_change NUMERIC;
    v_price_7d_change NUMERIC;
    v_volume_24h NUMERIC;
    v_holders INTEGER;
    v_market_cap NUMERIC;
    v_price_change_result RECORD;
BEGIN
    -- Loop through all issuers with trading data
    FOR r IN 
        SELECT it.ticker, it.current_price, it.current_supply, it.total_usdp
        FROM public.issuer_trading it
        INNER JOIN public.issuer_details id ON it.ticker = id.ticker
    LOOP
        v_current_price := COALESCE(r.current_price, 0);
        v_circulating_supply := COALESCE(r.current_supply, 0);
        
        -- Get 1h price change
        SELECT price_change_percent INTO v_price_1h_change
        FROM get_price_change(r.ticker, '1 hour');
        
        -- Get 24h price change
        SELECT price_change_percent INTO v_price_24h_change
        FROM get_price_change(r.ticker, '24 hours');
        
        -- Get 7d price change
        SELECT price_change_percent INTO v_price_7d_change
        FROM get_price_change(r.ticker, '7 days');
        
        -- Calculate 24h volume from transactions
        SELECT COALESCE(SUM(ABS(amount_usdp)), 0) INTO v_volume_24h
        FROM public.transactions
        WHERE ticker = r.ticker
          AND status = 'completed'
          AND date >= NOW() - INTERVAL '24 hours';
        
        -- Count holders (unique users with positive balance)
        SELECT COUNT(DISTINCT user_id) INTO v_holders
        FROM public.portfolio
        WHERE ticker = r.ticker
          AND pv_amount > 0;
        
        -- Market cap = total USDP invested (from issuer_trading)
        v_market_cap := COALESCE(r.total_usdp, 0);
        
        -- Upsert into cache table
        INSERT INTO public.issuer_stats_cache (
            ticker,
            current_price,
            price_1h_change,
            price_24h_change,
            price_7d_change,
            volume_24h,
            holders,
            market_cap,
            circulating_supply,
            cached_at
        ) VALUES (
            r.ticker,
            v_current_price,
            v_price_1h_change,
            v_price_24h_change,
            v_price_7d_change,
            v_volume_24h,
            v_holders,
            v_market_cap,
            v_circulating_supply,
            NOW()
        )
        ON CONFLICT (ticker) 
        DO UPDATE SET
            current_price = EXCLUDED.current_price,
            price_1h_change = EXCLUDED.price_1h_change,
            price_24h_change = EXCLUDED.price_24h_change,
            price_7d_change = EXCLUDED.price_7d_change,
            volume_24h = EXCLUDED.volume_24h,
            holders = EXCLUDED.holders,
            market_cap = EXCLUDED.market_cap,
            circulating_supply = EXCLUDED.circulating_supply,
            cached_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_issuer_stats_cache IS 'Refreshes the issuer_stats_cache table with current metrics for all issuers. Market cap uses total_usdp invested. Run every 5 minutes.';
