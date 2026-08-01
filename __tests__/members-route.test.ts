// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/members/route';

// Mock the service client and admin guard so the tests exercise only the
// pagination/search logic, not Supabase or token verification.
const { mockChain, mockData, mockResolve } = vi.hoisted(() => {
    // The query builder is awaited at the end of the chain, so the chain object
    // is a thenable that resolves to whatever test set via setMockResult().
    let resolveValue: Promise<unknown> = Promise.resolve({ data: [], error: null, count: 0 });
    const setResult = (v: unknown) => { resolveValue = Promise.resolve(v); };
    const thenable = {
        or: vi.fn(() => thenable),
        order: vi.fn(() => thenable),
        range: vi.fn(() => thenable),
        then<TResult = unknown, TNever = never>(
            resolve: (v: unknown) => TResult | PromiseLike<TResult>,
            _reject?: (reason?: unknown) => TNever
        ): Promise<TResult | TNever> {
            return Promise.resolve(resolveValue).then(resolve, _reject);
        },
    };
    const select = vi.fn(() => thenable);
    const from = vi.fn(() => ({ select }));
    return {
        mockChain: thenable,
        mockData: { from, select },
        mockResolve: { setResult },
    };
});

vi.mock('@/lib/admin-auth', () => ({
    requireAdminToken: vi.fn(async () => 'test-token'),
}));

vi.mock('@/lib/server-supabase', () => ({
    getServiceSupabase: vi.fn(() => mockData),
}));

async function json(res: NextResponse) {
    return { status: res.status, body: await res.json() };
}

describe('GET /api/admin/members', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResolve.setResult({ data: [], error: null, count: 0 });
    });

    const rows = [{ id: '1', full_name: 'A' }, { id: '2', full_name: 'B' }];

    it('returns all members when no pagination params are given (backward-compatible)', async () => {
        mockResolve.setResult({ data: rows, error: null, count: null });
        const res = await GET(new Request('http://localhost/api/admin/members'));
        const { body } = await json(res);
        expect(res.status).toBe(200);
        expect(body.members).toHaveLength(2);
        expect(body.total).toBeUndefined(); // no pagination metadata
        expect(mockChain.range).not.toHaveBeenCalled();
    });

    it('applies server-side search and returns exact count', async () => {
        mockResolve.setResult({ data: rows, error: null, count: 2 });
        const res = await GET(new Request('http://localhost/api/admin/members?search=ram'));
        const { body } = await json(res);
        expect(res.status).toBe(200);
        expect(mockChain.or).toHaveBeenCalledWith('full_name.ilike.%ram%,mobile.ilike.%ram%');
        expect(body.total).toBe(2);
        expect(body.page).toBe(1);
        expect(body.pageSize).toBe(50);
    });

    it('slices to the requested page via range', async () => {
        const res = await GET(new Request('http://localhost/api/admin/members?page=3&pageSize=10'));
        await json(res);
        expect(mockChain.range).toHaveBeenCalledWith(20, 29);
    });

    it('clamps page/pageSize to safe bounds', async () => {
        const res = await GET(new Request('http://localhost/api/admin/members?page=-5&pageSize=99999'));
        await json(res);
        expect(mockChain.range).toHaveBeenCalledWith(0, 199); // page→1, pageSize→200 max
    });

    it('sorts newest first by default and honors the sort param', async () => {
        await json(await GET(new Request('http://localhost/api/admin/members')));
        expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });

        mockChain.order.mockClear();
        await json(await GET(new Request('http://localhost/api/admin/members?sortBy=oldest')));
        expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('returns 500 when the query fails', async () => {
        mockResolve.setResult({ data: null, error: new Error('db down') });
        const res = await GET(new Request('http://localhost/api/admin/members'));
        expect(res.status).toBe(500);
    });
});
