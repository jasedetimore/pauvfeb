-- ============================================================
-- Migration: Add RLS policy for issuer_links owner update
-- Description: Allow issuers to read and update their own issuer_links row
--              by cross-referencing issuer_details.user_id = auth.uid()
-- ============================================================

-- Issuer can read own links
CREATE POLICY "Issuer can read own links"
    ON public.issuer_links
    FOR SELECT
    TO authenticated
    USING (
        ticker IN (
            SELECT d.ticker FROM public.issuer_details d WHERE d.user_id = auth.uid()
        )
    );

-- Issuer can update own links
CREATE POLICY "Issuer can update own links"
    ON public.issuer_links
    FOR UPDATE
    TO authenticated
    USING (
        ticker IN (
            SELECT d.ticker FROM public.issuer_details d WHERE d.user_id = auth.uid()
        )
    )
    WITH CHECK (
        ticker IN (
            SELECT d.ticker FROM public.issuer_details d WHERE d.user_id = auth.uid()
        )
    );
