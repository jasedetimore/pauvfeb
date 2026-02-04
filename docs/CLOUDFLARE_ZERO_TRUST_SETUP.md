# Cloudflare Zero Trust Setup for Admin Subdomain

## Overview

This document outlines the security architecture for the admin subdomain (`admin.pauv.com`) using Cloudflare Zero Trust (Access). This gates the entire admin subdomain behind Cloudflare Access, restricting access to a single administrator.

## Prerequisites

1. Cloudflare account with Zero Trust enabled
2. Domain configured with Cloudflare DNS
3. Admin subdomain DNS record pointing to your origin (AWS Amplify)

## Step 1: Create a DNS Record for Admin Subdomain

In Cloudflare DNS dashboard:
- **Type**: CNAME
- **Name**: admin
- **Target**: Your Amplify domain (e.g., `main.d1234567890.amplifyapp.com`)
- **Proxy status**: Proxied (orange cloud enabled)

## Step 2: Configure Cloudflare Zero Trust Access

### 2.1 Create an Access Application

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**

**Application Configuration:**
```
Application name: Pauv Admin Dashboard
Session Duration: 24 hours
Application domain: admin.pauv.com
```

### 2.2 Create Access Policy

Create a policy with the following rules:

**Policy Name:** `Admin Access Only`
**Policy Action:** `Allow`

**Configure Rules (Include):**

| Rule Type | Selector | Value |
|-----------|----------|-------|
| Emails | is | `your-admin-email@example.com` |
| IP Ranges | is | `YOUR_CURRENT_IP/32` |

**Important:** Both conditions should be configured as "Include" rules with "AND" logic for maximum security.

### 2.3 Additional Security Settings

Enable these options in the application settings:

```yaml
# Application Settings
App Launcher visibility: Hidden
Enable Binding Cookie: Yes
HTTP-only cookies: Yes
Same-Site Cookies: Strict

# CORS Settings (if needed)
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400

# Browser Rendering
Skip Interstitial: No (keep the login page)
```

## Step 3: Configure Identity Provider

### Option A: One-Time Pin (Email OTP)
Simplest setup - sends OTP to your email:
1. Go to **Settings** → **Authentication**
2. Enable **One-time PIN**
3. Your admin email will receive a code when logging in

### Option B: GitHub OAuth (Recommended for Developer)
1. Go to **Settings** → **Authentication** → **Add new**
2. Select **GitHub**
3. Create OAuth App in GitHub:
   - Homepage URL: `https://admin.pauv.com`
   - Authorization callback URL: `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/callback`
4. Add Client ID and Secret to Cloudflare

## Step 4: Access Headers for Backend Verification

Cloudflare Access adds these headers to authenticated requests:

```
Cf-Access-Authenticated-User-Email: your-email@example.com
Cf-Access-Jwt-Assertion: <JWT token>
```

### Verify JWT in Your Application

Create this environment variable in your Next.js app:
```bash
# .env.local (DO NOT COMMIT)
CF_ACCESS_TEAM_NAME=your-team-name
CF_ACCESS_AUD=<your-application-aud-tag>
```

The AUD tag can be found in:
**Zero Trust** → **Access** → **Applications** → **Your App** → **Overview**

## Step 5: IP Allowlist Updates

Since your IP may change, you have two options:

### Option A: Dynamic IP Update Script
```bash
#!/bin/bash
# update-cloudflare-ip.sh
NEW_IP=$(curl -s ifconfig.me)
CF_API_TOKEN="your-api-token"
POLICY_ID="your-policy-id"

curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/policies/${POLICY_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "include": [
      {"email": {"email": "your-email@example.com"}},
      {"ip": {"ip": "'"${NEW_IP}/32"'"}}
    ]
  }'
```

### Option B: Remove IP Restriction (Less Secure)
If IP restriction is too cumbersome, rely solely on email authentication + MFA.

## Step 6: Verify Setup

1. Open incognito browser
2. Navigate to `https://admin.pauv.com`
3. You should see Cloudflare Access login page
4. Authenticate with your email
5. Verify you can access the admin dashboard

## Security Checklist

- [ ] DNS record created and proxied
- [ ] Access Application created
- [ ] Access Policy restricts to your email
- [ ] Identity provider configured
- [ ] Test login from incognito browser
- [ ] Test rejection with unauthorized email
- [ ] Enable Cloudflare WAF rules for additional protection
- [ ] Enable rate limiting on admin routes

## Monitoring & Alerts

Set up alerts in Cloudflare for:
1. **Failed login attempts** - Zero Trust → Logs
2. **Successful logins from new locations**
3. **Policy changes**

## Troubleshooting

### "Access Denied" Error
- Verify your email matches exactly
- Check if IP has changed
- Clear browser cookies and retry

### JWT Verification Failing
- Ensure AUD tag is correct
- Verify team name is correct
- Check if certificate has rotated

---

## Architecture Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Admin     │────▶│  Cloudflare      │────▶│  AWS Amplify    │
│   Browser   │     │  Zero Trust      │     │  (Next.js App)  │
└─────────────┘     │  Access Gate     │     └────────┬────────┘
                    └──────────────────┘              │
                           │                          │
                    ┌──────┴──────┐            ┌──────▼──────┐
                    │ Validates:  │            │ Validates:  │
                    │ • Email     │            │ • CF JWT    │
                    │ • IP Range  │            │ • Admin     │
                    │ • MFA       │            │   Claim     │
                    └─────────────┘            └──────┬──────┘
                                                      │
                                               ┌──────▼──────┐
                                               │  Supabase   │
                                               │ (RLS + JWT) │
                                               └─────────────┘
```

## Next Steps

After Cloudflare Access is configured:
1. Implement JWT verification middleware in Next.js
2. Set up admin claim in Supabase
3. Configure RLS policies for admin operations
4. Enable audit logging
