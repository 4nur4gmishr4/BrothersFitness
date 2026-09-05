# System Architecture

This document provides an in-depth technical overview of the architecture, component topology, and data flow of **BroFit** (Brother's Fitness ERP & Trainee Portal).

---

## 1. Architectural Topology

BroFit is architected as a modern serverless web platform on **Next.js 15 App Router** backed by **Supabase PostgreSQL** and **Upstash Redis**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
├───────────────────────────────────────┬─────────────────────────────────────┤
│        PUBLIC & TRAINEE PORTAL        │          ADMINISTRATION ERP         │
│ • Next.js 15 Static / Dynamic Pages   │ • Protected Console (/admin/*)      │
│ • Google OAuth Trainee Session        │ • Passcode Authentication           │
│ • PWA Offline Cache (Workbox)         │ • Stateless Signed HMAC Token       │
│ • Diet Synthesizer, 1RM/TDEE Tools    │ • Member CRUD, Leads, Backups, CSV  │
└───────────────────┬───────────────────┴──────────────────┬──────────────────┘
                    │                                      │
                    ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS 15 RUNTIME (SERVER)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Middleware & Edge Routing]                                                 │
│ • Security Headers (CSP, Frame-Options, XSS, Referrer)                      │
│ • Trusted Proxy IP Extraction (x-real-ip / x-forwarded-for)                 │
│                                                                             │
│ [Route Handlers]                                                            │
│ • Public: /api/chat, /api/generate-diet, /api/contact, /api/health          │
│ • Admin: requireAdminToken() Guard -> /api/admin/*                          │
│ • Cron: /api/cron/monthly-revenue (Protected by timingSafeEqual CRON_SECRET)│
└───────────────────┬───────────────────┬──────────────────┬──────────────────┘
                    │                   │                  │
                    ▼                   ▼                  ▼
┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────┐
│  SUPABASE POSTGRESQL  │ │    UPSTASH REDIS     │ │     AI CASCADE STACK     │
├───────────────────────┤ ├──────────────────────┤ ├──────────────────────────┤
│ • public.users (RLS)  │ │ • Sliding-Window     │ │ 1. Groq (Llama 3.3 70B)  │
│ • public.gym_members  │ │   Rate Limiting      │ │ 2. Mistral AI            │
│ • contact_submissions │ │ • Admin Nonce        │ │ 3. OpenRouter            │
│ • admin_activity_logs │ │   Revocation Set     │ │ 4. Cohere                │
│ • app_settings        │ │   (24h TTL)          │ │ 5. Vercel AI             │
│ • RPC: spend_credit() │ └──────────────────────┘ └──────────────────────────┘
│ • Storage: Photos     │
└───────────────────────┘
```

---

## 2. Separation of Concerns: Main App vs. Admin ERP

The codebase maintains strict modular segregation between public trainee experiences and internal gym administration:

### A. Trainee Application Layer (`app/*`, `components/features/*`, `components/public/*`)
- **Routing**: Client routes (`/`, `/fuel`, `/workouts`, `/calculators`, `/pricing`, `/quotes`, `/trophy-room`).
- **Authentication**: Managed via Supabase Google OAuth (`user-auth-context.tsx`). Trainees cannot view or modify administrative records.
- **Credit Metering**: Governed by an Indian Standard Time (IST) quota system resetting at 5:30 AM UTC (midnight IST).
- **Client Storage**: Profile preferences, exercise bookmarks, and daily streak counters stored safely in trainee `localStorage`.

### B. Gym Administration ERP Layer (`app/admin/*`, `app/api/admin/*`, `components/admin/*`)
- **Routing**: Completely isolated sub-tree under `/admin/*` (`/admin/dashboard`, `/admin/members`, `/admin/leads`, `/admin/analytics`, `/admin/activity`, `/admin/settings`).
- **Authentication Guard**: `AdminLayout.tsx` enforces `useAdmin()` hook checking server-side `/api/admin/verify`.
- **API Guard**: `requireAdminToken()` validates the stateless signed HMAC token and verifies against the Redis revocation set.
- **Client Storage**: Admin token stored strictly in ephemeral `sessionStorage` (automatically purged when browser tab is closed).

---

## 3. Data Flow Pipelines

### A. Diet Synthesis Pipeline
1. Trainee submits physical biometrics (Age, Gender, Weight, Target, Activity, Dietary preference).
2. Client requests `POST /api/generate-diet` with Bearer Trainee JWT.
3. Server executes atomic stored procedure `spend_user_credit(userId, 5)` in PostgreSQL.
4. Server invokes `generateDietPlan()` executing the 16-model AI fallback cascade with an 8-second timeout per model.
5. The synthesized JSON protocol is validated against `DietResponseSchema` via Zod.
6. The client renders bilingual macro breakdown with instant client-side PDF export via `jsPDF` and `html2canvas`.

### B. Member Lifecycle Pipeline
1. Administrator creates/renews member profile via `MemberFormModal.tsx`.
2. Photo is compressed in a Web Worker using `browser-image-compression` (< 500 KB, max 1200px).
3. Photo binary is verified on the server via magic-byte signatures (JPEG, PNG, WebP) and uploaded to Supabase `member-photos`.
4. Stored member record updates expiry date based on canonical `PLAN_DURATION_DAYS` mapping.
5. Action is recorded in `admin_activity_logs` with admin timestamp and client IP.
