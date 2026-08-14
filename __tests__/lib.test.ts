import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { LoginSchema, ProfileUpdateSchema, MemberSchema } from '@/lib/validation';
import { PLAN_PRICES, getPlanPrice, MAX_DAILY_CREDITS, MEMBERSHIP_PLANS } from '@/lib/config';

describe('Rate Limiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('should allow requests within limit', async () => {
        const key = 'test-token';
        const limit = { maxRequests: 2, windowMs: 1000 };

        expect((await checkRateLimit(key, limit)).allowed).toBe(true);
        expect((await checkRateLimit(key, limit)).allowed).toBe(true);
        expect((await checkRateLimit(key, limit)).allowed).toBe(false);
    });

    it('should reset limits after window windowMs', async () => {
        const key = 'reset-token';
        const limit = { maxRequests: 1, windowMs: 1000 };

        expect((await checkRateLimit(key, limit)).allowed).toBe(true);
        expect((await checkRateLimit(key, limit)).allowed).toBe(false);

        vi.advanceTimersByTime(1100);

        expect((await checkRateLimit(key, limit)).allowed).toBe(true);
    });

    it('should report remaining and resetIn alongside allowed', async () => {
        const key = 'fields-token';
        const limit = { maxRequests: 3, windowMs: 1000 };

        const first = await checkRateLimit(key, limit);
        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);
        expect(first.resetIn).toBe(1);

        const blocked = await checkRateLimit(key, { ...limit, maxRequests: 1 });
        // key already used once, now at a 1-request cap → blocked, remaining 0
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
    });


    it('uses the last x-forwarded-for value to defeat spoofing', () => {
        process.env.TRUST_PROXY_HEADERS = 'true';
        const req = new Request('http://localhost', {
            headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        });
        expect(getClientIp(req)).toBe('5.6.7.8');
        delete process.env.TRUST_PROXY_HEADERS;
    });

    it('prefers x-real-ip over x-forwarded-for', () => {
        process.env.TRUST_PROXY_HEADERS = 'true';
        const req = new Request('http://localhost', {
            headers: { 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' },
        });
        expect(getClientIp(req)).toBe('9.9.9.9');
        delete process.env.TRUST_PROXY_HEADERS;
    });

    it('ignores proxy headers when no trusted proxy is configured', () => {
        // No TRUST_PROXY_HEADERS / VERCEL set → spoofed headers are ignored so
        // a client cannot fabricate an arbitrary rate-limit key.
        delete process.env.TRUST_PROXY_HEADERS;
        delete process.env.VERCEL;
        const req = new Request('http://localhost', {
            headers: { 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' },
        });
        expect(getClientIp(req)).toBe('unknown');
    });

    it('rejects non-IP proxy header values even when a proxy is trusted', () => {
        process.env.TRUST_PROXY_HEADERS = 'true';
        const req = new Request('http://localhost', {
            headers: { 'x-real-ip': '<script>alert(1)</script>', 'x-forwarded-for': 'not-an-ip' },
        });
        expect(getClientIp(req)).toBe('unknown');
        delete process.env.TRUST_PROXY_HEADERS;
    });
});

describe('Business config', () => {
    it('gives every membership plan a price', () => {
        for (const plan of MEMBERSHIP_PLANS) {
            expect(PLAN_PRICES[plan]).toBeTypeOf('number');
        }
    });

    it('looks up prices with a Monthly fallback', () => {
        expect(getPlanPrice('1 Month')).toBe(700);
        expect(getPlanPrice(undefined)).toBe(700);
        expect(getPlanPrice('Bogus Plan')).toBe(700);
    });

    it('keeps the daily credit cap consistent', () => {
        expect(MAX_DAILY_CREDITS).toBeGreaterThan(0);
    });
});

describe('MAX_DAILY_CREDITS configuration', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('defaults to 5 when no env override is set', async () => {
        vi.stubEnv('MAX_DAILY_CREDITS', '');
        const { MAX_DAILY_CREDITS: cap } = await import('@/lib/config');
        expect(cap).toBe(5);
    });

    it('honors a valid integer env override', async () => {
        vi.stubEnv('MAX_DAILY_CREDITS', '10');
        const { MAX_DAILY_CREDITS: cap } = await import('@/lib/config');
        expect(cap).toBe(10);
    });

    it('ignores non-integer or non-positive env values', async () => {
        for (const bad of ['0', '-3', 'abc', '1.5']) {
            vi.stubEnv('MAX_DAILY_CREDITS', bad);
            const { MAX_DAILY_CREDITS: cap } = await import('@/lib/config');
            expect(cap).toBe(5);
            vi.unstubAllEnvs();
        }
    });
});

describe('MemberSchema', () => {
    const validMember = {
        full_name: 'Aman Mishra',
        mobile: '9876543210',
        membership_type: '1 Month',
        height_cm: 175,
        weight_kg: 70,
    };

    it('accepts a valid member payload', () => {
        expect(MemberSchema.safeParse(validMember).success).toBe(true);
    });

    it('rejects an unknown membership plan', () => {
        const bad = { ...validMember, membership_type: 'Lifetime' };
        expect(MemberSchema.safeParse(bad).success).toBe(false);
    });

    it('rejects a member without a name', () => {
        const bad = { ...validMember, full_name: '' };
        expect(MemberSchema.safeParse(bad).success).toBe(false);
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
                full_name: 'Aman Mishra',
                date_of_birth: '2000-01-01',
                height_cm: 180,
                weight_kg: 80,
                gender: 'Male',
                photo_url: 'https://example.com/avatar.png'
            };
            const result = ProfileUpdateSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should reject a blank full name', () => {
            const result = ProfileUpdateSchema.safeParse({ full_name: '' });
            expect(result.success).toBe(false);
        });

        it('should reject an invalid photo URL', () => {
            const result = ProfileUpdateSchema.safeParse({ photo_url: 'not-a-url' });
            expect(result.success).toBe(false);
        });
    });
});
