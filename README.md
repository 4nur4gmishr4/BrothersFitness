# BroFit

<div align="center">

![BroFit Banner](https://img.shields.io/badge/BroFit-Gym%20Management%20%7C%20AI%20Powered-red?style=for-the-badge&logo=gym&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-8-yellow?style=for-the-badge&logo=vitest&logoColor=white)

**A modern gym management system with AI-powered diet generation, credit-based usage, and dual authentication**

</div>

---

## 🎯 Overview

BroFit is a production-ready gym management platform built with **Next.js 15 App Router**, featuring:

| Feature | Description |
|---------|-------------|
| 🤖 **AI Diet Generator** | Multi-provider fallback (Groq → Mistral → OpenRouter → Cohere) generating bilingual (EN/HI) meal plans |
| 💳 **Credit System** | Daily credits reset at 5:30 AM IST, atomic spending via PostgreSQL RPC |
| 🔐 **Dual Auth** | Supabase Google OAuth (users) + HMAC-SHA256 stateless tokens (admin) |
| 👥 **Member Management** | Admin CRUD for gym members with membership plans & pricing |
| 🛡️ **Rate Limiting** | In-memory with Upstash Redis support for distributed deployments |
| 📱 **PWA Ready** | Service worker on production builds, offline-capable |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BROFIT ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────────────────────┐  │
│  │   USERS      │     │    ADMIN     │     │      AI PROVIDERS          │  │
│  │  (Public)    │     │  (Internal)  │     │   (Fallback Stack)         │  │
│  └──────┬───────┘     └──────┬───────┘     └──────────────┬─────────────┘  │
│         │                    │                              │                │
│         ▼                    ▼                              ▼                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    NEXT.JS 15 APP ROUTER                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ app/api/    │  │ app/(user)/ │  │ app/admin/  │  │ components/ │ │   │
│  │  │ • auth      │  │ • dashboard │  │ • members   │  │ • ui        │ │   │
│  │  │ • diet      │  │ • profile   │  │ • analytics │  │ • forms     │ │   │
│  │  │ • exercises │  │ • credits   │  │ • settings  │  │ • charts    │ │   │
│  │  │ • contact   │  │             │  │             │  │             │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                          │
│         ┌───────────────────────┼───────────────────────┐                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │  lib/       │         │  supabase/  │         │  __tests__/ │          │
│  │ • auth.ts   │         │ • migrations│         │ • lib.test.ts│         │
│  │ • ai-provider│        │ • schema    │         │ • ai.test.ts │         │
│  │ • rate-limit│         │             │         │             │          │
│  │ • validation│         │             │         │             │          │
│  │ • config.ts │         │             │         │             │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Dual Authentication Systems

### 1. Public Users — Supabase Google OAuth

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTH FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User ──► Google OAuth ──► Supabase Auth ──► JWT Token         │
│                                                      │          │
│                                                      ▼          │
│  Client sends: Authorization: Bearer <access_token>           │
│                                                      │          │
│  Server: supabase.auth.getUser(token) ──► user.id             │
│                                                      │          │
│  RLS Policy: auth.uid() = users.id  ◄─── ownership enforced  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Token storage**: HttpOnly cookies (Supabase handles)
- **Credit system**: `daily_credits` column, max `MAX_DAILY_CREDITS` (default 5)
- **Reset**: Daily at 5:30 AM IST via `reset_daily_credits()` cron
- **Spending**: Atomic via `spend_user_credit` SQL RPC

### 2. Admin — Stateless HMAC-SHA256

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN AUTH FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Login: POST /api/admin/login { password }                     │
│              │                                                  │
│              ▼                                                  │
│  Verify: ADMIN_PASSWORD (base64) == HMAC-SHA256(password)      │
│              │                                                  │
│              ▼                                                  │
│  Issue: <base64url(header)>. <base64url(payload)>. <signature> │
│         │                    │                    │             │
│         │                    │                    └─ HMAC-SHA256│
│         │                    │                         (ADMIN_PASSWORD)│
│         │                    └─ { nonce, iat, exp: +24h }       │
│         └─ { alg: "HS256", typ: "JWT" }                         │
│                                                                 │
│  Client stores in sessionStorage, sends:                        │
│  Authorization: Bearer <token>                                  │
│                                                                 │
│  Logout: POST /api/admin/logout → adds nonce to revocation set  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **No database** — fully stateless
- **Revocation**: In-memory nonce blacklist (Upstash Redis for distributed)
- **Expiry**: 24 hours

---

## 🤖 AI Provider Fallback Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    generateTextWithFallback()                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MODEL_STACK = [                                                            │
│    { provider: 'groq',       models: ['llama-3.3-70b-versatile', ...] },   │
│    { provider: 'mistral',    models: ['mistral-large-latest', ...] },      │
│    { provider: 'openrouter', models: ['meta-llama/llama-3.3-70b', ...] },  │
│    { provider: 'cohere',     models: ['command-r-plus', ...] }             │
│  ]                                                                          │
│                                                                             │
│  For each provider in order:                                                │
│    ├─ Check if API key exists in process.env                               │
│    ├─ For each model in provider's list:                                   │
│    │   ├─ Call provider SDK with 30s timeout                               │
│    │   ├─ On success → return result                                       │
│    │   └─ On failure → try next model                                      │
│    └─ If all models fail → try next provider                               │
│                                                                             │
│  Whole generation: 90s deadline                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Required env keys** (priority order):
1. `GROQ_API_KEY` — **First in fallback, add this first**
2. `MISTRAL_API_KEY`
3. `OPENROUTER_API_KEY`
4. `COHERE_API_KEY`

