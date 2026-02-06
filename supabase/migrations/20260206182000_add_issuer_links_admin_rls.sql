-- ============================================================
-- Migration: Add admin RLS policies for issuer_links
-- Description: Admins can INSERT, UPDATE, DELETE issuer_links
--              Service role has full access
-- ============================================================

-- Admin INSERT
CREATE POLICY "issuer_links_admin_insert"
    ON public.issuer_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    );

-- Admin UPDATE
CREATE POLICY "issuer_links_admin_update"
    ON public.issuer_links
    FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    );

-- Admin DELETE
CREATE POLICY "issuer_links_admin_delete"
    ON public.issuer_links
    FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean = true
    );

-- Service role full access
CREATE POLICY "issuer_links_service_role_all"
    ON public.issuer_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
