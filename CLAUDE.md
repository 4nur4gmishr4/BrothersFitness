# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (includes PWA generation) |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint (flat config) |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:coverage` | Run tests with coverage thresholds |

## Architecture Overview

**Stack**: Next.js 15 App Router + TypeScript (strict) + React 19 + Supabase (PostgreSQL) + Vitest

### Dual Authentication

1. **Users**: Supabase Google OAuth → JWT in HttpOnly cookies → RLS policies enforce `auth.uid() = users.id`
2. **Admin**: Stateless HMAC-SHA256 tokens (24h expiry), nonce revocation via Upstash Redis or in-memory fallback

### AI Provider Fallback Stack

`generateTextWithFallback()` in `lib/ai-provider.ts` tries providers in order:
1. Groq (`GROQ_API_KEY`) → `llama-3.3-70b-versatile`
2. Mistral (`MISTRAL_API_KEY`) → `mistral-large-latest`
3. OpenRouter (`OPENROUTER_API_KEY`) → `meta-llama/llama-3.3-70b`
4. Cohere (`COHERE_API_KEY`) → `command-r-plus`

Per-provider timeout: 8s. Total deadline: 60s.

### Credit System

- Daily credits reset at 5:30 AM IST via pg_cron → `reset_daily_credits()`
- Atomic spend via `spend_user_credit` SQL RPC (returns 402 if insufficient)
- Configurable cap via `app_settings.max_daily_credits` (default 5, env `MAX_DAILY_CREDITS`)

### Rate Limiting

`checkRateLimit(key, { maxRequests, windowMs })` in `lib/rate-limit.ts`:
- Upstash Redis if `UPSTASH_REDIS_REST_URL` + `TOKEN` set (production)
- In-memory Map fallback (dev/tests/single-instance)

## Key Files & Patterns

| File | Purpose |
|------|---------|
| `lib/config.ts` | Single source of truth: `PLAN_PRICES`, `MAX_DAILY_CREDITS`, `MEMBERSHIP_PLANS` |
| `lib/auth.ts` | Admin HMAC token create/verify/revoke |
| `lib/ai-provider.ts` | Multi-provider fallback with timeouts |
| `lib/credit-service.ts` | Credit spend/verify helpers |
| `lib/supabase.ts` | Browser client (anon key) |
| `lib/server-supabase.ts` | Server client (service role) |
| `lib/validation.ts` | Zod schemas for API inputs |
| `next.config.mjs` | PWA via `@ducanh2912/next-pwa` (disabled in dev, `skipWaiting: false` in workboxOptions) |
| `vitest.config.ts` | Coverage thresholds: lib 80%/70%/80%/80%, overall 60% |

## API Routes Structure

```
app/api/
├── admin/           # HMAC-protected admin routes
│   ├── login, logout, members, analytics
├── auth/            # Supabase OAuth callbacks
├── generate-diet/   # AI diet generation (credit-gated)
├── exercises/ninjas/# Exercise search (API Ninjas)
├── contact/         # Contact form
└── cron/monthly-revenue/  # Protected cron job
```

## Environment Variables

**Required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD` (base64, 32+ chars), `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (hex, 32 bytes)

**Recommended**: `GROQ_API_KEY` (first AI fallback)

**Optional**: `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `COHERE_API_KEY`, `API_NINJAS_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TRUST_PROXY_HEADERS=true` (Vercel), `MAX_DAILY_CREDITS`, `NEXT_PUBLIC_SITE_URL`

## Testing

- Unit tests in `__tests__/` mirroring `lib/` structure
- Coverage: `lib/**/*.ts` at 80% statements/branches/functions/lines
- `jsdom` environment, globals enabled, setup via `__tests__/setup.ts`
- Run single test: `npx vitest run __tests__/lib.test.ts`

## Deployment (Vercel)

1. Connect repo, add all env vars
2. Set `TRUST_PROXY_HEADERS=true` (Vercel handles proxy headers)
3. PWA service worker auto-generated on production build
4. Apply Supabase migrations via SQL Editor or `supabase db push`

## Critical Notes

- **PWA**: `skipWaiting: false` lives in `workboxOptions` (top-level flags ignored). New SW waits for user opt-in via `PwaUpdateToast` "Reload" → posts `SKIP_WAITING`. Navigations are `NetworkFirst` so deployed HTML is always fresh.
- **Admin revocation**: Nonce blacklist in Upstash Redis when configured, in-memory otherwise
- **Test env**: `NODE_ENV=production` inherited — use `VITEST===true` for test guards
- **Migration**: `supabase/migrations/2026-08-02-configurable-credits.sql` must be applied for credit system