-- Migration: Create custom claims functions for admin management
-- This allows setting {"admin": true} in JWT custom claims

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'admin')::boolean,
    false
  );
$$;

-- Function to check if a user is an admin by user_id
CREATE OR REPLACE FUNCTION public.is_admin_by_id(check_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT (raw_app_meta_data ->> 'admin')::boolean
      FROM auth.users
      WHERE id = check_user_id
    ),
    false
  );
$$;

-- Function to set admin claim for a user (can only be called by service_role)
-- This function updates the raw_app_meta_data in auth.users
CREATE OR REPLACE FUNCTION public.set_admin_claim(target_user_id UUID, is_admin boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_metadata jsonb;
  updated_metadata jsonb;
BEGIN
  -- Get current app_metadata
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb)
  INTO current_metadata
  FROM auth.users
  WHERE id = target_user_id;
  
  IF current_metadata IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
  
  -- Update the admin claim
  updated_metadata := current_metadata || jsonb_build_object('admin', is_admin);
  
  -- Update the user's app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = updated_metadata
  WHERE id = target_user_id;
  
  -- Log this action to security audit
  INSERT INTO public.security_audit (
    admin_id,
    action,
    target_table,
    target_id,
    old_value,
    new_value,
    ip_address
  ) VALUES (
    auth.uid(),
    'SET_ADMIN_CLAIM',
    'auth.users',
    target_user_id::text,
    jsonb_build_object('admin', current_metadata ->> 'admin'),
    jsonb_build_object('admin', is_admin),
    NULL
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'admin', is_admin
  );
END;
$$;

-- Revoke execute from public, only service_role can call this
REVOKE EXECUTE ON FUNCTION public.set_admin_claim(UUID, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_admin_claim(UUID, boolean) TO service_role;

-- Grant execute on is_admin functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_by_id(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.set_admin_claim IS 'Sets the admin custom claim for a user. Can only be called by service_role.';
COMMENT ON FUNCTION public.is_admin IS 'Returns true if the current user has admin claim in their JWT.';
COMMENT ON FUNCTION public.is_admin_by_id IS 'Returns true if the specified user has admin claim in their app_metadata.';
