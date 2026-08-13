# BroFit Full-Codebase Bug Audit

**Date:** 2026-08-09
**Scope:** Every file in `app/`, `components/`, `lib/`, `tailwind.config.ts`, `next.config.mjs`
**Total findings:** 128

## Fix Status

Phase 1 = CRITICAL + HIGH (all done), Phase 2 = MEDIUM (in progress), Phase 3 = LOW + MINOR.

| # | Status | Fix |
|---|---|---|
| C1 | ✅ Fixed | Render-time setState moved into `useEffect` in LoginModal |
| C2 | ✅ Fixed | `/api/rate-limit-status` now reads credits from Supabase user row (authoritative) instead of the broken `peekRateLimit` Redis path |
| H1 | ✅ Fixed | `try/catch/finally` around `signInWithGoogle` |
| H2 | ✅ Fixed | `export const dynamic = 'force-dynamic'` on member-count route |
| H3 | ✅ Fixed | Added `mounted` flag to ThemeProvider context; FOUC already prevented by pre-paint `themeScript` in layout |
| H4 | ✅ Fixed | Audio plays only after first user interaction (`hasInteracted`) |
| H5 | ✅ Fixed | AbortController + cleanup in Hero fetch |
| H6 | ✅ Fixed | Fuzzysort threshold `-10000` → `-500` |
| H7 | ✅ Fixed | Reset collapses pushed history entries via `baseIndex` + `history.go(-N)` |
| M1 | ✅ Fixed | Fuel inputs: `handleInputFocus` (data-wipe) → `e.target.select()` |
| M7 | ✅ Fixed | 429 message shows the cap (`maxRequests`) instead of `0/N` |
| L33-35 | ✅ Fixed | Monthly-revenue cron: null membership_end=expired, IST date parsing, column select |

---


## CRITICAL (2)

| # | File | Line(s) | Summary |
|---|---|---|---|
| C1 | `components/LoginModal.tsx` | 35-39 | **Render-time setState**: `onSuccess()` and `onClose()` called during render phase when `isLoggedIn && isOpen`. Triggers React warning "Cannot update a component while rendering another" and can cause inconsistent UI or thrown error in strict mode. |
| C2 | `app/api/rate-limit-status/route.ts` + `lib/rate-limit.ts` | 203 / 199-216 | **`peekRateLimit` Redis path always lies**: reads key `brofit:ratelimit:peek:${id}` that nothing ever writes. In production, `/api/rate-limit-status` always returns `remaining = max`. UI credit badge always shows full. |

## HIGH (7)

| # | File | Line(s) | Summary |
|---|---|---|---|
| H1 | `components/LoginModal.tsx` | 19-33 | **Stuck loading on sign-in failure**: `handleGoogleSignIn` has no try/finally. If `signInWithGoogle()` rejects, `setLoading(false)` never runs — button stuck on "Fetching Profile..." forever. |
| H2 | `app/api/public/member-count/route.ts` | whole | **Build-time cache**: no `dynamic = 'force-dynamic'`, so member count is frozen at build time and never updates until redeploy. |
| H3 | `components/ThemeProvider.tsx` | ~30 | **SSR hydration mismatch**: server renders default ("dark") while client reads localStorage in `useEffect`. Causes theme flash and React hydration warnings. |
| H4 | `components/QuoteCycler.tsx` | ~40 | **Audio autoplay blocked**: `audio.play()` called without user gesture — browsers silently block it. Sound feature never works. |
| H5 | `components/Hero.tsx` | 27-37 | **Fetch without AbortController**: on quick navigation, response resolves after unmount, calling `setState` on unmounted component. |
| H6 | `components/WorkoutLibrary.tsx` | ~32 | **Fuzzysort threshold `-10000`**: accepts every candidate — search results are mostly irrelevant. |
| H7 | `components/PaymentSection.tsx` | ~120 | **Incomplete popstate restore**: Back button mid-payment leaves UI in half-reset state (step advanced, payment method lost). |

## MEDIUM (36)

