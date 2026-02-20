-- Migration: Fix Unrestricted Portfolio Manipulation Vulnerability
-- Revoke policies that allow users to INSERT or UPDATE their own portfolio records directly.
-- Portfolio updates should only happen via the server-side trading engine (service role).

-- 1. Drop the insecure policies
DROP POLICY IF EXISTS "Users can insert into their own portfolio" ON public.portfolio;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON public.portfolio;

-- 2. Ensure users can still VIEW their portfolio
-- (This policy should already exist, but ensuring it's there is good practice, or we just leave it alone if we didn't drop it)
-- The existing policy "Users can view their own portfolio" is sufficient for read access.

-- 3. Comments for documentation
COMMENT ON TABLE public.portfolio IS 'User portfolio holdings. DIRECT MODIFICATION DETECTED: READ-ONLY FOR USERS. Updates must occur via Trading Engine.';
