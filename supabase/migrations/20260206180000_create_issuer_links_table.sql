-- ============================================================
-- Migration: Create issuer_links table
-- Description: Stores social media links for each issuer
-- Each issuer_details row gets a corresponding issuer_links row
-- ============================================================

CREATE TABLE IF NOT EXISTS public.issuer_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    instagram TEXT,
    tiktok TEXT,
    youtube TEXT,
    linkedin TEXT,
    x TEXT,
    threads TEXT,
    facebook TEXT,
    telegram TEXT,
    reddit TEXT,
    twitch TEXT,
    linktree TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_issuer_links_ticker
        FOREIGN KEY (ticker) REFERENCES public.issuer_details(ticker)
        ON DELETE CASCADE
);

-- Index on ticker for fast lookups
CREATE INDEX IF NOT EXISTS idx_issuer_links_ticker ON public.issuer_links(ticker);

-- Enable RLS
ALTER TABLE public.issuer_links ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view issuer social links)
CREATE POLICY "issuer_links_select_all"
    ON public.issuer_links
    FOR SELECT
    USING (true);

COMMENT ON TABLE public.issuer_links IS 'Social media links for issuers, one row per issuer ticker';
