-- Add user_id to issuer_requests so we can track if the submitter was already a logged-in user.
-- When user_id is NOT NULL, the approval flow skips the invite email and directly links the account.

ALTER TABLE public.issuer_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_issuer_requests_user_id ON public.issuer_requests(user_id);

COMMENT ON COLUMN public.issuer_requests.user_id IS 'If set, the requester was already a logged-in user when submitting. Approval will link directly instead of sending an invite.';