| # | File | Line(s) | Summary |
|---|---|---|---|
| M1 | `app/fuel/page.tsx` | 295-297 | **`handleInputFocus` clears field on every focus** — wipes values, resets calculatedCalories, disables Generate button. |
| M2 | `app/fuel/page.tsx` | 135-221 | **Duplicate validation**: `validateInputs()` and `generatePlan` both validate the same ranges. Lines 200-221 are unreachable dead code. |
| M3 | `app/quotes/page.tsx` | 300,316 | **Index out of bounds on category switch**: `currentQuoteIndex` keeps previous value for one render, flashes "undefined" if new category has fewer quotes. |
| M4 | `app/api/contact/route.ts` | 49 | **Silent data loss**: uses anon Supabase client; if RLS doesn't grant INSERT, leads silently dropped while visitor gets `{ success: true }`. |
| M5 | `app/api/generate-diet/route.ts` | 262 | **Info leak**: 500 response includes `details: errorMessage` (raw internal error strings). |
| M6 | `app/api/chat/route.ts` + `generate-diet/route.ts` | 37, 49 / 59-84 | **No input length bounds**: `message` and `goal_description` have no max length. Enables prompt injection and cost inflation. |
| M7 | `app/api/chat/route.ts` + `generate-diet/route.ts` | 24 / 47 | **Wrong 429 message**: shows "0/0" when blocked (`remaining` is 0, should show the cap). |
| M8 | `app/api/exercises/ninjas/route.ts` | 27-30 | **In-memory cache useless in serverless**: resets every cold start, never evicts, no `force-dynamic`. |
| M9 | `app/api/admin/upload/route.ts` | 25-45 | **MIME spoofing**: trusts client-supplied `file.type`; no magic-byte inspection. Arbitrary content can be uploaded as `.jpg`. |
| M10 | `app/api/admin/members/route.ts` | 56-63, 87-90 | **Unbounded fetch**: no params returns every member. `%term%` ILIKE can't use indexes. |
| M11 | `app/admin/members/page.tsx` | 134 | **Double-counting**: expiring members counted in "Active" AND "Expiring Soon". |
| M12 | `app/admin/members/page.tsx` | 248 | **CSV injection**: no escaping of formula prefix chars (`=+-@`) in export. |
| M13 | `lib/rate-limit.ts` | 183 | **Shared "unknown" bucket**: all clients without proxy headers share one bucket — one bad actor locks everyone out. |
| M14 | `app/admin/members/page.tsx` | 111-127 | **401 not handled in fetchMembers**: expired admin token silently shows empty grid instead of redirecting. |
| M15 | `components/ExpiringMembersTable.tsx` | ~80 | **`flex` on `<td>`**: breaks table layout alignment in group headers. |
| M16 | `components/CountdownTimer.tsx` | ~40 | **`onComplete` in deps**: effect re-runs when `timeLeft <= 0`, calling onComplete repeatedly. |
| M17 | `components/QuoteCycler.tsx` | ~35 | **Audio leak**: `Audio` object never stopped/removed in effect cleanup — memory/context leak. |
| M18 | `components/GamificationContext.tsx` | 60-80 | **No useCallback on context functions**: every render creates new context value, re-rendering all consumers. |
| M19 | `components/ShareMissionReport.tsx` | ~70 | **DOM leak**: dynamically created `<a>` for download never removed after `click()`. |
| M20 | `components/TacticalStopwatch.tsx` | ~60 | **Time format**: displays `90s` as `1.5m` instead of `1m30s`. |
| M21 | `components/PageWrapper.tsx` | ~40 | **Scroll lock leak**: loader sets `overflow: hidden` but not all exit paths run cleanup. |
| M22 | `components/TacticalChatbot.tsx` | 232, 289 | **`onPointerDownCapture` stopPropagation**: fragile hack breaks scroll/focus inside chat panel. |
| M23 | `components/TacticalChatbot.tsx` | 85-94 | **Spam-able error messages**: credits exhausted — input stays enabled, user can stack duplicate error bubbles. |
| M24 | `components/IncompleteProfiles.tsx` | ~60 | **Table overflow on mobile**: no card view unlike ExpiringMembersTable. |
| M25 | `components/admin/MemberFormModal.tsx` | 126-154 | **Silent photo failure**: upload swallows error, saves member without photo while showing "Uploading Photo..." then success toast. |
| M26 | `components/admin/MemberFormModal.tsx` | 164-170 | **Orphaned photo**: image uploaded before member record; if member POST fails, image orphaned. |
| M27 | `components/admin/MemberReceiptModal.tsx` | 67 | **UTC date near IST midnight**: `formatDate(new Date().toISOString())` can show yesterday's date. |
| M28 | `components/admin/MemberReceiptModal.tsx` | 23 | **`window.open` ignored**: toast says "Receipt sent!" even if popup was blocked. |
| M29 | `components/admin/LeadsInbox.tsx` | 252 | **Hardcoded `91` prefix**: if number already has country code, URL becomes `9191...`. |
| M30 | `components/admin/LeadsInbox.tsx` | 77 | **Polling when hidden**: wastes API calls when tab is backgrounded. |
| M31 | `components/admin/BulkMessageModal.tsx` | 129-140 | **Filter counts wrong**: every non-"all" button shows the current filter's count, not its own. |
| M32 | `components/admin/BulkMessageModal.tsx` | 78-82 | **Comma-separated numbers in WhatsApp**: needs newlines, not commas, for multiple chats. |
| M33 | All modals (Login, Profile, Welcome, Receipt, MemberForm, ActivityLog, LeadsInbox, BulkMessage, Chatbot) | various | **No focus trap, no Escape, no `aria-modal`**: keyboard users tab behind overlays. |
| M34 | All modals | various | **Inconsistent z-index scale**: `z-[60]` to `z-[9999999]` — Receipt renders below chatbot. |
| M35 | `components/HeroLoopManager.tsx` | 15-30 | **Contradictory Tailwind classes**: same elements have both `block` and `inline-block`. |
| M36 | Dual quota reset mismatch | `lib/rate-limit.ts` + `lib/credit-service.ts` | **Redis 24h sliding window vs IST 5:30 AM reset**: between 5:30-6:00 AM, Supabase credits reset but Redis blocks. User sees "credits used up" despite having 5 credits. |

