-- Migration: Add missing performance indexes
-- Identified during performance audit

-- 1. Index for transactions.queue_id (FK)
-- Used for looking up transaction by order ID (common pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_queue_id ON public.transactions(queue_id);

-- 2. Index for launch_notifications.ticker (FK)
-- Used for filtering notifications by issuer and for efficient CASCADE deletes
CREATE INDEX IF NOT EXISTS idx_launch_notifications_ticker ON public.launch_notifications(ticker);
