-- Migration: Add admin RLS policies for issuer_details table
-- SELECT is allowed for everyone, INSERT/UPDATE/DELETE only for admins

-- ============================================
-- ISSUER_DETAILS TABLE - Admin RLS Policies
-- ============================================

-- Admin can INSERT new issuer details
CREATE POLICY "Admin can insert issuer_details"
ON public.issuer_details
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can UPDATE issuer details
CREATE POLICY "Admin can update issuer_details"
ON public.issuer_details
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Admin can DELETE issuer details
CREATE POLICY "Admin can delete issuer_details"
ON public.issuer_details
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
);

-- Service role has full access (for backend operations via admin client)
CREATE POLICY "Service role full access to issuer_details"
ON public.issuer_details
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON POLICY "Admin can insert issuer_details" ON public.issuer_details IS 
    'Only users with admin claim can insert new issuer records';
COMMENT ON POLICY "Admin can update issuer_details" ON public.issuer_details IS 
    'Only users with admin claim can update issuer records';
COMMENT ON POLICY "Admin can delete issuer_details" ON public.issuer_details IS 
    'Only users with admin claim can delete issuer records';
COMMENT ON POLICY "Service role full access to issuer_details" ON public.issuer_details IS 
    'Service role (backend) has full access for admin operations';
