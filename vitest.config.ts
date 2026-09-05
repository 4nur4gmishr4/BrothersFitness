import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './__tests__/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            // Cover the unit-testable server/shared logic in lib/. UI components
            // and Next.js routes are exercised via the build + e2e instead.
            include: ['lib/**/*.ts'],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
