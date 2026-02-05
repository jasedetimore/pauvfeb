-- Create OHLC (Open, High, Low, Close) chart data function
-- Uses PostgreSQL's date_bin function to group price history into time buckets
-- Supports multiple time intervals for different chart timeframes

-- Function to get OHLC data for a specific ticker
CREATE OR REPLACE FUNCTION get_ohlc_data(
    p_ticker TEXT,
    p_interval INTERVAL DEFAULT '5 minutes',
    p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    bucket TIMESTAMPTZ,
    open DECIMAL,
    high DECIMAL,
    low DECIMAL,
    close DECIMAL,
    volume DECIMAL,  -- Total supply change in the bucket
    avg_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH bucketed AS (
        SELECT
            date_bin(p_interval, ph.timestamp, p_start_time) AS time_bucket,
            ph.price,
            ph.supply,
            ph.timestamp,
            -- Row numbers for first/last in each bucket
            ROW_NUMBER() OVER (
                PARTITION BY date_bin(p_interval, ph.timestamp, p_start_time) 
                ORDER BY ph.timestamp ASC
            ) AS rn_first,
            ROW_NUMBER() OVER (
                PARTITION BY date_bin(p_interval, ph.timestamp, p_start_time) 
                ORDER BY ph.timestamp DESC
            ) AS rn_last
        FROM public.price_history ph
        WHERE ph.ticker = p_ticker
          AND ph.timestamp >= p_start_time
          AND ph.timestamp <= p_end_time
    ),
    aggregated AS (
        SELECT
            b.time_bucket,
            MAX(CASE WHEN b.rn_first = 1 THEN b.price END) AS open_price,
            MAX(b.price) AS high_price,
            MIN(b.price) AS low_price,
            MAX(CASE WHEN b.rn_last = 1 THEN b.price END) AS close_price,
            MAX(CASE WHEN b.rn_last = 1 THEN b.supply END) - 
                MAX(CASE WHEN b.rn_first = 1 THEN b.supply END) AS supply_change,
            AVG(b.price) AS average_price
        FROM bucketed b
        GROUP BY b.time_bucket
    )
    SELECT
        a.time_bucket AS bucket,
        a.open_price AS open,
        a.high_price AS high,
        a.low_price AS low,
        a.close_price AS close,
        ABS(COALESCE(a.supply_change, 0)) AS volume,
        a.average_price AS avg_price
    FROM aggregated a
    ORDER BY a.time_bucket ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to public for read access
GRANT EXECUTE ON FUNCTION get_ohlc_data(TEXT, INTERVAL, TIMESTAMPTZ, TIMESTAMPTZ) TO public;

-- Add comment explaining the function
COMMENT ON FUNCTION get_ohlc_data IS 'Returns OHLC candlestick data for charting. Supports configurable time intervals (1m, 5m, 15m, 1h, 4h, 1d).';

-- Example queries for different timeframes:
-- 1 minute candles for last hour:
--   SELECT * FROM get_ohlc_data('TICKER', '1 minute', NOW() - INTERVAL '1 hour');
-- 
-- 5 minute candles for last 24 hours:
--   SELECT * FROM get_ohlc_data('TICKER', '5 minutes', NOW() - INTERVAL '24 hours');
--
-- 1 hour candles for last week:
--   SELECT * FROM get_ohlc_data('TICKER', '1 hour', NOW() - INTERVAL '7 days');
--
-- Daily candles for last month:
--   SELECT * FROM get_ohlc_data('TICKER', '1 day', NOW() - INTERVAL '30 days');

-- Additional helper function to get the latest price snapshot for a ticker
CREATE OR REPLACE FUNCTION get_latest_price(p_ticker TEXT)
RETURNS TABLE (
    out_ticker TEXT,
    out_price DECIMAL,
    out_supply DECIMAL,
    out_timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.ticker,
        ph.price,
        ph.supply,
        ph.timestamp
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
    ORDER BY ph.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_price(TEXT) TO public;

-- Add comment
COMMENT ON FUNCTION get_latest_price IS 'Returns the most recent price snapshot for a given ticker';

-- Function to get price change percentage over a time period
CREATE OR REPLACE FUNCTION get_price_change(
    p_ticker TEXT,
    p_period INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
    current_price DECIMAL,
    previous_price DECIMAL,
    price_change DECIMAL,
    price_change_percent DECIMAL
) AS $$
DECLARE
    v_current DECIMAL;
    v_previous DECIMAL;
BEGIN
    -- Get current price
    SELECT ph.price INTO v_current
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
    ORDER BY ph.timestamp DESC
    LIMIT 1;
    
    -- Get price from p_period ago (closest to that time)
    SELECT ph.price INTO v_previous
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
      AND ph.timestamp <= NOW() - p_period
    ORDER BY ph.timestamp DESC
    LIMIT 1;
    
    -- If no previous price found, use the oldest available
    IF v_previous IS NULL THEN
        SELECT ph.price INTO v_previous
        FROM public.price_history ph
        WHERE ph.ticker = p_ticker
        ORDER BY ph.timestamp ASC
        LIMIT 1;
    END IF;
    
    RETURN QUERY
    SELECT 
        v_current,
        v_previous,
        v_current - COALESCE(v_previous, v_current),
        CASE 
            WHEN v_previous IS NOT NULL AND v_previous != 0 
            THEN ROUND(((v_current - v_previous) / v_previous) * 100, 2)
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_price_change(TEXT, INTERVAL) TO public;

-- Add comment
COMMENT ON FUNCTION get_price_change IS 'Returns price change and percentage change over a specified time period';
