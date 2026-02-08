# Behind the Iron: Project Structure 🏗️

This project isn't just a collection of files; it's a carefully organized machine. Here is exactly how the **Brother's Fitness** codebase is built and where everything lives.

## 📂 Root Level - The Command Center
The root of the project contains all the core configurations that hold the engine together.
- `package.json`: This lists all the heavy-duty libraries we use (Next.js, Tailwind, Framer Motion).
- `tsconfig.json`: The rules for how TypeScript keeps the code safe and bug-free.
- `vitest.config.ts`: Configuration for our unit testing framework.
- `.github/`: This contains our **CI Pipeline** (GitHub Actions) that tests the code automatically whenever we push.

---

## 📂 /app - The Routing & API
This is using the **Next.js App Router**. It handles both what the user sees and the hidden server-side logic.

- `(pages)`: Files like `layout.tsx` and `page.tsx` define the homepage and the main shell of the site.
- `admin/`: All the logic for the Admin Dashboard.
- `api/`: The serverless backend.
  - `admin/`: For member management, logic for uploading photos, and backups.
  - `chat/`: The logic that talks to the AI engines.
  - `generate-diet/`: The massive engine that processes user inputs and creates diet plans.
  - `cron/`: Scheduled tasks (like the monthly revenue reporter).

---

## 📂 /components - The UI Warehouse
We break the interface into small, reusable bricks so it's easy to maintain.

- `admin/`: Specialist components like the `AnalyticsPanel` or `BulkMessageModal`.
- `react-bits/`: Ultra-premium animations and custom UI elements used to give the site its high-end feel.
- `Hero.tsx`, `Navbar.tsx`, `Footer.tsx`: The main visual blocks of the homepage.
- `TacticalChatbot.tsx`: The entire floating AI assistant logic.

---

## 📂 /lib - The Brain
This is where the actual "intelligence" of the app lives. If the app does something smart, it's probably here.

- `ai-provider.ts`: The fallback logic that decides whether to use Llama or Gemini.
- `config.ts`: The single source of truth for gym prices, coaching info, and settings.
- `user-auth-context.tsx`: Handles complex user sessions, Google logins, and daily credits.
- `supabase.ts` & `firebase.ts`: The bridge to our cloud databases.
- `rate-limit.ts`: The gatekeeper that prevents bots or abuse of the AI tools.

---

## 📂 /public - The Assets
The heavy-lifting files like images, branding, and sounds.
- `assets/`: Logos and coach portraits.
- `audio/`: Sounds for the interface (like the keyboard typing sounds in the chatbot).
- `manifest.json`: What makes the site a **PWA** (Installable App).

---

## 📂 /__tests__ - The Quality Gate
This is where our unit tests live. Before the code is allowed to reach production, it must pass the tests stored here for its logic and validation schemas.

---

### Why this structure?
We built it this way so that if you want to change a price, you look in `lib`. If you want to change a button color, you look in `components`. If you want to change how the AI thinks, you look in `lib/ai-provider`. Everything has one specific home.
