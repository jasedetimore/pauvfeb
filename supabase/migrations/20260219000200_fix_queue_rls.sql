-- Migration: Fix Queue Injection Vulnerability
-- Revoke policies that allow users to INSERT orders directly into the queue.
-- Orders must be placed via a secure server-side API that performs validation before insertion.

-- 1. Drop the insecure policy
DROP POLICY IF EXISTS "Users can insert their own queue orders" ON public.queue;

-- 2. Keep the view policy
-- Users still need to see their own orders (pending, completed, etc.)
-- "Users can view their own queue orders" - KEEP

-- 3. Review update policy
-- "Users can update their own pending orders" - This allows users to cancel orders (if logic permits).
-- Ideally, cancellation should also be an API call to ensure race conditions are handled, 
-- but for now, we will strictly block INSERT (creation of fake orders).
-- We will optionally restrict UPDATE if we want to force cancellation via API too.
-- For this step, we'll leave UPDATE for cancellation but strictly block INSERT.

COMMENT ON TABLE public.queue IS 'Order queue. DIRECT INSERT BLOCKED. Orders must be placed via Trading API.';
