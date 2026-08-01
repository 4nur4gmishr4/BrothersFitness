// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase-js BEFORE importing the lib modules so createClient resolves
// locally. Both libs share one module mock because vitest keys mocks by path.
const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
    createClient: mockCreateClient,
}));

// The env keys are read at import time (module top-level), so import the
// modules after env setup below.
let getSupabase: () => unknown;
let getServiceSupabase: () => unknown;

describe('supabase client factories', () => {
    beforeEach(() => {
        vi.resetModules();
        mockCreateClient.mockReset();
        mockCreateClient.mockImplementation((url: string, key: string) => ({ url, key }));
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://proj.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    });

    it('creates the anon client lazily and reuses it', async () => {
        ({ getSupabase } = await import('@/lib/supabase'));
        const first = getSupabase();
        const second = getSupabase();
        expect(first).toBe(second); // singleton
        expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('fails closed when the service-role key is missing', async () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        ({ getServiceSupabase } = await import('@/lib/server-supabase'));
        expect(() => getServiceSupabase()).toThrow(/service-role configuration missing/);
    });

    it('creates the service client with session persistence disabled', async () => {
        ({ getServiceSupabase } = await import('@/lib/server-supabase'));
        getServiceSupabase();
        expect(mockCreateClient).toHaveBeenCalledWith(
            'https://proj.supabase.co',
            'service',
            expect.objectContaining({ auth: { autoRefreshToken: false, persistSession: false } })
        );
    });
});
