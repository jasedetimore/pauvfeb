-- Migration: Add admin-only RLS policies for issuer_trading and transactions tables
-- SELECT is allowed for everyone, INSERT/UPDATE/DELETE only for admins

-- ============================================
-- ISSUER_TRADING TABLE - Admin RLS Policies
-- ============================================

-- Drop existing policies that might conflict (keeping the public read policy)
DROP POLICY IF EXISTS "Allow service role to manage issuer_trading" ON public.issuer_trading;

-- Admin can INSERT new issuer trading records
CREATE POLICY "Admin can insert issuer_trading"
ON public.issuer_trading
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can UPDATE issuer trading records
CREATE POLICY "Admin can update issuer_trading"
ON public.issuer_trading
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can DELETE issuer trading records
CREATE POLICY "Admin can delete issuer_trading"
ON public.issuer_trading
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Service role still has full access (for backend operations)
CREATE POLICY "Service role full access to issuer_trading"
ON public.issuer_trading
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TRANSACTIONS TABLE - Admin RLS Policies
-- ============================================

-- Drop existing policies that might conflict (keeping read policies)
DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions;

-- Admin can INSERT new transactions
CREATE POLICY "Admin can insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can UPDATE transactions
CREATE POLICY "Admin can update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can DELETE transactions
CREATE POLICY "Admin can delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Service role still has full access (for backend operations)
CREATE POLICY "Service role full access to transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON POLICY "Admin can insert issuer_trading" ON public.issuer_trading IS 
    'Only users with admin claim can insert new issuer trading records';
COMMENT ON POLICY "Admin can update issuer_trading" ON public.issuer_trading IS 
    'Only users with admin claim can update issuer trading records';
COMMENT ON POLICY "Admin can delete issuer_trading" ON public.issuer_trading IS 
    'Only users with admin claim can delete issuer trading records';

COMMENT ON POLICY "Admin can insert transactions" ON public.transactions IS 
    'Only users with admin claim can insert new transactions';
COMMENT ON POLICY "Admin can update transactions" ON public.transactions IS 
    'Only users with admin claim can update transactions';
COMMENT ON POLICY "Admin can delete transactions" ON public.transactions IS 
    'Only users with admin claim can delete transactions';
