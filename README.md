<div align="center">
  <img src="https://raw.githubusercontent.com/4nur4gmishr4/BrothersFitness/main/public/assets/favicon.png" width="100" height="100" alt="Brother's Fitness Logo">
  
  <h1 style="color: #D71921; border-bottom: none;">BROTHER'S FITNESS</h1>
  
  <p><strong>PAIN IS TEMPORARY. PRIDE IS FOREVER.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/Supabase-Database-black?style=flat-square&logo=supabase" alt="Supabase">
    <img src="https://img.shields.io/badge/Vitest-Tested-black?style=flat-square&logo=vitest" alt="Vitest">
    <img src="https://img.shields.io/badge/CI/CD-Active-black?style=flat-square&logo=github-actions" alt="CI/CD">
  </div>
</div>

---

## What is Brother's Fitness?
This is a custom-built Gym Management System designed for Aman and Pradeep to run their gym with professional-grade tools. It is not just a website; it is an industrial tool that handles everything from member registrations to AI-powered diet planning.

## Master Features

### 🏢 The Admin Command Center
The dashboard is built for speed. It allows the team to:
* **Track Revenue**: See monthly growth and projected income instantly.
* **Manage Members**: Add new people, upload photos via camera or gallery, and keep notes on their progress.
* **Automated Alerts**: The system reminds you about upcoming birthdays and memberships that are about to expire.
* **One-Click Logic**: Send bulk WhatsApp messages or generate PDF receipts for payments in seconds.

### 🍱 The AI Diet Engine
We built a redundant AI stack to make sure the diet generator never goes offline.
* **Active Models**: Llama 3.3 70B (Groq), Llama 3.1 8B (Groq), and Gemini 2.0 Flash (Google).
* **Smart Fallback**: If one model is busy or hits a limit, the system automatically tries the next one.

### 🛡️ Production Standards
The code is built to industry standards:
* **Automated Testing**: We use **Vitest** to run unit tests on all core logic (validation, rate-limiting, and AI).
* **Continuous Integration**: Every time code is pushed to GitHub, an automated pipeline runs tests and linting to ensure nothing is broken.
* **Fast & PWA**: The site is optimized for speed and can be "installed" on any phone like a native app.

## Tech Specs
* **Frontend**: Next.js 15 (App Router) + Framer Motion
* **Database**: Supabase + Firebase Firestore
* **Security**: Role-based admin access + Zod validation
* **Infrastructure**: GitHub Actions CI + Vitest

## Setup for Development

1. **Get the Code**
   ```bash
   git clone https://github.com/4nur4gmishr4/BrothersFitness.git
   cd BrothersFitness
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with your keys for Supabase, Firebase, and whichever AI providers you are using (Groq/Google).

3. **Run Locally**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

---

## THE DEVELOPER
High-performance code engineered by:
*   **Anurag Mishra** ([@4nur4gmishr4](https://github.com/4nur4gmishr4))

## THE ARCHITECTS
Concept and training protocols designed by:
*   **Aman**: Founder & Elite Strength Coach
*   **Pradeep**: Head of Performance & Conditioning

© 2024 Brother's Fitness. All rights reserved.
