-- Create issuer_invites table for the "Magic Claim" onboarding flow
-- Stores one-time-use invite tokens sent to approved issuers

CREATE TABLE IF NOT EXISTS public.issuer_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    issuer_id UUID NOT NULL REFERENCES public.issuer_details(id) ON DELETE CASCADE,
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.issuer_invites ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table (admin operations only)
-- No direct user access — all interactions go through server actions with service_role
CREATE POLICY "Service role full access on issuer_invites"
    ON public.issuer_invites
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Indexes
CREATE UNIQUE INDEX idx_issuer_invites_token ON public.issuer_invites(token);
CREATE INDEX idx_issuer_invites_email ON public.issuer_invites(email);
CREATE INDEX idx_issuer_invites_issuer_id ON public.issuer_invites(issuer_id);

COMMENT ON TABLE public.issuer_invites IS 'One-time-use invite tokens for the Magic Claim issuer onboarding flow';