---

## 💳 Credit System

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREDIT FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   User      │     │  spend_user │     │  Database   │       │
│  │  Requests   │────►│  _credit    │────►│  (Atomic)   │       │
│  │  AI Diet    │     │  (RPC)      │     │             │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  Check daily_credits    Decrement if > 0    Update users      │
│  > 0 ? ────────────────► Yes ──────────────► daily_credits--   │
│         │                   │                   last_reset =    │
│         │                   │                   today IST       │
│         ▼                   ▼                   ▼               │
│  Return 402 if          Return {success:   Return updated      │
│  insufficient            true, credits:    credits to client   │
│  credits                 remaining}                              │
│                                                                 │
│  RESET: Daily at 5:30 AM IST via pg_cron → reset_daily_credits()│
│  Reads cap from app_settings.max_daily_credits (default 5)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration** (`lib/config.ts`):
```typescript
export const MAX_DAILY_CREDITS = parseInt(process.env.MAX_DAILY_CREDITS || '5', 10);
```

**Database migration** (`supabase/migrations/2026-08-02-configurable-credits.sql`):
- Relaxed `users.daily_credits` CHECK constraint to 0–100
- Added `app_settings` table with `max_daily_credits` key
- Updated `reset_daily_credits()` to read from settings

---

## 🛡️ Rate Limiting

```
┌─────────────────────────────────────────────────────────────────┐
│                    RATE LIMIT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  checkRateLimit(key, { maxRequests, windowMs })                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN)│   │
│  │     → Distributed Redis (Upstash)                       │   │
│  │  else                                                    │   │
│  │     → In-memory Map (per-instance, dev/tests/fallback)  │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  getClientIp(request)                                           │
│  ├─ TRUST_PROXY_HEADERS=true (Vercel/Cloudflare/nginx)         │
│  │   └─ x-real-ip > x-forwarded-for (last) > unknown           │
│  └─ TRUST_PROXY_HEADERS=false → always 'unknown'               │
│                                                                 │
│  Returns: { allowed, remaining, resetIn }                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Production requirement**: Set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting across serverless instances.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase project
- (Optional) AI provider API keys
- (Optional) Upstash Redis for production rate limiting

### Installation

```bash
# Clone and install
git clone <repo-url>
cd brofit
npm install

# Copy env template and fill in values
cp .env.local.example .env.local

