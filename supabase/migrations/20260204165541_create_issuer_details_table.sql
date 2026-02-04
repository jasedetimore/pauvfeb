-- Create IssuerDetails table
CREATE TABLE IF NOT EXISTS public.issuer_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    bio TEXT,
    headline TEXT,
    tag TEXT,
    photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.issuer_details ENABLE ROW LEVEL SECURITY;

-- Create an index on ticker for faster lookups
CREATE INDEX idx_issuer_details_ticker ON public.issuer_details(ticker);

-- Add a comment to the table
COMMENT ON TABLE public.issuer_details IS 'Stores issuer information including name, ticker symbol, bio, and branding';
