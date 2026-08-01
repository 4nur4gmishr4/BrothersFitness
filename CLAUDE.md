# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The Next.js app is in `brofit/` (this directory is the git repo root). The parent directory contains an `envs/` folder with a copy of the env template — ignore it; use `brofit/.env.local`.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint (flat config via eslint.config.mjs)
npm test             # run all Vitest tests
npm run test:watch   # watch mode
npm run test:coverage # Vitest with v8 coverage + thresholds (lib/**/*.ts, gate in CI)
```

Single test file: `npx vitest run __tests__/ai.test.ts`

Path alias `@/*` maps to the repo root (`@/lib/validation` → `lib/validation`).

## Architecture

**Next.js 15 App Router** app. Server components / API routes in `app/`, client components in `components/`, shared logic in `lib/`, tests in `__tests__/`.

### Two separate auth systems (don't mix them)

1. **Public users** (`lib/user-auth-context.tsx`): Supabase Google OAuth. The user's Supabase access token is sent as `Authorization: Bearer <token>`; server-side routes verify it via the service-role client's `auth.getUser()` (`lib/credit-service.ts`). `users.id` = Supabase `auth.uid()` and ownership RLS enforces `auth.uid() = id`. Users get `daily_credits` (max `MAX_DAILY_CREDITS` from `lib/config.ts`) that reset daily at 5:30 AM IST and gate AI features. Credit spend is atomic via the `spend_user_credit` SQL RPC.
2. **Admin** (`lib/auth-context.tsx`, `lib/auth.ts`): stateless HMAC-SHA256 token over `ADMIN_PASSWORD`, format `<base64url(JSON {n,iat,exp})>.<signature>`, 24h expiry, nonce blacklist for logout revocation. Stored in `sessionStorage`, sent as `Authorization: Bearer`. API routes verify via `verifyAdminToken()` / `requireAdminToken()` — this is the ONLY protection on `app/api/admin/*`.

### AI provider fallback stack — `lib/ai-provider.ts`

`generateTextWithFallback(config)` walks `MODEL_STACK` in order (Groq → Mistral → OpenRouter → Cohere), trying each configured provider's model until one succeeds. All providers are OpenAI-compatible SDK clients except Cohere (raw fetch). The real env keys are `GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `COHERE_API_KEY`. If no provider key is set, the call throws after exhausting the stack. Each provider call has a 30s timeout and the whole generation a 90s deadline (`lib/ai-provider.ts`).

The Diet generator (`app/api/generate-diet/route.ts`) prompts the model for a large bilingual (en/hi) JSON meal-plan and leniently validates it against `DietResponseSchema`.

### API route pattern (all routes follow this shape)

1. Check config/auth preconditions (`verifyUserToken` for user routes, `requireAdminToken` for admin routes).
2. Rate-limit via `checkRateLimit()` from `lib/rate-limit.ts`.
3. `safeParse` the body against a Zod schema from `lib/validation.ts` — first issue message becomes the 400 error.
4. Perform the work, return `NextResponse.json`.

### Database — `lib/supabase.ts` and `lib/server-supabase.ts`

`lib/supabase.ts` is the user-facing (anon key) client. `lib/server-supabase.ts` is the **service-role** client for admin/cron/server paths — it bypasses RLS, so it must never be imported into client components. `users` table holds auth/credits (id = Supabase `auth.uid()`); `gym_members` holds admin-managed members. Schema in `supabase/migrations/`.

### Business config

`lib/config.ts` is the single source of truth: `PLAN_PRICES`, `CONTACT_INFO`, `MAX_DAILY_CREDITS` (5), `MEMBERSHIP_PLANS`. There is no duplicate config file anymore.

## Known gotchas

- **Rate limiting** (`lib/rate-limit.ts`) — Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set (production), per-instance in-memory Map otherwise (dev/tests). AI provider calls use an 8s per-provider timeout (60s total fallback budget) to stay within serverless execution limits.
- **`.env.local.example`** documents all env vars with placeholders — copy it to `.env.local` and fill in real keys.
- **`npm run lint` runs `eslint .`** (flat config in `eslint.config.mjs`); it ignores `.next`, `next-env.d.ts`, and the PWA service-worker artifacts in `public/`.
- **CI** (`.github/workflows/ci.yml`) runs `npm run lint` + `npm test` on push/PR to `main`.
- PWA is disabled in development (`next.config.mjs` sets `disable` in dev); service worker only registers on production builds.