## LOW (55)

| # | File | Line(s) | Summary |
|---|---|---|---|
| L1 | `app/page.tsx` + `ReadingProgressBar` | — | **Duplicate scroll progress bar**: homepage has inline bar + global bar (both h-1, top-0). |
| L2 | `app/globals.css` / `layout.tsx` | 90 / 100 | **`scroll-behavior: smooth`**: Next.js deprecation warning. |
| L3 | `lib/rate-limit.ts` | 240-243 | **AI_COMBINED sliding window doesn't match IST reset** (see M36 above). |
| L4 | `components/TacticalSoundContext.tsx` | ~60 | **Stale closure risk** on `playSound` callback. |
| L5 | `components/TacticalSoundContext.tsx` | ~20 | **Dead base64 sound payloads**: large unused data. |
| L6 | `components/PaymentSection.tsx` | ~30 | **Constants inside component body**: recreated every render. |
| L7 | `components/Navbar.tsx` | 64-75 | **Dead code**: `scrollToSection` is unreachable (all items `isRoute: true`). |
| L8 | `components/Navbar.tsx` | 38-53 | **Three overlapping overflow effects**: consolidate into one. |
| L9 | `components/Navbar.tsx` | 149 | **Missing `aria-pressed`** on theme toggle. |
| L10 | `components/Navbar.tsx` | 28 | **`useAdmin()` fires network verify** on every page load. |
| L11 | `components/Footer.tsx` | 39-50 | **Dead `/#` branch** in `navigateTo`. |
| L12 | `components/Footer.tsx` | 66-88 | **Inconsistent navigation** (onClick+router vs next/link). |
| L13 | `components/WorkoutLibrary.tsx` | 69-93 | **Constants inside component body**: recreated every render. |
| L14 | `components/WorkoutLibrary.tsx` | 60-66 | **Missing retry button** on error state. |
| L15 | `components/ContactForm.tsx` | 177 | **No AbortController** on fetch. |
| L16 | `components/SocialBar.tsx` | ~20 | **Fixed position overlaps** navbar/chatbot on short viewports. |
| L17 | `components/ThemedToaster.tsx` | ~20 | **`z-index: 9999999`** — 10x higher than next highest modal. |
| L18 | `components/ProfileModal.tsx` | ~83 | **setTimeout not cleared** on unmount — can set state after close. |
| L19 | `components/ProfileModal.tsx` | ~105 | **`z-[9999]`** inconsistent with LoginModal `z-[100000]`. |
| L20 | `components/ProfileModal.tsx` | ~23 | **`photoUrl` state unused** — read-only, never editable. |
| L21 | `components/WelcomeModal.tsx` | 13-20 | **No dialog semantics**, no Escape, no focus trap. |
| L22 | `components/TacticalChatbot.tsx` | 123, 128 | **Identical ternary branches**: both say "Connection failed.". |
| L23 | `components/TacticalChatbot.tsx` | 148-149 | **Commented-out dead code**. |
| L24 | `components/TacticalChatbot.tsx` | 144 | **`sentFlash` timer not tracked**: rapid sends pile up. |
| L25 | `components/MemberCard.tsx` | ~108 | **Delete button missing `aria-label`**. |
| L26 | `components/MemberCard.tsx` | 36-46 | **Photo button focusable when no photo**. |
| L27 | `components/Placeholder.tsx` | ~30 | **`aria-hidden` on meaningful monogram**. |
| L28 | `components/ActivityLogPanel.tsx` | 32-49 | **Stale data on fetch failure**. |
| L29 | `components/react-bits/CurvedLoop.tsx` | ~30 | **Pointless memo** of primitive. |
| L30 | `components/react-bits/CurvedLoop.tsx` | ~80 | **No `passive: true`** on pointer handler, no pointercancel. |
| L31 | `components/ScrollReveal.tsx` | ~20 | **Observer not re-observed** for dynamically added elements. |
| L32 | `components/DecryptedText.tsx` | ~15 | **Duplicate character** in scramble set, recreated per render. |
| L33 | `app/api/cron/monthly-revenue/route.ts` | 93-96 | **Null `membership_end` counts as active forever**. | ✅ Fixed
| L34 | `app/api/cron/monthly-revenue/route.ts` | 24-28 | **UTC date slicing** for IST dates. | ✅ Fixed
| L35 | `app/api/cron/monthly-revenue/route.ts` | 62-63 | **Over-fetching**: `select('*')` when only 3 fields needed. | ✅ Fixed
| L36 | `app/api/exercises/ninjas/route.ts` | 46 | **Raw error in 500 body** (info leak). | ✅ Fixed
| L37 | `app/api/public/member-count/route.ts` | 17-18 | **Returns 200 `{count:0}` on error** — masks outages. | ✅ Fixed
| L38 | `app/api/generate-diet/route.ts` | — | **No `maxDuration`**: can exceed Vercel default function budget. |
| L39 | `app/api/generate-diet/route.ts` | 141 | **Prompt numbering jump** 7→10. |
| L40 | `app/fuel/page.tsx` | 38-45 | **`mode` defaults "bulk"** when weights equal — silently biases AI. |
| L41 | `app/page.tsx` | 10-15 | **No loading fallback** for dynamic imports. |
| L42 | `app/sitemap.ts` | 20 | **`lastModified: new Date()`** — always "today". |
| L43 | `app/admin/members/page.tsx` | 73 | **Corrupt localStorage aborts** whole lead-count fetch. |
| L44 | `app/admin/members/page.tsx` | 262 | **Hardcoded `91`** while `WHATSAPP_COUNTRY_CODE` exists unused. |
| L45 | `app/admin/members/page.tsx` | 363 | **Hardcoded "Welcome back, Aman"**. |
| L46 | `app/admin/members/page.tsx` | 189-193 | **`expiringToday` ignores year** — 2025 membership flags in 2026. |
| L47 | `app/api/admin/members/route.ts` | 150-151 | **Hardcoded `91`** (same as L44). |
| L48 | `app/api/admin/members/route.ts` | 167-224 | **DELETE returns success** even when member doesn't exist. |
| L49 | `app/api/admin/members/route.ts` | 52 | **Page overflow**: huge page overflows `.range()` precision. |
| L50 | `lib/member-utils.ts` | 44-52 | **Feb 29 edge case**: birthday on non-leap years rolls to Mar 1. |
| L51 | `app/api/contact/route.ts` | 33 | **Honeypot check position-dependent**. |
| L52 | `lib/ai-provider.ts` | 100 | **OpenRouter `HTTP-Referer: brofit.app`** — wrong domain. |
| L53 | `lib/user-auth-context.tsx` + `lib/credit-service.ts` | 55 / 12 | **`istToday()` duplicated** in two files. |
| L54 | `app/admin/members/page.tsx` | 316 | **Double-filter**: `IncompleteProfiles` gets full list, filters internally. |
| L55 | `lib/rate-limit.ts` | 104-137 | **In-memory fallback non-atomic** across concurrent requests. |

