-- Add terms_accepted_at to users table
-- Records when the user agreed to Terms of Service & Privacy Policy during registration
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Add terms_accepted_at to issuer_requests table
-- Records when the requester agreed to Terms of Service & Privacy Policy + Issuer Terms
ALTER TABLE public.issuer_requests
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill existing users: set their terms_accepted_at to their created_at
-- (they implicitly agreed by using the platform before the checkbox existed)
UPDATE public.users
  SET terms_accepted_at = created_at
  WHERE terms_accepted_at IS NULL;

-- Backfill existing issuer requests similarly
UPDATE public.issuer_requests
  SET terms_accepted_at = created_at
  WHERE terms_accepted_at IS NULL;

-- Going forward, make terms_accepted_at NOT NULL for new users
-- (we don't alter NOT NULL on the column itself since backfill already covers existing rows
-- and the application layer will enforce it)
