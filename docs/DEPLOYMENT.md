# Deployment & Operations Guide

Step-by-step manual for provisioning, deploying, and maintaining BroFit in production environments.

---

## 1. Hosting Architecture Overview

- **Web Framework & Compute**: Vercel (Next.js 15 Serverless Functions & Edge Network)
- **Database & Object Storage**: Supabase (Managed PostgreSQL 15 & Storage Buckets)
- **Rate Limiting & Cache**: Upstash Redis (Serverless REST API)
- **Domain & SSL**: Custom DNS configured for `https://brothersfitness.in`

---

## 2. Environment Variables Provisioning

Configure the following variables in the **Vercel Project Settings**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Admin & Cron Secrets
ADMIN_PASSWORD=<generate-with-openssl-rand-base64-32>
CRON_SECRET=<generate-with-openssl-rand-hex-32>

# AI Fallback Providers
GROQ_API_KEY=<your-groq-api-key>
MISTRAL_API_KEY=<your-mistral-api-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
COHERE_API_KEY=<your-cohere-api-key>

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://<your-redis>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>

# Site URL & Reverse Proxy
NEXT_PUBLIC_SITE_URL=https://brothersfitness.in
TRUST_PROXY_HEADERS=true
```

---

## 3. Database Migration Sequence

Execute SQL migrations in the Supabase SQL Editor in chronological sequence:
1. `supabase/migrations/supabase-schema.sql`: Base tables (`users`), RLS policies, and `spend_user_credit` RPC.
2. `supabase/migrations/2026-08-01-admin-tables.sql`: Administration tables (`gym_members`, `contact_submissions`, `admin_activity_logs`).
3. `supabase/migrations/2026-08-02-configurable-credits.sql`: Configuration parameters and daily credit reset procedures.

Create required Supabase Storage buckets:
- `member-photos`: Public read access for avatar display.
- `backups`: Private administrative storage for database JSON exports.

---

## 4. Scheduled Jobs (Cron)

Set up a Vercel Cron Job targeting `/api/cron/monthly-revenue` to run at the close of every calendar month:

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

The endpoint validates requests using the `Authorization: Bearer <CRON_SECRET>` header via `timingSafeEqual`.