## MINOR (28)

| # | File | Summary |
|---|---|---|
| m1 | `app/api/admin/verify/route.ts` | Uses `console.error` instead of logger |
| m2 | `app/api/admin/members/route.ts` | Uses `console.warn` instead of logger |
| m3 | `app/api/admin/leads/route.ts`, `activity-logs/route.ts` | Uses `console.error` instead of logger |
| m4 | `app/quotes/page.tsx` | Shuffle icon semantically wrong for grid toggle |
| m5 | `app/globals.css` | Design header says "NEVER shadows" but elevated/modal use shadows |
| m6 | `app/globals.css` | Skeleton light-theme overrides duplicated |
| m7 | `app/globals.css` | Redundant `appearance-none` on selects |
| m8 | `app/layout.tsx` | `siteUrl` fallback duplicated in 3 files |
| m9 | `components/HeroLoopManager.tsx` | Same elements have both `block` and `inline-block` |
| m10 | `components/Navbar.tsx` | `isActive` logic has redundant `"/"` check |
| m11 | `components/Navbar.tsx` | `TrophyRoom` imported statically vs dynamic for others |
| m12 | `components/react-bits/DecryptedText.tsx` | Duplicate 'A' in scramble set |
| m13 | `components/admin/MemberFormModal.tsx` | `Date.now()` as upload ID can collide |
| m14 | `components/admin/MemberFormModal.tsx` | `bg-text-mid/30` likely doesn't compile |
| m15 | `components/admin/MemberFormModal.tsx` | `imageCompression` could be dynamically imported |
| m16 | `components/admin/BulkMessageModal.tsx` | `phoneNumbers` vs `filteredMembers.length` diverge |
| m17 | `components/admin/BulkMessageModal.tsx` | Same hardcoded `91` prefix risk |
| m18 | `components/admin/BulkMessageModal.tsx` | Template buttons missing active state |
| m19 | `components/admin/LeadsInbox.tsx` | Redundant double cache-bust (`no-store` + `?t=`) |
| m20 | `components/admin/LeadsInbox.tsx` | Search doesn't match email |
| m21 | `components/admin/LeadsInbox.tsx` | `MessageSquare` icon has `cursor-pointer` but no action |
| m22 | `components/admin/LeadsInbox.tsx` | List rows not keyboard accessible |
| m23 | `components/admin/MemberCard.tsx` | Photo button has `aria-disabled` but still focusable |
| m24 | `components/TacticalChatbot.tsx` | Messages grow unbounded, keys are array indexes |
| m25 | `components/ContactForm.tsx` | Phone input has no pattern validation |
| m26 | `components/Footer.tsx` | Tagline `h-6` can clip on narrow viewports |
| m27 | `app/robots.ts` | Login page still indexable via direct hit |
| m28 | `lib/rate-limit.ts` | No explicit `force-dynamic` on exercises route |
