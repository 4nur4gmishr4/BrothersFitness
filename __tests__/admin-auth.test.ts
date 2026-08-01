// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/auth';
import { requireAdminToken } from '@/lib/admin-auth';

function reqWithHeader(header: string | null): Request {
    return new Request('http://localhost/api/admin/x', {
        headers: header ? { Authorization: header } : {},
    });
}

describe('requireAdminToken', () => {
    it('returns the token when the Authorization header is valid', async () => {
        const token = generateAdminToken();
        const result = await requireAdminToken(reqWithHeader(`Bearer ${token}`));
        expect(result).toBe(token);
    });

    it('returns a 401 response when the header is missing', async () => {
        const res = await requireAdminToken(reqWithHeader(null));
        expect(res).toBeInstanceOf(NextResponse);
        expect((res as NextResponse).status).toBe(401);
    });

    it('returns a 401 response for a tampered token', async () => {
        const token = generateAdminToken();
        const bad = `${token}0`; // altered signature
        const res = await requireAdminToken(reqWithHeader(`Bearer ${bad}`));
        expect(res).toBeInstanceOf(NextResponse);
        expect((res as NextResponse).status).toBe(401);
    });
});
