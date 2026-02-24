-- Update get_chart_data_adaptive to prepend a carry-forward price point
-- When a timeframe has few/one data points, this pulls in the last known price
-- from just before the window so the chart shows movement instead of flat line.

CREATE OR REPLACE FUNCTION get_chart_data_adaptive(
    p_ticker TEXT,
    p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
    p_end_time TIMESTAMPTZ DEFAULT NOW(),
    p_max_points INT DEFAULT 200
)
RETURNS TABLE (
    bucket TIMESTAMPTZ,
    open DECIMAL,
    high DECIMAL,
    low DECIMAL,
    close DECIMAL,
    volume DECIMAL,
    avg_price DECIMAL
) AS $$
DECLARE
    v_count INT;
    v_interval INTERVAL;
    v_span_seconds DOUBLE PRECISION;
    v_prev_price DECIMAL;
    v_prev_ts TIMESTAMPTZ;
    v_base_price DECIMAL;
    v_created_at TIMESTAMPTZ;
    v_earliest_ph TIMESTAMPTZ;
    v_prepend_price DECIMAL;
    v_prepend_ts TIMESTAMPTZ;
BEGIN
    -- 1. Look for the most recent price_history row BEFORE the query window
    SELECT ph.price, ph.timestamp
      INTO v_prev_price, v_prev_ts
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
      AND ph.timestamp < p_start_time
    ORDER BY ph.timestamp DESC
    LIMIT 1;

    -- 2. Fetch the issuer's starting (base) price and creation time as fallback
    SELECT it.base_price, it.created_at
      INTO v_base_price, v_created_at
    FROM public.issuer_trading it
    WHERE it.ticker = p_ticker;

    -- 3. Earliest price_history row in the window
    SELECT MIN(ph.timestamp) INTO v_earliest_ph
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
      AND ph.timestamp >= p_start_time
      AND ph.timestamp <= p_end_time;

    -- 4. Count raw rows in the window
    SELECT COUNT(*)::INT INTO v_count
    FROM public.price_history ph
    WHERE ph.ticker = p_ticker
      AND ph.timestamp >= p_start_time
      AND ph.timestamp <= p_end_time;

    -- ----------------------------------------------------------------
    -- Determine which carry-forward / origin point to prepend
    -- Priority: previous price_history row > base_price at created_at
    -- ----------------------------------------------------------------
    v_prepend_price := NULL;
    v_prepend_ts    := NULL;

    IF v_prev_price IS NOT NULL THEN
        -- Use the last price before this window, placed right at window start
        v_prepend_price := v_prev_price;
        v_prepend_ts    := p_start_time;
    ELSIF v_base_price IS NOT NULL
          AND v_created_at IS NOT NULL
          AND v_created_at <= p_end_time
          AND (v_earliest_ph IS NULL OR v_earliest_ph > v_created_at + INTERVAL '1 second')
    THEN
        -- No previous history at all — use the base price at creation time
        v_prepend_price := v_base_price;
        v_prepend_ts    := GREATEST(v_created_at - INTERVAL '1 second', p_start_time);
    END IF;

    -- Emit the carry-forward point if we have one
    IF v_prepend_price IS NOT NULL THEN
        bucket    := v_prepend_ts;
        open      := v_prepend_price;
        high      := v_prepend_price;
        low       := v_prepend_price;
        close     := v_prepend_price;
        volume    := 0;
        avg_price := v_prepend_price;
        RETURN NEXT;
    END IF;

    -- If count is within the threshold, return raw data points (no bucketing)
    IF v_count <= p_max_points THEN
        RETURN QUERY
        SELECT
            ph.timestamp AS bucket,
            ph.price AS open,
            ph.price AS high,
            ph.price AS low,
            ph.price AS close,
            ABS(COALESCE(
                ph.supply - LAG(ph.supply) OVER (ORDER BY ph.timestamp ASC),
                0
            )) AS volume,
            ph.price AS avg_price
        FROM public.price_history ph
        WHERE ph.ticker = p_ticker
          AND ph.timestamp >= p_start_time
          AND ph.timestamp <= p_end_time
        ORDER BY ph.timestamp ASC;
    ELSE
        -- Calculate interval to produce ~p_max_points buckets
        v_span_seconds := EXTRACT(EPOCH FROM (p_end_time - p_start_time));
        v_interval := make_interval(secs => GREATEST(v_span_seconds / p_max_points, 1));

        -- Use bucketed aggregation
        RETURN QUERY
        WITH bucketed AS (
            SELECT
                date_bin(v_interval, ph.timestamp, p_start_time) AS time_bucket,
                ph.price,
                ph.supply,
                ph.timestamp,
                ROW_NUMBER() OVER (
                    PARTITION BY date_bin(v_interval, ph.timestamp, p_start_time)
                    ORDER BY ph.timestamp ASC
                ) AS rn_first,
                ROW_NUMBER() OVER (
                    PARTITION BY date_bin(v_interval, ph.timestamp, p_start_time)
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
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;
