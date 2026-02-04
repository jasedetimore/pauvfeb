-- Create issuer_trading table
-- This table tracks the current trading state for each issuer
-- Uses a linear bonding curve model: Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step

CREATE TABLE IF NOT EXISTS public.issuer_trading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL UNIQUE,
    current_supply NUMERIC NOT NULL DEFAULT 0,
    base_price NUMERIC NOT NULL DEFAULT 1.00,
    price_step NUMERIC NOT NULL DEFAULT 0.01,
    current_price NUMERIC NOT NULL DEFAULT 1.00,
    total_usdp NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to issuer_details
    CONSTRAINT fk_issuer_trading_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.issuer_trading ENABLE ROW LEVEL SECURITY;

-- Create an index on ticker for faster lookups
CREATE INDEX idx_issuer_trading_ticker ON public.issuer_trading(ticker);

-- Add a comment to the table
COMMENT ON TABLE public.issuer_trading IS 'Tracks current trading state for each issuer using linear bonding curve model';

-- RLS Policy: Allow public read access
CREATE POLICY "Allow public read access to issuer_trading"
ON public.issuer_trading
FOR SELECT
TO public
USING (true);

-- RLS Policy: Allow authenticated users to update (for trading operations)
CREATE POLICY "Allow service role to manage issuer_trading"
ON public.issuer_trading
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_issuer_trading_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_issuer_trading_updated_at
    BEFORE UPDATE ON public.issuer_trading
    FOR EACH ROW
    EXECUTE FUNCTION update_issuer_trading_updated_at();
