-- Add is_hidden column to issuer_details table
-- When true, the issuer will not appear on the main page or in the search bar.

ALTER TABLE public.issuer_details
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for efficient filtering on the public API
CREATE INDEX IF NOT EXISTS idx_issuer_details_is_hidden
  ON public.issuer_details (is_hidden);
