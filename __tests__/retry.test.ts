// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { withRetry, isTransientError, retryableQuery } from '@/lib/retry';

describe('withRetry', () => {
    it('succeeds immediately when the call works', async () => {
        const fn = vi.fn(async () => 42);
        await expect(withRetry(fn)).resolves.toBe(42);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries transient failures and eventually succeeds', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockRejectedValueOnce(new Error('fetch failed'))
            .mockResolvedValueOnce('ok');
        await expect(withRetry(fn)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('does NOT retry permanent errors', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('bad request'));
        await expect(withRetry(fn)).rejects.toThrow('bad request');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws the last error when retries are exhausted', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fetch failed'));
        await expect(withRetry(fn, { attempts: 2 })).rejects.toThrow('fetch failed');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('isTransientError', () => {
    it('classifies network errors as transient', () => {
        expect(isTransientError(new Error('fetch failed'))).toBe(true);
        expect(isTransientError(new Error('ECONNRESET'))).toBe(true);
        expect(isTransientError({ message: 'network error' })).toBe(true);
    });

    it('classifies server (5xx) errors as transient', () => {
        expect(isTransientError({ message: 'postgrest 503 service unavailable' })).toBe(true);
    });

    it('classifies permanent errors as non-transient', () => {
        expect(isTransientError(new Error('invalid input'))).toBe(false);
        expect(isTransientError({ message: '404 not found' })).toBe(false);
        expect(isTransientError(null)).toBe(false);
    });
});

describe('retryableQuery', () => {
    it('returns the result on success', async () => {
        const fn = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
        await expect(retryableQuery(fn)).resolves.toEqual({ data: { ok: true }, error: null });
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries when the result carries a transient error', async () => {
        const fn = vi.fn()
            .mockResolvedValueOnce({ data: null, error: new Error('fetch failed') })
            .mockResolvedValueOnce({ data: { ok: true }, error: null });
        await expect(retryableQuery(fn)).resolves.toEqual({ data: { ok: true }, error: null });
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('passes permanent errors through without retrying', async () => {
        const fn = vi.fn().mockResolvedValue({ data: null, error: new Error('bad request') });
        const result = await retryableQuery(fn);
        expect(result.error).toBeInstanceOf(Error);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