# Run development server
npm run dev
```

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `ADMIN_PASSWORD` | ✅ | Base64 random string (min 32 chars) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (admin routes, chat, diet) |
| `GROQ_API_KEY` | Recommended | First AI provider in fallback |
| `CRON_SECRET` | ✅ | Hex string for `/api/cron/*` protection |

### Optional Environment Variables

| Variable | Purpose |
|----------|---------|
| `MISTRAL_API_KEY` | Fallback AI provider |
| `OPENROUTER_API_KEY` | Fallback AI provider |
| `COHERE_API_KEY` | Fallback AI provider |
| `API_NINJAS_KEY` | Exercise data |
| `DISCORD_WEBHOOK_URL` | Admin notifications |
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Distributed rate limiting |
| `TRUST_PROXY_HEADERS` | Set `true` behind proxy (Vercel auto) |
| `MAX_DAILY_CREDITS` | Daily AI credit cap (default 5) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata |

### Generate Secrets

```bash
# ADMIN_PASSWORD (base64, 32+ chars)
openssl rand -base64 32

# CRON_SECRET (hex, 32 bytes)
openssl rand -hex 32
```

---

## 📁 Project Structure

```
brofit/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin-only routes (HMAC auth)
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── members/route.ts
│   │   │   └── analytics/route.ts
│   │   ├── auth/            # Supabase OAuth callbacks
│   │   ├── generate-diet/route.ts      # AI diet generation
│   │   ├── exercises/ninjas/route.ts   # Exercise search
│   │   ├── contact/route.ts            # Contact form → Discord
│   │   └── cron/monthly-revenue/route.ts # Scheduled job
│   ├── admin/               # Admin dashboard pages
│   ├── (user)/              # User dashboard (protected)
│   └── layout.tsx           # Root layout + providers
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── forms/               # Form components with validation
│   └── charts/              # Analytics visualizations
├── lib/
│   ├── auth.ts              # Admin HMAC token logic
│   ├── ai-provider.ts       # Multi-provider AI fallback
│   ├── rate-limit.ts        # Rate limiting (memory/Redis)
│   ├── validation.ts        # Zod schemas
│   ├── config.ts            # Business config (single source)
│   ├── supabase.ts          # Client (anon key)
│   ├── server-supabase.ts   # Server (service role)
│   └── credit-service.ts    # Credit spend/verify logic
├── supabase/
│   └── migrations/          # SQL migrations
├── __tests__/               # Vitest tests
├── .env.local.example       # Env template
├── next.config.mjs          # Next.js + PWA config
├── eslint.config.mjs        # Flat ESLint config
├── tsconfig.json            # TypeScript strict mode
└── package.json
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report (with thresholds)
npm run test:coverage

# Single test file
npx vitest run __tests__/lib.test.ts
```

**Coverage thresholds** (enforced in CI):
- `lib/**/*.ts`: 80% statements / 70% branches / 80% functions / 80% lines
- Overall: 60% minimum

---

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Serve production build locally
npm run start

# Lint
npm run lint
```

### Vercel Deployment

1. Connect repository to Vercel
2. Add all environment variables from `.env.local.example`
3. Set `TRUST_PROXY_HEADERS=true` (Vercel handles proxy headers)
4. Deploy

### Database Setup

```bash
# Apply migrations to Supabase
# Run each migration in supabase/migrations/ via Supabase SQL Editor
# Or use Supabase CLI:
supabase db push
```

**Critical migration**: `2026-08-02-configurable-credits.sql` must be applied for credit system to work with configurable caps.

---

## 🔧 Key Configuration Files

### `lib/config.ts` — Single Source of Truth
```typescript
export const PLAN_PRICES = {
  '1 Month': 700,
  '3 Months': 1800,
  '6 Months': 3300,
  '12 Months': 6000,
};

export const MAX_DAILY_CREDITS = parseInt(process.env.MAX_DAILY_CREDITS || '5', 10);
export const MEMBERSHIP_PLANS = Object.keys(PLAN_PRICES) as const;
```

### `next.config.mjs` — PWA Config
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // PWA only in prod
  register: true,
  skipWaiting: true,
});
```

---

## ⚠️ Known Limitations & TODOs

| Area | Status | Notes |
|------|--------|-------|
| Rate limiting | Redis (Upstash) + in-memory fallback | Distributed when `UPSTASH_REDIS_REST_URL`/`TOKEN` set; falls back to per-instance memory in dev |
| PWA | Dev disabled | Service worker only registers on production builds; update toast in `PwaUpdateToast` |
| Admin revocation | Redis-backed | Nonce blacklist in Upstash Redis when configured, in-memory otherwise |
| AI timeout | 8s/provider, 60s total | Tightened for serverless budgets in `lib/ai-provider.ts` |
| Test env | `NODE_ENV=production` inherited | Use `VITEST===true` for test guards (see memory) |

---

## 📄 License

MIT License — see `LICENSE` file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ for the fitness community**

[Report Bug](https://github.com/your-org/brofit/issues) · [Request Feature](https://github.com/your-org/brofit/issues) · [Documentation](https://github.com/your-org/brofit/wiki)

</div>