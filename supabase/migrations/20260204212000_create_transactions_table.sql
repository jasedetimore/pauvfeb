-- Create transactions table
-- Stores completed transactions after successful processing from the queue

CREATE TYPE transaction_status AS ENUM ('completed', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount_usdp NUMERIC NOT NULL,
    ticker TEXT NOT NULL,
    order_type order_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'completed',
    avg_price_paid NUMERIC NOT NULL,
    pv_traded NUMERIC NOT NULL,
    start_price NUMERIC NOT NULL,
    end_price NUMERIC NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    queue_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to issuer_details
    CONSTRAINT fk_transactions_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE,
    
    -- Foreign key to auth.users
    CONSTRAINT fk_transactions_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    
    -- Foreign key to queue (optional - links to original order)
    CONSTRAINT fk_transactions_queue_id 
        FOREIGN KEY (queue_id) 
        REFERENCES public.queue(id) 
        ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_transactions_ticker ON public.transactions(ticker);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_order_type ON public.transactions(order_type);

-- Add a comment to the table
COMMENT ON TABLE public.transactions IS 'Stores completed transactions after successful order processing';

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Public can view aggregate transaction data (for charts/history)
-- Note: This doesn't expose user_id in the policy, just allows reading
CREATE POLICY "Public can view transaction history"
ON public.transactions
FOR SELECT
TO public
USING (true);

-- RLS Policy: Service role has full access for transaction creation
CREATE POLICY "Service role can manage transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();
