-- Create price_history table
-- This table stores historical snapshots of price and supply for charting purposes
-- Snapshots are recorded automatically via trigger when issuer_trading is updated

CREATE TABLE IF NOT EXISTS public.price_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticker TEXT NOT NULL,
    price DECIMAL NOT NULL,
    supply DECIMAL NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to issuer_details for data integrity
    CONSTRAINT fk_price_history_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient querying
-- Composite index for ticker + timestamp (most common query pattern for charts)
CREATE INDEX idx_price_history_ticker_timestamp 
    ON public.price_history(ticker, timestamp DESC);

-- Index for time-based queries across all tickers
CREATE INDEX idx_price_history_timestamp 
    ON public.price_history(timestamp DESC);

-- Add a comment to the table
COMMENT ON TABLE public.price_history IS 'Historical price and supply snapshots for charting. Auto-populated via trigger on issuer_trading updates.';

-- RLS Policy: Allow public read access (price history is public data)
CREATE POLICY "Allow public read access to price_history"
ON public.price_history
FOR SELECT
TO public
USING (true);

-- RLS Policy: Only service role can insert (via trigger)
CREATE POLICY "Allow service role to manage price_history"
ON public.price_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
