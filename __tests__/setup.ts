import '@testing-library/jest-dom';

// The AI provider clients are mocked in ai.test.ts, but lib/ai-provider.ts
// GATES each provider on its env key being present (skips it otherwise), so the
// first provider in the stack needs its key set for the mock to be exercised.
// ADMIN_PASSWORD is read by lib/auth.ts for token signing.
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.ADMIN_PASSWORD = 'BroFit@Aman2026';
