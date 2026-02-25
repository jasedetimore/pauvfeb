-- Migration to add a function that checks for email existence securely
CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator
SET search_path = public -- Secure search path
AS $$
DECLARE
  email_exists boolean;
BEGIN
  -- Determine if any user exists in auth.users with the given email (case-insensitive)
  SELECT EXISTS(
    SELECT 1 
    FROM auth.users 
    WHERE lower(email) = lower(lookup_email)
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;

-- Since SECURITY DEFINER functions bypass RLS and grant elevated privileges,
-- restrict execution to authenticated users or the service_role only.
-- In our case, the API route uses service_role, so we can revoke from PUBLIC.
REVOKE EXECUTE ON FUNCTION public.check_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO service_role;
