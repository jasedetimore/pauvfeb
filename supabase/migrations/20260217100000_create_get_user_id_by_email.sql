-- Migration: Create helper function to look up user ID by email
-- Used by admin API routes to map Cloudflare Zero Trust email to Supabase user ID for audit logging

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

-- Only service_role can call this function
REVOKE ALL ON FUNCTION public.get_user_id_by_email FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_id_by_email FROM anon;
REVOKE ALL ON FUNCTION public.get_user_id_by_email FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email TO service_role;

COMMENT ON FUNCTION public.get_user_id_by_email IS 'Look up a user UUID by email address. Used by admin routes to map Cloudflare Zero Trust email to Supabase user ID for audit logging.';
