# Brother's Fitness (BroFit)

<div align="center">

[![Live Website](https://img.shields.io/badge/Live%20Site-brothersfitness.in-FF3B30?style=for-the-badge&logo=google-chrome&logoColor=white)](https://brothersfitness.in)
[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/4nur4gmishr4/BrothersFitness/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%20Status)](https://github.com/4nur4gmishr4/BrothersFitness/actions)
![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1-fcc72b?style=for-the-badge&logo=vitest&logoColor=black)
![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-blueviolet?style=for-the-badge&logo=pwa&logoColor=white)

**A modern full-stack gym management ERP, tactical fitness companion, and AI-powered nutrition synthesizer engineered for Brother's Fitness (Lakhnadon, Madhya Pradesh, India).**

[Live Portal](#-live-portal--modules) · [Mobile Previews](#-mobile-experience--ios-previews) · [System Architecture](#-system-architecture) · [Documentation Suite](#-technical-documentation-suite) · [Getting Started](#-getting-started) · [License](#-license--attribution)

</div>

---

### 🌐 Live Portal & Modules

| Module | Route | Live Production Access | Purpose & Core Capabilities |
| :--- | :--- | :--- | :--- |
| 🏋️ **Public Trainee Portal** | `/` | [brothersfitness.in](https://brothersfitness.in) | High-converting landing page, live active member counter, dynamic quarterly trend metrics, and membership onboarding. |
| 🥗 **Nutrition Synthesizer** | `/fuel` | [brothersfitness.in/fuel](https://brothersfitness.in/fuel) | Mifflin-St Jeor TDEE diet generator with bilingual English/Hindi rendering and instant client-side PDF export. |
| 🏃 **Interactive Exercise Library** | `/workouts` | [brothersfitness.in/workouts](https://brothersfitness.in/workouts) | 800+ exercise directory with animated guides, muscle filters, tactical rest timer, and stopwatch. |
| 🧮 **Diagnostic Calculators** | `/calculators` | [brothersfitness.in/calculators](https://brothersfitness.in/calculators) | Body Mass Index (BMI), Total Daily Energy Expenditure (TDEE), and 1-Rep Max (1RM) calculators with shareable report export. |
| 🏆 **Trophy Room & Streaks** | `/trophy-room` | [brothersfitness.in/trophy-room](https://brothersfitness.in/trophy-room) | Trainee engagement streaks, gamification achievement medals, and motivational quote explorer. |
| 🛡️ **Administrative ERP Console** | `/admin/login` | [brothersfitness.in/admin/login](https://brothersfitness.in/admin/login) | Member CRUD, digital receipts, leads CRM, revenue analytics, activity audit trail, and database snapshots. |

---

### 📱 Mobile Experience & iOS Previews

Designed with a high-contrast tactical red-and-black aesthetic (`#FF3B30` / `#070709`) optimized for OLED mobile displays and Progressive Web App (PWA) installation:

<div align="center">
  <table>
    <tr>
      <th width="33%" align="center"><b>Admin ERP Console</b></th>
      <th width="33%" align="center"><b>AI Tactical Fuel Synthesizer</b></th>
      <th width="33%" align="center"><b>Workout Engine & Timer</b></th>
    </tr>
    <tr>
      <td align="center">
        <a href="docs/assets/ios-admin-preview.svg">
          <img src="docs/assets/ios-admin-preview.svg" alt="BroFit Admin ERP iOS Preview" width="280" />
        </a>
      </td>
      <td align="center">
        <a href="docs/assets/ios-fuel-preview.svg">
          <img src="docs/assets/ios-fuel-preview.svg" alt="BroFit Tactical Fuel iOS Preview" width="280" />
        </a>
      </td>
      <td align="center">
        <a href="docs/assets/ios-workout-preview.svg">
          <img src="docs/assets/ios-workout-preview.svg" alt="BroFit Workout Protocol iOS Preview" width="280" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center"><sub>Member lifecycle, WhatsApp actions, live trainee KPIs, and backup status.</sub></td>
      <td align="center"><sub>Dynamic macro bars, 6-meal daily protocol, and 1-click PDF download.</sub></td>
      <td align="center"><sub>Active movement tracker, interactive rest countdown, and muscle filters.</sub></td>
    </tr>
  </table>
</div>

---

### 📚 Technical Documentation Suite

To maintain zero duplication and provide a single authoritative source of truth for every domain, comprehensive guides are organized under [`docs/`](docs/):

| Guide | Single Source of Truth For | Direct Link |
| :--- | :--- | :--- |
| 📐 **System Architecture** | System topology, separation of concerns (Main App vs Admin ERP), 16-model AI fallback cascade, IST credit quota spend cycle, and key architectural trade-offs. | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| ⚡ **API Route Reference** | Complete endpoint directory, authentication headers, query parameters, rate limits, and full JSON request/response payloads. | [docs/API.md](docs/API.md) |
| 🗄️ **Database & Security** | PostgreSQL 15 schema, table columns, Row Level Security (RLS) matrix, atomic stored procedures (`spend_user_credit`, `reset_daily_credits`), and Supabase storage buckets. | [docs/DATABASE.md](docs/DATABASE.md) |
| 🛡️ **Security Architecture** | Dual-boundary authentication (Trainee OAuth vs Admin HMAC), constant-time checks (`timingSafeEqual`), Redis token revocation, rate limiting, magic-byte validation, and zero-PII policies. | [docs/SECURITY.md](docs/SECURITY.md) |
| 🚢 **Deployment & Operations** | Production provisioning on Vercel, Supabase, and Upstash Redis, environment variables matrix, database migrations sequence, Vercel cron, and verification checklist. | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |

---

## 📖 Overview & Capabilities

**BroFit** bridges the gap between client-facing fitness companion software and mission-critical gym administration. Built using Next.js 15 App Router, React 19, TypeScript, and Supabase (PostgreSQL 15), it powers both the public digital presence and internal facility operations for Brother's Fitness in Lakhnadon, MP, India.

### 1. Gym Administration ERP Suite (`/admin/*`)
- **Member Directory & Lifecycle**: Complete CRUD operations, real-time search, plan filtering (`active`, `expiring ≤7d`, `expired`, `incomplete`), and quick WhatsApp renewal triggers.
- **Member Photo Storage**: Avatars validated via binary magic-byte inspection (JPEG, PNG, WebP) and stored in Supabase Storage with client-side Web Worker pre-compression.
- **Printable Digital Receipts**: Branded membership payment receipts generated on-the-fly with trainer credentials and WhatsApp delivery options.
- **Leads Inbox & CRM**: Real-time visitor inquiries received from the public website, equipped with 1-click direct WhatsApp and telephone dialer actions.
- **Financial Analytics & Cohorts**: 12-month revenue bar visualization, plan popularity breakdown, and 6-month member retention health tracking.
- **Immutable Audit Trail**: Administrative activity log (`public.admin_activity_logs`) recording every administrative event (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `BACKUP`) with IP and client metadata.
- **Database Backup Engine**: 1-click JSON snapshot exports with mirrored automated uploads to the private Supabase `backups` bucket.

### 2. Trainee Experience & Diagnostic Tools
- **Tactical Nutrition Synthesizer (`/fuel`)**: Computes BMR and TDEE using the Mifflin-St Jeor equation. Generates a tailored 6-meal daily schedule and a 15-day categorized grocery procurement list, complete with Hindi/English bilingual toggling and client-side PDF export.
- **Multi-Provider AI Fallback**: Resilient 16-model cascade spanning Groq (Llama 3.3 70B), Mistral, OpenRouter, Cohere, and Vercel AI with strict 8-second per-call timeouts.
- **IST Quota & Credit Engine**: Daily AI interaction limits (5 credits default) tracked atomically in PostgreSQL with automatic Indian Standard Time (IST) resets.
- **Interactive Exercise Library (`/workouts`)**: 800+ exercise movements mapped with animated illustrations, muscle group filters, and a tactical stopwatch with audio and haptic vibration feedback.
- **Diagnostic Fitness Calculators (`/calculators`)**: BMI, TDEE, and 1RM (Brzycki and Epley algorithms) calculators with shareable report export cards.
- **Gamification & Trophy Room (`/trophy-room`)**: Trainee visit streak tracking, unlockable achievement medals, motivational quote cycler, and Bro Split vs. Triple Split workout protocol selectors.

---

## 🏗️ System Architecture

BroFit employs a decoupled serverless architecture separating public trainee interactions from administrative management:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       BROFIT SYSTEM TOPOLOGY                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   PUBLIC TRAINEES (Web / PWA)                        ADMINISTRATORS (Management Console)         │
│   • Google OAuth Sign-In                             • Passcode Authentication (Master Secret)   │
│   • Trainee Profile & AI Credits                     • HMAC-SHA256 Bearer Token (24h TTL)        │
│   • Diet Synthesizer & Chatbot                       • Member CRUD, Leads CRM, Audit, Backups    │
│                  │                                                      │                        │
│                  ▼                                                      ▼                        │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               NEXT.JS 15 APP ROUTER RUNTIME                              │   │
│   │                                                                                          │   │
│   │   [PUBLIC & TRAINEE API ROUTES]               [ADMIN PROTECTED ROUTES (/api/admin/*)]    │   │
│   │   • /api/chat        • /api/contact           • requireAdminToken() Guard                │   │
│   │   • /api/generate-diet                        • /api/admin/login     • /api/admin/backup │   │
│   │   • /api/exercises/ninjas                     • /api/admin/members   • /api/admin/upload │   │
│   │   • /api/public/member-count                  • /api/admin/leads     • /api/admin/logout │   │
│   │   • /api/rate-limit-status                    • /api/admin/activity-logs                 │   │
│   │   • /api/health                               • /api/admin/verify                        │   │
│   │                                                                                          │   │
│   │   [CRON ROUTE]                                                                           │   │
│   │   • /api/cron/monthly-revenue (Protected by CRON_SECRET & timingSafeEqual)                │   │
│   └───────────────┬──────────────────────────┬───────────────────────────────┬───────────────┘   │
│                   │                          │                               │                   │
│                   ▼                          ▼                               ▼                   │
│   ┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌──────────────────────┐  │
│   │       SUPABASE POSTGRES       │ │      UPSTASH REDIS / MEM      │ │  AI FALLBACK ENGINE  │  │
│   │ • public.users (RLS)          │ │ • Sliding-Window Rate Limit   │ │ 1. Groq (Llama 3.3)  │  │
│   │ • public.gym_members          │ │ • Admin Revocation Blacklist  │ │ 2. Mistral AI        │  │
│   │ • public.contact_submissions  │ │   (brofit:admin:revoked-      │ │ 3. OpenRouter        │  │
│   │ • public.admin_activity_logs  │ │    nonces set)                │ │ 4. Cohere            │  │
│   │ • public.app_settings         │ │                               │ │ 5. Vercel AI         │  │
│   │ • Storage: member-photos,     │ │                               │ │ (8s call timeout /   │  │
│   │   backups                     │ │                               │ │  60s total deadline) │  │
│   │ • RPC: spend_user_credit()    │ │                               │ │                      │  │
│   │ • RPC: reset_daily_credits()  │ │                               │ │                      │  │
│   └───────────────────────────────┘ └───────────────────────────────┘ └──────────────────────┘  │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

> For deep architectural details, sub-system pipelines, and design trade-offs, refer to [**System Architecture Guide**](docs/ARCHITECTURE.md).

---

## 💻 Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `15.5.23` | App Router, React Server Components, Edge/Node API route handlers. |
| **UI Library** | [React](https://react.dev/) | `19.0.0` | Declarative UI components and custom hooks. |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `5.0` | Strict static type-safety across client components and server APIs. |
| **Database & Auth** | [Supabase](https://supabase.com/) | `2.89.0` | PostgreSQL 15, Google OAuth, Row Level Security (RLS), and S3 Storage. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `3.4.1` | Utility-first styling, responsive layouts, and custom design tokens. |
| **State & Cache** | [SWR](https://swr.vercel.app/) | `2.3.9` | Client data synchronization, optimistic UI updates, and revalidation. |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) | `2.0.8` | Distributed sliding-window rate limiting and token revocation set. |
| **Validation** | [Zod](https://zod.dev/) | `3.24.2` | Runtime schema validation for API inputs and AI structured outputs. |
| **AI Integration** | [OpenAI SDK](https://github.com/openai/openai-node) / [Cohere](https://cohere.com/) | `6.15.0` / `7.19.0` | Multi-provider unified AI communication client. |
| **PWA Support** | [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa) | `10.2.9` | Workbox service worker caching and offline capabilities. |
| **Exporting** | [jsPDF](https://github.com/parallax/jsPDF) / [html2canvas](https://html2canvas.hertzen.com/) | `4.2.1` / `1.4.1` | Client-side bilingual diet plan and diagnostic card PDF generation. |
| **Testing** | [Vitest](https://vitest.dev/) / Testing Library | `4.1.11` | Unit and integration test runner with V8 coverage enforcement. |

---

## 📁 Directory Structure

```
brofit/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI workflow (lint + test + coverage)
├── __tests__/                   # Vitest unit and integration test suite (16 suites, 130 tests)
├── app/                         # Next.js 15 App Router structure
│   ├── (public pages)           # /, /fuel, /workouts, /calculators, /pricing, /quotes, /trophy-room
│   ├── admin/                   # Admin management console (/dashboard, /members, /leads, etc.)
│   └── api/                     # Serverless REST endpoints (/admin/*, /chat, /generate-diet, etc.)
├── components/                  # UI Component architecture
│   ├── admin/                   # Admin UI modals, receipts, member cards, analytics
│   ├── features/                # Domain-specific components (diet builder, calculators, timers)
│   ├── public/                  # Public marketing sections (Hero, Navbar, Footer)
│   └── ui/                      # Primitive design components and modal shells
├── docs/                        # Dedicated Technical Documentation (Single Sources of Truth)
│   ├── assets/                  # iOS design SVG mockups in red and black theme
│   ├── API.md                   # Complete REST endpoint specifications & JSON payloads
│   ├── ARCHITECTURE.md          # Topology, separation of concerns, and AI fallback cascade
│   ├── DATABASE.md              # PostgreSQL schema, RLS policy matrix, and stored procedures
│   ├── DEPLOYMENT.md            # Production setup for Vercel, Supabase, and Upstash
│   └── SECURITY.md              # Zero-trust auth, constant-time verification, and anti-abuse
├── hooks/                       # Custom React hooks (useAdminStats, useModalDismiss)
├── lib/                         # Core server logic, client factories, and utility modules
│   ├── admin-auth.ts            # requireAdminToken server middleware guard
│   ├── ai-provider.ts           # 16-model multi-provider fallback engine
│   ├── auth.ts                  # HMAC-SHA256 signer and Redis token blacklist
│   ├── config.ts                # Canonical business rules, plans, and constants
│   ├── credit-service.ts        # Trainee token verification & atomic RPC spend
│   ├── rate-limit.ts            # Distributed sliding-window rate limiter
│   └── validation.ts            # Zod validation schemas
├── public/                      # Static assets, PWA icons, manifest.json
└── supabase/
    └── migrations/              # Chronological SQL migrations and procedures
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later.
- **Package Manager**: `npm` (v10+).
- **Supabase Account**: With an active PostgreSQL project.

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/4nur4gmishr4/BrothersFitness.git
   cd BrothersFitness
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   > Refer to [**Deployment Guide**](docs/DEPLOYMENT.md#2-environment-variables-provisioning) for full variable descriptions and key generation commands.

4. **Initialize Database**:
   Execute the migration SQL files located in `supabase/migrations/` in chronological order via the Supabase SQL Editor. See [**Database Guide**](docs/DATABASE.md) for full instructions.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access the public application at [http://localhost:3000](http://localhost:3000) and the admin console at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

---

## 🧪 Testing & Quality Assurance

BroFit enforces strict quality assurance with automated linting, type-checking, and test coverage:

```bash
# Execute unit and integration tests
npm test

# Run tests with V8 coverage report
npm run test:coverage

# Run ESLint validation
npm run lint

# Compile production bundle
npm run build
```

### Coverage Enforcement Thresholds (`lib/**/*.ts`)
- **Statements**: ≥ 80%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%
- **Branches**: ≥ 70%

---

## ❓ Troubleshooting

| Issue / Symptom | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **Admin Login 401 Unauthorized** | `ADMIN_PASSWORD` in `.env.local` differs from entered password or has trailing whitespace. | Check `ADMIN_PASSWORD` in `.env.local` and submit exact value without whitespace. |
| **"INSUFFICIENT_CREDITS" / 402 on Diet Generation** | Trainee has used their 5 daily AI credits prior to the IST midnight boundary. | Wait for midnight IST reset or adjust `max_daily_credits` in `public.app_settings`. |
| **Diet Generator Returns 503 / All AI Models Failed** | No valid AI provider keys configured or upstream rate limit encountered. | Provide at least one valid key (`GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, or `COHERE_API_KEY`). |
| **Image Upload Fails with 400 "Invalid file type"** | File binary header does not match magic-byte signatures for JPEG, PNG, or WebP. | Ensure the file is an authentic image rather than a renamed file or corrupt binary. |
| **Rate Limit Lockout (429 Too Many Requests)** | Exceeded 5 login attempts per 15 minutes or 3 contact submissions per hour. | Wait for the sliding window to reset (`Retry-After` seconds) or restart local dev server. |

---

## 📄 License & Attribution

Brother's Fitness (BroFit) is open-source software licensed under the [MIT License](LICENSE).

Developed with pride for **Brother's Fitness**, Lakhnadon, Madhya Pradesh, India.  
For business inquiries, visit [brothersfitness.in](https://brothersfitness.in).