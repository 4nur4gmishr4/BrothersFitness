import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { LoginSchema, ProfileUpdateSchema } from '@/lib/validation';

describe('Rate Limiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should allow requests within limit', () => {
        const key = 'test-token';
        const limit = { maxRequests: 2, windowMs: 1000 };

        expect(checkRateLimit(key, limit).allowed).toBe(true);
        expect(checkRateLimit(key, limit).allowed).toBe(true);
        expect(checkRateLimit(key, limit).allowed).toBe(false);
    });

    it('should reset limits after window windowMs', () => {
        const key = 'reset-token';
        const limit = { maxRequests: 1, windowMs: 1000 };

        expect(checkRateLimit(key, limit).allowed).toBe(true);
        expect(checkRateLimit(key, limit).allowed).toBe(false);

        vi.advanceTimersByTime(1100);

        expect(checkRateLimit(key, limit).allowed).toBe(true);
    });
});

describe('Validation Schemas', () => {
    describe('LoginSchema', () => {
        it('should validate correct password', () => {
            const result = LoginSchema.safeParse({ password: 'BroFit@Aman2026' });
            expect(result.success).toBe(true);
        });

        it('should fail empty passwords', () => {
            const result = LoginSchema.safeParse({ password: '' });
            expect(result.success).toBe(false);
        });
    });

    describe('ProfileUpdateSchema', () => {
        it('should validate complete profile data', () => {
            const data = {
                name: 'Aman Mishra',
                age: '25',
                height: '180',
                weight: '80',
                gender: 'Male',
                goal: 'Muscle Gain'
            };
            const result = ProfileUpdateSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail nested invalid data', () => {
            const result = ProfileUpdateSchema.safeParse({ full_name: '' });
            expect(result.success).toBe(false);
        });
    });
});
