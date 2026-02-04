-- Create portfolio table
-- Stores user holdings of PV tokens for each issuer

CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ticker TEXT NOT NULL,
    pv_amount NUMERIC NOT NULL DEFAULT 0,
    avg_cost_basis NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one entry per user per ticker
    CONSTRAINT portfolio_user_ticker_unique 
        UNIQUE (user_id, ticker),
    
    -- Foreign key to auth.users
    CONSTRAINT fk_portfolio_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    -- Foreign key to issuer_details
    CONSTRAINT fk_portfolio_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE,
    
    -- Ensure PV amount is non-negative
    CONSTRAINT portfolio_pv_amount_non_negative 
        CHECK (pv_amount >= 0),
    
    -- Ensure avg_cost_basis is non-negative
    CONSTRAINT portfolio_avg_cost_basis_non_negative 
        CHECK (avg_cost_basis >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_portfolio_user_id ON public.portfolio(user_id);
CREATE INDEX idx_portfolio_ticker ON public.portfolio(ticker);

-- Add a comment to the table
COMMENT ON TABLE public.portfolio IS 'User portfolio holdings - PV tokens and average cost basis per issuer';

-- RLS Policy: Users can view their own portfolio
CREATE POLICY "Users can view their own portfolio"
ON public.portfolio
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert into their own portfolio
CREATE POLICY "Users can insert into their own portfolio"
ON public.portfolio
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own portfolio
CREATE POLICY "Users can update their own portfolio"
ON public.portfolio
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role has full access
CREATE POLICY "Service role can manage portfolio"
ON public.portfolio
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_portfolio_updated_at
    BEFORE UPDATE ON public.portfolio
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_updated_at();
