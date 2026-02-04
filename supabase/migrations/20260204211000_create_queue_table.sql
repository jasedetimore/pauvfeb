-- Create queue table (order queue)
-- Orders are placed here first, then processed to update issuer_trading and transactions

CREATE TYPE order_type AS ENUM ('buy', 'sell');
CREATE TYPE queue_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount_usdp NUMERIC NOT NULL DEFAULT 0,
    amount_pv NUMERIC NOT NULL DEFAULT 0,
    ticker TEXT NOT NULL,
    order_type order_type NOT NULL,
    status queue_status NOT NULL DEFAULT 'pending',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to issuer_details
    CONSTRAINT fk_queue_ticker 
        FOREIGN KEY (ticker) 
        REFERENCES public.issuer_details(ticker) 
        ON DELETE CASCADE,
    
    -- Foreign key to auth.users
    CONSTRAINT fk_queue_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX idx_queue_ticker ON public.queue(ticker);
CREATE INDEX idx_queue_user_id ON public.queue(user_id);
CREATE INDEX idx_queue_status ON public.queue(status);
CREATE INDEX idx_queue_date ON public.queue(date);

-- Add a comment to the table
COMMENT ON TABLE public.queue IS 'Order queue - orders are placed here before being processed';

-- RLS Policy: Users can view their own orders
CREATE POLICY "Users can view their own queue orders"
ON public.queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own orders
CREATE POLICY "Users can insert their own queue orders"
ON public.queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can cancel their own pending orders
CREATE POLICY "Users can update their own pending orders"
ON public.queue
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role has full access for order processing
CREATE POLICY "Service role can manage queue"
ON public.queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_queue_updated_at
    BEFORE UPDATE ON public.queue
    FOR EACH ROW
    EXECUTE FUNCTION update_queue_updated_at();
