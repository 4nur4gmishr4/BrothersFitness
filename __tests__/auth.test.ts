// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
    generateAdminToken,
    verifyAdminToken,
    revokeAdminToken,
    clearRevokedTokens,
    extractBearerToken,
} from '@/lib/auth';

// Build a token with the same algorithm the app uses, so expiry/future-issue
// checks can be tested without waiting for real time to pass.
function makeToken(payload: { n: string; iat: number; exp: number }): string {
    const secret = process.env.ADMIN_PASSWORD as string;
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    return `${body}.${sig}`;
}

describe('Admin auth tokens', () => {
    beforeEach(async () => {
        await clearRevokedTokens();
    });

    afterEach(async () => {
        await clearRevokedTokens();
    });

    it('generates a token in <payload>.<signature> format', () => {
        const token = generateAdminToken();
        expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/);
        expect(token.split('.')).toHaveLength(2);
    });

    it('verifies a freshly generated token', async () => {
        const token = generateAdminToken();
        expect(await verifyAdminToken(token)).toBe(true);
    });

    it('rejects a token with a tampered signature', async () => {
        const token = generateAdminToken();
        const [body, sig] = token.split('.');
        const flipped = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
        expect(await verifyAdminToken(`${body}.${flipped}`)).toBe(false);
    });

    it('rejects an expired token', async () => {
        const past = Date.now() - 1000;
        const token = makeToken({ n: 'nonce-1', iat: past, exp: past });
        expect(await verifyAdminToken(token)).toBe(false);
    });

    it('rejects a token issued in the future', async () => {
        const token = makeToken({
            n: 'nonce-2',
            iat: Date.now() + 10 * 60 * 1000,
            exp: Date.now() + 60 * 60 * 1000,
        });
        expect(await verifyAdminToken(token)).toBe(false);
    });

    it('rejects a revoked token', async () => {
        const token = generateAdminToken();
        expect(await verifyAdminToken(token)).toBe(true);
        await revokeAdminToken(token);
        expect(await verifyAdminToken(token)).toBe(false);
    });

    it('rejects garbage input without throwing', async () => {
        expect(await verifyAdminToken('')).toBe(false);
        expect(await verifyAdminToken('no-dot')).toBe(false);
        expect(await verifyAdminToken('a.b')).toBe(false);
    });

    it('extracts a bearer token from the Authorization header', () => {
        expect(extractBearerToken('Bearer abc123')).toBe('abc123');
        expect(extractBearerToken('Basic abc123')).toBe(null);
        expect(extractBearerToken(null)).toBe(null);
    });
});
