-- Backfill existing auth users into public.users table
-- This is a one-time migration to populate users that were created before the trigger

INSERT INTO public.users (user_id, username, usdp_balance)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    1000
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.users)
ON CONFLICT (user_id) DO NOTHING;
