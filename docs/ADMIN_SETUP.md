# Admin Setup Guide for Pauv

This document provides instructions for setting up admin access to the Pauv platform.

## Overview

Admin access is managed via **Cloudflare Zero Trust** on the `admin.pauv.com` subdomain. Only `@pauv.com` email addresses can authenticate through the Cloudflare Access gate. There is no `/admin` route on the main site — requests to `pauv.com/admin` are automatically redirected to `admin.pauv.com`.

## Prerequisites

1. Supabase project configured
2. Cloudflare Zero Trust configured for `admin.pauv.com` (see [CLOUDFLARE_ZERO_TRUST_SETUP.md](./CLOUDFLARE_ZERO_TRUST_SETUP.md))
3. Service role key available

## Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin-specific (SERVER ONLY - never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare Zero Trust
CF_ACCESS_TEAM_NAME=your-team-name
CF_ACCESS_AUD=your-application-aud-tag

# Admin subdomain host (defaults to admin.pauv.com in production)
# ADMIN_HOST=admin.localhost:3000  # Uncomment for local dev
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
- `get_user_id_by_email()` function - maps CF email to Supabase user ID for audit logging
- `security_audit` table - immutable audit log
- RLS policies for admin operations on `issuer_trading` and `transactions`

## Step 2: Make Yourself Admin

Admin users need a Supabase account with the admin claim **and** a `@pauv.com` email in Cloudflare Access.

### Option A: Using the API

Make a POST request to `admin.pauv.com/api/admin/set-admin` (must be authenticated via Cloudflare):

```bash
curl -X POST https://admin.pauv.com/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@pauv.com", "make_admin": true}'
```

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

After setting up:

1. Navigate to `https://admin.pauv.com`
2. Authenticate via Cloudflare Access (email OTP or GitHub)
3. You should see the admin dashboard

To test API endpoints directly:

```bash
# From admin.pauv.com (CF headers are injected automatically)
curl -X GET https://admin.pauv.com/api/admin/issuer-trading
```

## How Authentication Works

### Production (admin.pauv.com)

1. **Cloudflare Zero Trust** gates the subdomain — only `@pauv.com` emails pass
2. Cloudflare injects `Cf-Access-Authenticated-User-Email` header on all requests
3. **Middleware** verifies the CF header as defense-in-depth
4. **API routes** call `verifyAdmin(request)` which checks the CF header
5. The CF email is mapped to a Supabase user ID via `get_user_id_by_email()` for audit logging
6. **Supabase RLS** enforces admin permissions on the database level

### Development (localhost)

In development, CF headers are not present. The system falls back to Supabase JWT auth:
1. Admin user logs in via Supabase auth on the main site
2. API calls include `Authorization: Bearer` token
3. `verifyAdmin()` falls back to `verifyAdminFromJWT()` when no CF headers are present

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
│        (@pauv.com email gate)   (CF header verification)       │
│                                          ↓                      │
│                                 Supabase (service_role)         │
│                                          ↓                      │
│                                    Audit Log                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Cloudflare Zero Trust** - Gates `admin.pauv.com` — only `@pauv.com` emails
2. **Middleware** - Verifies CF email header, blocks non-admin paths on subdomain
3. **API Route Auth** - `verifyAdmin()` checks CF header (prod) or JWT (dev)
4. **Supabase RLS** - Database-level enforcement of admin permissions
5. **Audit Logging** - All actions logged with admin email and Supabase user ID

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
