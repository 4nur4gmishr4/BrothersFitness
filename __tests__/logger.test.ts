// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// isProduction is captured at module load, so each case reloads the module
// under the NODE_ENV it wants to exercise.
const MODULE_PATH = '@/lib/logger';

describe('logger', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    describe('development formatting', () => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', 'development');
        });

        it('logs human-readable lines with a context object', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            logger.info('hello', { user: 'u1' });
            expect(logSpy).toHaveBeenCalledWith('[INFO] hello {"user":"u1"}');
        });

        it('logs a bare message when no context is given', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            logger.warn('watch out');
            expect(warnSpy).toHaveBeenCalledWith('[WARN] watch out');
        });

        it('emits debug lines only outside production', async () => {
            const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            logger.debug('trace');
            expect(debugSpy).toHaveBeenCalled();
        });
    });

    describe('production formatting', () => {
        beforeEach(() => {
            vi.stubEnv('NODE_ENV', 'production');
        });

        it('logs structured JSON', async () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            logger.error('boom', { code: 500 });
            const [line] = errSpy.mock.calls[0] as [string];
            const parsed = JSON.parse(line);
            expect(parsed).toMatchObject({ level: 'error', message: 'boom', code: 500 });
        });

        it('suppresses debug lines in production', async () => {
            const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            logger.debug('trace');
            expect(debugSpy).not.toHaveBeenCalled();
        });

        it('child() merges bound context into every line', async () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { logger } = await import(MODULE_PATH);
            const log = logger.child({ requestId: 'req-123' });
            log.error('boom', { code: 500 });
            const [line] = errSpy.mock.calls[0] as [string];
            const parsed = JSON.parse(line);
            expect(parsed).toMatchObject({ level: 'error', message: 'boom', code: 500, requestId: 'req-123' });
        });
    });
});
