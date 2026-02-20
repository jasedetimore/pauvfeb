-- Migration: Fix Unrestricted Balance Modification Vulnerability
-- Revoke the overly permissive update policy on users table
-- Create a new policy that only allows updating specific non-financial columns

-- 1. Drop the insecure policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- 2. Create a secure policy that only allows updating safe columns
-- Note: PostgreSQL RLS doesn't support column-level granularity directly in the USING/WITH CHECK clauses easily for all cases,
-- but we can use a BEFORE UPDATE trigger to enforce it, OR use the newer PG features if available.
-- For Supabase/Postgres, the standard way to restrict columns is to separate them into different tables OR use a trigger.
-- However, we can also use a check constraint in the policy if we want to block the update entirely if forbidden columns are changed.

-- Approach: Use a BEFORE UPDATE trigger to prevent usdp_balance changes by non-service-role users
-- This is more robust than just RLS for column-level security in this context.

CREATE OR REPLACE FUNCTION public.protect_financial_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is not a service role (i.e. is an authenticated user)
    IF (auth.role() = 'authenticated') THEN
        -- If usdp_balance is being changed
        IF NEW.usdp_balance IS DISTINCT FROM OLD.usdp_balance THEN
            RAISE EXCEPTION 'You are not authorized to modify your USDP balance directly.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_protect_financial_columns ON public.users;
CREATE TRIGGER trigger_protect_financial_columns
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_financial_columns();

-- 3. Re-create the RLS policy for updates (now safe due to the trigger)
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TRIGGER trigger_protect_financial_columns ON public.users IS 'Prevents users from modifying their own USDP balance';
