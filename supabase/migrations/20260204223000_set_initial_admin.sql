-- Set admin claim for initial admin user (seeded at deployment time)
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"admin": true}'::jsonb 
WHERE id = '7354a8a3-87b3-4895-bcce-6ed92f6da7e5';

-- Log this action to the security audit table
INSERT INTO public.security_audit (
    admin_id,
    action,
    target_table,
    target_id,
    old_value,
    new_value,
    metadata
) VALUES (
    '7354a8a3-87b3-4895-bcce-6ed92f6da7e5',
    'GRANT_ADMIN',
    'auth.users',
    '7354a8a3-87b3-4895-bcce-6ed92f6da7e5',
    '{"admin": false}'::jsonb,
    '{"admin": true}'::jsonb,
    '{"reason": "Initial admin setup"}'::jsonb
);
