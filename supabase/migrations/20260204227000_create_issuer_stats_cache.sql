-- Create issuer_stats_cache table
-- This table caches pre-computed issuer statistics for fast retrieval on the main page
-- Data is refreshed every 5 minutes to balance freshness with performance

CREATE TABLE IF NOT EXISTS public.issuer_stats_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    current_price NUMERIC NOT NULL DEFAULT 0,
    price_1h_change NUMERIC,
    price_24h_change NUMERIC,
    price_7d_change NUMERIC,
    volume_24h NUMERIC NOT NULL DEFAULT 0,
    holders INTEGER NOT NULL DEFAULT 0,
    market_cap NUMERIC NOT NULL DEFAULT 0,
    circulating_supply NUMERIC NOT NULL DEFAULT 0,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to issuer_details
    CONSTRAINT fk_issuer_stats_cache_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.issuer_stats_cache ENABLE ROW LEVEL SECURITY;

-- Create index on ticker for fast lookups
CREATE INDEX idx_issuer_stats_cache_ticker ON public.issuer_stats_cache(ticker);

-- Create index on cached_at for cleanup queries
CREATE INDEX idx_issuer_stats_cache_cached_at ON public.issuer_stats_cache(cached_at DESC);

-- Add a comment to the table
COMMENT ON TABLE public.issuer_stats_cache IS 'Cached issuer statistics refreshed every 5 minutes for fast main page loading';

-- RLS Policy: Allow public read access (this is public market data)
CREATE POLICY "Allow public read access to issuer_stats_cache"
ON public.issuer_stats_cache
FOR SELECT
TO public
USING (true);

-- RLS Policy: Only service role can manage cache (insert/update/delete)
CREATE POLICY "Allow service role to manage issuer_stats_cache"
ON public.issuer_stats_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
