-- Create deposits table for tracking USDP deposit transactions via Soap Pay

CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount_usdp NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to auth.users
    CONSTRAINT fk_deposits_user_id
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    -- Status must be one of the allowed values
    CONSTRAINT deposits_status_check
        CHECK (status IN ('pending', 'completed', 'failed')),

    -- Amount must be positive
    CONSTRAINT deposits_amount_positive
        CHECK (amount_usdp > 0)
);

-- Enable Row Level Security
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Users can read their own deposits
CREATE POLICY "Users can view own deposits"
    ON public.deposits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own deposits
CREATE POLICY "Users can create own deposits"
    ON public.deposits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own deposits (for status changes via API)
CREATE POLICY "Users can update own deposits"
    ON public.deposits
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can do anything (for webhooks / admin)
CREATE POLICY "Service role full access on deposits"
    ON public.deposits
    FOR ALL
    USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX idx_deposits_status ON public.deposits(status);
CREATE INDEX idx_deposits_provider_id ON public.deposits(provider_id);

COMMENT ON TABLE public.deposits IS 'Tracks USDP deposit transactions via Soap Pay';
