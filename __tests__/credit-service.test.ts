// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
    istToday,
    verifyUserToken,
    getUserCreditState,
    spendUserCredit,
} from '@/lib/credit-service';
import { MAX_DAILY_CREDITS } from '@/lib/config';

// Hoisted so the mocked server-supabase factory can share this test double.
// The from() chain returns stable mocks so .single's resolved value set in a
// test is seen by the code under test (a fresh chain per call would reset it).
const { mockSupabase, mockSingle } = vi.hoisted(() => {
    const single = vi.fn();
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    return {
        mockSupabase: {
            auth: { getUser: vi.fn() },
            from: vi.fn(() => ({ select })),
            rpc: vi.fn(),
        },
        mockSingle: single,
    };
});

// The service functions type their client param as SupabaseClient; the test
// double is a partial stand-in, so widen it at the point of use.
const mockClient = mockSupabase as unknown as SupabaseClient;

// The service client is created in lib/server-supabase.ts; mock the module so
// tests can drive getUser/RPC behavior without a live Supabase connection.
vi.mock('@/lib/server-supabase', () => ({
    getServiceSupabase: vi.fn(() => mockSupabase),
}));

async function jsonResponse(res: NextResponse) {
    return { status: res.status, body: await res.json() };
}

function requestWithAuth(token: string | null): Request {
    return new Request('http://localhost/api/test', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
}

describe('credit-service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('istToday', () => {
        it('returns a YYYY-MM-DD date', () => {
            expect(istToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('verifyUserToken', () => {
        it('rejects a request without a bearer token', async () => {
            const res = await verifyUserToken(requestWithAuth(null));
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(401);
        });

        it('rejects a token that Supabase cannot verify', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad') });
            const res = await verifyUserToken(requestWithAuth('garbage'));
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(401);
        });

        it('returns the verified user id', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-123' } }, error: null });
            const result = await verifyUserToken(requestWithAuth('good-token'));
            expect(result).not.toBeInstanceOf(NextResponse);
            const ok = result as { supabase: unknown; userId: string };
            expect(ok.userId).toBe('u-123');
            expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('good-token');
        });
    });

    describe('getUserCreditState', () => {
        const row = (daily_credits: number, last_credit_reset: string) => ({
            data: { daily_credits, last_credit_reset },
            error: null,
        });

        it('returns 403 when the profile row is missing', async () => {
            mockSingle.mockResolvedValue({ data: null, error: new Error('nope') });
            const res = await getUserCreditState(mockClient, 'u-1');
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(403);
        });

        it('returns the stored credits when already reset today', async () => {
            mockSingle.mockResolvedValue(row(3, istToday()));
            const result = await getUserCreditState(mockClient, 'u-1');
            const ok = result as { credits: number };
            expect(ok.credits).toBe(3);
        });

        it('resets to the daily cap when last reset was a previous day', async () => {
            mockSingle.mockResolvedValue(row(0, '2000-01-01'));
            const result = await getUserCreditState(mockClient, 'u-1');
            const ok = result as { credits: number };
            expect(ok.credits).toBe(MAX_DAILY_CREDITS);
        });

        it('returns 429 when the user is out of credits', async () => {
            mockSingle.mockResolvedValue(row(0, istToday()));
            const res = await getUserCreditState(mockClient, 'u-1');
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(429);
        });
    });

    describe('spendUserCredit', () => {
        it('returns 500 when the RPC errors', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('db down') });
            const res = await spendUserCredit(mockClient, 'u-1');
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(500);
        });

        it('returns 429 when the RPC reports zero remaining', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: 0, error: null });
            const res = await spendUserCredit(mockClient, 'u-1');
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(429);
        });

        it('returns the remaining count after a successful spend', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: 2, error: null });
            const result = await spendUserCredit(mockClient, 'u-1');
            const ok = result as { remaining: number };
            expect(ok.remaining).toBe(2);
            expect(mockSupabase.rpc).toHaveBeenCalledWith('spend_user_credit', { p_uid: 'u-1', p_max: MAX_DAILY_CREDITS });
        });

        it('reconciles a transient RPC error as a success when the spend committed', async () => {
            // RPC response lost to a network blip, but the row shows today's reset —
            // the RPC committed, so report success instead of retrying (no double-spend).
            mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('fetch failed') });
            mockSingle.mockResolvedValue({
                data: { daily_credits: 4, last_credit_reset: istToday() },
                error: null,
            });
            const result = await spendUserCredit(mockClient, 'u-1');
            const ok = result as { remaining: number };
            expect(ok.remaining).toBe(4);
        });

        it('surfaces an error when the RPC failed and nothing was spent', async () => {
            mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error('fetch failed') });
            mockSingle.mockResolvedValue({
                data: { daily_credits: 5, last_credit_reset: '2000-01-01' },
                error: null,
            });
            const res = await spendUserCredit(mockClient, 'u-1');
            expect(res).toBeInstanceOf(NextResponse);
            expect((await jsonResponse(res as NextResponse)).status).toBe(500);
        });
    });
});
