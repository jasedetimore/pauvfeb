-- Migration: Add Batch Queue Processing Function
-- Optimizes queue throughput by processing multiple orders in a single RPC call

-- Atomic Batch Processor
CREATE OR REPLACE FUNCTION process_order_batch(p_batch_size INTEGER DEFAULT 50)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_result JSONB;
    v_results JSONB[] := ARRAY[]::JSONB[];
    v_success_count INTEGER := 0;
    v_fail_count INTEGER := 0;
BEGIN
    -- Loop through pending orders with row locking
    -- using concurrent-safe skip locked to allow multiple workers if needed (though node is single threaded here)
    -- Order by date ASC to ensure FIFO
    FOR v_order IN 
        SELECT * FROM public.queue 
        WHERE status = 'pending' 
        ORDER BY date ASC 
        LIMIT p_batch_size 
        FOR UPDATE SKIP LOCKED
    LOOP
        BEGIN
            -- Mark as processing
            UPDATE public.queue SET status = 'processing', updated_at = NOW() WHERE id = v_order.id;

            -- Execute the trade logic based on type
            IF v_order.order_type = 'buy' THEN
                v_result := execute_buy_order(
                    v_order.user_id,
                    v_order.ticker,
                    v_order.amount_usdp,
                    v_order.id
                );
            ELSE
                v_result := execute_sell_order(
                    v_order.user_id,
                    v_order.ticker,
                    v_order.amount_pv,
                    v_order.id
                );
            END IF;

            -- Handle Result
            IF (v_result->>'success')::boolean THEN
                UPDATE public.queue SET status = 'completed', updated_at = NOW() WHERE id = v_order.id;
                v_success_count := v_success_count + 1;
                v_results := array_append(v_results, jsonb_build_object(
                    'id', v_order.id, 
                    'success', true, 
                    'result', v_result
                ));
            ELSE
                UPDATE public.queue SET status = 'failed', updated_at = NOW() WHERE id = v_order.id;
                v_fail_count := v_fail_count + 1;
                 v_results := array_append(v_results, jsonb_build_object(
                    'id', v_order.id, 
                    'success', false, 
                    'error', v_result->>'error'
                ));
            END IF;

        EXCEPTION WHEN OTHERS THEN
            -- Catch unexpected errors for this specific order so batch doesn't fail
            UPDATE public.queue SET status = 'failed', updated_at = NOW() WHERE id = v_order.id;
            v_fail_count := v_fail_count + 1;
            v_results := array_append(v_results, jsonb_build_object(
                'id', v_order.id, 
                'success', false, 
                'error', SQLERRM
            ));
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'processed_count', v_success_count + v_fail_count,
        'success_count', v_success_count,
        'fail_count', v_fail_count,
        'results', v_results
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
