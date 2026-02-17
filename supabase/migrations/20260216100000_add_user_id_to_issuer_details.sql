-- Add user_id to issuer_details to link approved issuers to Supabase Auth accounts
-- This enables the "Magic Claim" onboarding flow

ALTER TABLE public.issuer_details
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_issuer_details_user_id ON public.issuer_details(user_id);

COMMENT ON COLUMN public.issuer_details.user_id IS 'Links the issuer to their Supabase Auth account (set during claim flow)';
