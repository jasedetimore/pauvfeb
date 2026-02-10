-- ============================================================
-- Migration: Auto-create issuer_links row on issuer_details insert
-- Description: Trigger function that creates a blank issuer_links
--              row whenever a new issuer_details row is inserted
-- ============================================================

-- Function to auto-create issuer_links row
CREATE OR REPLACE FUNCTION public.create_issuer_links_on_details_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.issuer_links (ticker)
    VALUES (NEW.ticker)
    ON CONFLICT (ticker) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on issuer_details
CREATE TRIGGER trg_create_issuer_links_on_details_insert
    AFTER INSERT ON public.issuer_details
    FOR EACH ROW
    EXECUTE FUNCTION public.create_issuer_links_on_details_insert();

-- Backfill: create issuer_links rows for any existing issuers that don't have one
INSERT INTO public.issuer_links (ticker)
SELECT d.ticker
FROM public.issuer_details d
LEFT JOIN public.issuer_links l ON l.ticker = d.ticker
WHERE l.ticker IS NULL;
