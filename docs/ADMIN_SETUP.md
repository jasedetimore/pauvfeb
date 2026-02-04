# Admin Setup Guide for Pauv

This document provides instructions for setting up admin access to the Pauv platform.

## Prerequisites

1. Supabase project configured
2. User account created in Supabase Auth
3. Service role key available

## Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin-specific (SERVER ONLY - never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare Zero Trust (optional, for verification)
CF_ACCESS_TEAM_NAME=your-team-name
CF_ACCESS_AUD=your-application-aud-tag
```

## Step 1: Apply Database Migrations

Run the migrations to set up admin functionality:

```bash
npx supabase@latest db push
```

This will create:
- `is_admin()` function - checks if current user is admin
- `set_admin_claim()` function - sets admin claim (service_role only)
- `log_audit_entry()` function - logs actions to audit table
- `security_audit` table - immutable audit log
- RLS policies for admin operations on `issuer_trading` and `transactions`

## Step 2: Make Yourself Admin

### Option A: Using the API (Recommended)

Make a POST request to `/api/admin/set-admin`:

```bash
curl -X POST https://your-domain.com/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "make_admin": true}'
```

Note: If no admin exists, this endpoint allows the first user to become admin without authentication.

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your user and click on it
4. In the user details, find "Raw App Meta Data"
5. Edit it to include: `{"admin": true}`

### Option C: Using SQL (Direct)

Run this SQL in the Supabase SQL editor:

```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"admin": true}'::jsonb
WHERE id = 'YOUR_USER_ID';

-- Or by email:
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"admin": true}'::jsonb
WHERE email = 'your-email@example.com';
```

## Step 3: Verify Admin Access

After setting up, verify your admin access:

```bash
# Get your JWT token from the browser (Network tab when logged in)
# Then test the admin endpoint:

curl -X GET https://your-domain.com/api/admin/issuer-trading \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should receive a successful response with issuer trading data.

## API Endpoints

### Issuer Trading (`/api/admin/issuer-trading`)

| Method | Description |
|--------|-------------|
| GET | List all issuer trading records |
| POST | Create new issuer trading record |
| PUT | Update issuer trading record |
| DELETE | Delete issuer trading record (use `?ticker=XXX`) |

### Transactions (`/api/admin/transactions`)

| Method | Description |
|--------|-------------|
| GET | List all transactions (supports filters: `ticker`, `user_id`, `status`, `limit`, `offset`) |
| POST | Create new transaction |
| PUT | Update transaction |
| DELETE | Delete transaction (use `?id=XXX`) |

### Audit Logs (`/api/admin/audit-logs`)

| Method | Description |
|--------|-------------|
| GET | List audit logs (supports filters: `action`, `target_table`, `start_date`, `end_date`, `limit`, `offset`) |
| POST | Get audit log statistics |

### Admin Management (`/api/admin/set-admin`)

| Method | Description |
|--------|-------------|
| GET | List all admin users |
| POST | Grant/revoke admin privileges |

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Browser → Cloudflare Zero Trust → AWS Amplify → Next.js API   │
│                   ↓                       ↓                     │
│            (Email + IP Check)      (JWT Admin Claim Check)     │
│                                          ↓                      │
│                                    Supabase (RLS)               │
│                                          ↓                      │
│                                    Audit Log                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Cloudflare Zero Trust** - Gates the admin subdomain by email and IP
2. **JWT Admin Claim** - API routes verify `app_metadata.admin === true`
3. **Supabase RLS** - Database-level enforcement of admin permissions
4. **Audit Logging** - All actions logged with full details

## Troubleshooting

### "User does not have admin privileges"

1. Verify your JWT contains the admin claim
2. Check the raw_app_meta_data in auth.users table
3. Sign out and sign back in to refresh your JWT

### "Missing Supabase environment variables for admin client"

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment.

### RLS Policy Errors

If you see RLS errors when using authenticated routes:
1. Verify the user has the admin claim
2. Check that the JWT is being passed correctly
3. Review the policy definitions in the migration files

## Important Notes

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the client
- **Always** use HTTPS for admin routes
- **Regularly review** audit logs for suspicious activity
- **Backup** your database before making manual admin changes
