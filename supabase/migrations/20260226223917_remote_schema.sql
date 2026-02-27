alter table "public"."deposits" drop constraint "deposits_amount_positive";

alter table "public"."deposits" drop constraint "fk_deposits_user_id";

alter table "public"."deposits" add constraint "deposits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."deposits" validate constraint "deposits_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_issuer_links_on_details_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.issuer_links (ticker)
    VALUES (NEW.ticker)
    ON CONFLICT (ticker) DO NOTHING;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'PV-' || upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.waitlist WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_issuer_stats()
 RETURNS TABLE(out_ticker text, out_current_price numeric, out_price_1h_change numeric, out_price_24h_change numeric, out_price_7d_change numeric, out_volume_24h numeric, out_holders integer, out_market_cap numeric, out_circulating_supply numeric, out_cached_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        isc.ticker,
        isc.current_price,
        isc.price_1h_change,
        isc.price_24h_change,
        isc.price_7d_change,
        isc.volume_24h,
        isc.holders,
        isc.market_cap,
        isc.circulating_supply,
        isc.cached_at
    FROM public.issuer_stats_cache isc
    ORDER BY isc.market_cap DESC NULLS LAST;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_chart_data_adaptive(p_ticker text, p_start_time timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_end_time timestamp with time zone DEFAULT now(), p_max_points integer DEFAULT 200)
 RETURNS TABLE(bucket timestamp with time zone, open numeric, high numeric, low numeric, close numeric, volume numeric, avg_price numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_issuer_stats(p_ticker text)
 RETURNS TABLE(out_ticker text, out_current_price numeric, out_price_1h_change numeric, out_price_24h_change numeric, out_price_7d_change numeric, out_volume_24h numeric, out_holders integer, out_market_cap numeric, out_circulating_supply numeric, out_cached_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        isc.ticker,
        isc.current_price,
        isc.price_1h_change,
        isc.price_24h_change,
        isc.price_7d_change,
        isc.volume_24h,
        isc.holders,
        isc.market_cap,
        isc.circulating_supply,
        isc.cached_at
    FROM public.issuer_stats_cache isc
    WHERE isc.ticker = UPPER(p_ticker);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_latest_price(p_ticker text)
 RETURNS TABLE(out_ticker text, out_price numeric, out_supply numeric, out_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_ohlc_data(p_ticker text, p_interval interval DEFAULT '00:05:00'::interval, p_start_time timestamp with time zone DEFAULT (now() - '24:00:00'::interval), p_end_time timestamp with time zone DEFAULT now())
 RETURNS TABLE(bucket timestamp with time zone, open numeric, high numeric, low numeric, close numeric, volume numeric, avg_price numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_price_change(p_ticker text, p_period interval DEFAULT '24:00:00'::interval)
 RETURNS TABLE(current_price numeric, previous_price numeric, price_change numeric, price_change_percent numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_waitlist_neighbors(p_user_id uuid, p_radius integer DEFAULT 2)
 RETURNS TABLE("position" integer, username text, "userId" uuid, "isCurrentUser" boolean, "referralCode" text, "referralCount" integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_position INT;
BEGIN
    SELECT w.position INTO v_position
    FROM public.waitlist w
    WHERE w.user_id = p_user_id;

    IF v_position IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        w.position,
        u.username,
        w.user_id,
        (w.user_id = p_user_id) AS "isCurrentUser",
        CASE WHEN w.user_id = p_user_id THEN w.referral_code ELSE NULL END AS "referralCode",
        CASE WHEN w.user_id = p_user_id THEN w.referral_count ELSE 0 END AS "referralCount"
    FROM public.waitlist w
    JOIN public.users u ON u.user_id = w.user_id
    WHERE w.position BETWEEN v_position - p_radius AND v_position + p_radius
    ORDER BY w.position;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (user_id, username, usdp_balance)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        1000  -- Starting USDP balance
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_waitlist_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_next_position INT;
BEGIN
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position FROM public.waitlist;
    INSERT INTO public.waitlist (user_id, position, referral_code)
    VALUES (NEW.user_id, v_next_position, public.generate_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean,
    false
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_by_id(check_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (
      SELECT (raw_app_meta_data ->> 'admin')::boolean
      FROM auth.users
      WHERE id = check_user_id
    ),
    false
  );
$function$
;

CREATE OR REPLACE FUNCTION public.log_audit_entry(p_admin_id uuid, p_action text, p_target_table text, p_target_id text DEFAULT NULL::text, p_old_value jsonb DEFAULT NULL::jsonb, p_new_value jsonb DEFAULT NULL::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_request_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.security_audit (
        admin_id,
        action,
        target_table,
        target_id,
        old_value,
        new_value,
        metadata,
        ip_address,
        user_agent,
        request_id
    ) VALUES (
        p_admin_id,
        p_action,
        p_target_table,
        p_target_id,
        p_old_value,
        p_new_value,
        p_metadata,
        p_ip_address,
        p_user_agent,
        p_request_id
    )
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_all_pending_orders()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_next_queue_order()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_referral(p_new_user_id uuid, p_referral_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_referrer_user_id UUID;
  v_referrer_old_position INT;
  v_referrer_new_position INT;
  v_already_referred BOOLEAN;
BEGIN
  -- Guard: new user must not already have a referrer
  SELECT (referred_by IS NOT NULL) INTO v_already_referred
  FROM public.waitlist
  WHERE user_id = p_new_user_id;

  IF v_already_referred IS TRUE THEN
    RETURN json_build_object('error', 'Already referred');
  END IF;

  -- Look up the referrer
  SELECT user_id, position INTO v_referrer_user_id, v_referrer_old_position
  FROM public.waitlist
  WHERE referral_code = p_referral_code;

  IF v_referrer_user_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid referral code');
  END IF;

  IF v_referrer_user_id = p_new_user_id THEN
    RETURN json_build_object('error', 'Cannot refer yourself');
  END IF;

  -- Mark the new user as referred
  UPDATE public.waitlist
  SET referred_by = v_referrer_user_id
  WHERE user_id = p_new_user_id;

  -- Increment referrer's count
  UPDATE public.waitlist
  SET referral_count = referral_count + 1
  WHERE user_id = v_referrer_user_id;

  -- Calculate new position (minimum 1)
  v_referrer_new_position := GREATEST(1, v_referrer_old_position - 50);

  -- No movement needed if already at or above target
  IF v_referrer_new_position >= v_referrer_old_position THEN
    RETURN json_build_object('success', true, 'new_position', v_referrer_old_position);
  END IF;

  -- Shift everyone in [new_position, old_position-1] down by 1
  UPDATE public.waitlist
  SET position = position + 1
  WHERE position >= v_referrer_new_position
    AND position < v_referrer_old_position
    AND user_id != v_referrer_user_id;

  -- Move referrer into the vacated slot
  UPDATE public.waitlist
  SET position = v_referrer_new_position
  WHERE user_id = v_referrer_user_id;

  RETURN json_build_object('success', true, 'new_position', v_referrer_new_position);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_price_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Only record if price or supply actually changed
    IF OLD.current_price IS DISTINCT FROM NEW.current_price 
       OR OLD.current_supply IS DISTINCT FROM NEW.current_supply THEN
        INSERT INTO public.price_history (ticker, price, supply, timestamp)
        VALUES (NEW.ticker, NEW.current_price, NEW.current_supply, NOW());
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_price_history_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.price_history (ticker, price, supply, timestamp)
    VALUES (NEW.ticker, NEW.current_price, NEW.current_supply, NOW());
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_issuer_stats_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_admin_claim(target_user_id uuid, is_admin boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_metadata jsonb;
  updated_metadata jsonb;
BEGIN
  -- Get current app_metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb)
  INTO current_metadata
  FROM auth.users
  WHERE id = target_user_id;
  
  IF current_metadata IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
  
  -- Update the admin claim
  updated_metadata := current_metadata || jsonb_build_object('admin', is_admin);
  
  -- Update the user's app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = updated_metadata
  WHERE id = target_user_id;
  
  -- Log this action to security audit
  INSERT INTO public.security_audit (
    admin_id,
    action,
    target_table,
    target_id,
    old_value,
    new_value,
    ip_address
  ) VALUES (
    auth.uid(),
    'SET_ADMIN_CLAIM',
    'auth.users',
    target_user_id::text,
    jsonb_build_object('admin', current_metadata ->> 'admin'),
    jsonb_build_object('admin', is_admin),
    NULL
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'admin', is_admin
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_issuer_trading_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_payment_transactions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_portfolio_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;


  create policy "Users can insert their own deposits"
  on "public"."deposits"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can view their own deposits"
  on "public"."deposits"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Allow public read access"
  on "public"."issuer_details"
  as permissive
  for select
  to anon, authenticated
using (true);


--CREATE TRIGGER "process-queue-webhook" AFTER INSERT ON public.queue FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://bsrizjihqrywmukqsess.supabase.co/functions/v1/process-queue', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcml6amlocXJ5d211a3FzZXNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxMjE1OCwiZXhwIjoyMDg1Nzg4MTU4fQ.GccKPJ4pH7Fya3PqzpGHMwCN2m5F5qPKWjyk2pl_sQg"}', '{}', '5000');


