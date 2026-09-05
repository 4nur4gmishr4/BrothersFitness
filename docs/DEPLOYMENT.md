# Deployment & Operations Guide

This document provides the definitive guide for provisioning infrastructure, configuring environment secrets, executing database migrations, and deploying **BroFit** to production.

---

## 1. Hosting Architecture Overview

| Component | Provider | Configuration |
| :--- | :--- | :--- |
| **Edge Network & Serverless Runtime** | [Vercel](https://vercel.com) | Next.js 15 App Router, Node.js 20.x, multi-region edge caching |
| **Relational Database & Object Storage** | [Supabase](https://supabase.com) | PostgreSQL 15, Row Level Security, S3-compatible Storage Buckets |
| **Distributed Rate Limiting & Blacklist** | [Upstash](https://upstash.com) | Serverless Redis REST API with sliding-window algorithm |
| **Custom Domain & TLS** | DNS Provider / Vercel | Production root: `https://brothersfitness.in` |

---

## 2. Environment Variables Provisioning

Configure the following environment variables in the **Vercel Project Settings** (`Production` and `Preview` environments):

```bash
# ==============================================================================
# 1. SUPABASE INFRASTRUCTURE
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================================================
# 2. SECURITY & AUTHENTICATION SECRETS
# ==============================================================================
# Master passcode used for administrative ERP authentication & HMAC signing
ADMIN_PASSWORD=<generate-with-openssl-rand-base64-32>

# Secret token used by automated cron triggers to authorize monthly analytics
CRON_SECRET=<generate-with-openssl-rand-hex-32>

# ==============================================================================
# 3. MULTI-PROVIDER AI CASCADE
# ==============================================================================
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
COHERE_API_KEY=...
API_NINJAS_KEY=...

# ==============================================================================
# 4. UPSTASH REDIS (DISTRIBUTED RATE LIMITING & TOKEN REVOCATION)
# ==============================================================================
UPSTASH_REDIS_REST_URL=https://<your-redis-instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ==============================================================================
# 5. RUNTIME & NETWORK PROXY
# ==============================================================================
NEXT_PUBLIC_SITE_URL=https://brothersfitness.in
TRUST_PROXY_HEADERS=true
MAX_DAILY_CREDITS=5
```

---

## 3. Database Migration Sequence

Execute the SQL migration scripts located in `supabase/migrations/` in chronological order via the **Supabase SQL Editor**:

1. **`supabase/migrations/supabase-schema.sql`**:
   - Creates the `public.users` table.
   - Sets up user row synchronization and `spend_user_credit` stored procedure.
   - Establishes base Row Level Security (RLS).
2. **`supabase/migrations/2026-08-01-admin-tables.sql`**:
   - Provisions `public.gym_members`, `public.contact_submissions`, and `public.admin_activity_logs`.
   - Creates indexes on search and expiry columns.
   - Enforces zero-direct-access RLS policies.
3. **`supabase/migrations/2026-08-02-configurable-credits.sql`**:
   - Provisions `public.app_settings` for dynamic runtime parameters.
   - Installs `reset_daily_credits` procedure.

### Storage Bucket Setup
Create the required Supabase Storage buckets via the Supabase Dashboard:
- **`member-photos`**: Set to **Public** visibility (for avatar display).
- **`backups`**: Set to **Private** visibility (for encrypted database JSON snapshots).

---

## 4. Scheduled Jobs (Vercel Cron)

BroFit schedules automated monthly financial reconciliations via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-revenue",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

The server validates every cron invocation against `CRON_SECRET` using `crypto.timingSafeEqual`.

---

## 5. Progressive Web App (PWA) Deployment

- Configured through `@ducanh2912/next-pwa` in `next.config.mjs`.
- Service worker updates use `skipWaiting: false` to ensure seamless user updates without chunk caching mismatches.
- Static offline caching rules cover icons, logos, and critical shell scripts.

---

## 6. Post-Deployment Verification Checklist

1. **Liveness Probe**: Verify `GET https://brothersfitness.in/api/health` returns `200 OK`.
2. **Member Count Endpoint**: Verify `GET https://brothersfitness.in/api/public/member-count` returns live member count and quarterly trends.
3. **Admin Authentication**: Navigate to `https://brothersfitness.in/admin/login`, enter master password, and verify redirection to `/admin/dashboard`.
4. **AI Generation**: Navigate to `https://brothersfitness.in/fuel`, generate a sample diet, verify 6 meals render, and verify PDF export triggers.
5. **Rate Limiter Test**: Send rapid requests to `/api/admin/login` and verify HTTP 429 lockout activates after 5 attempts.
