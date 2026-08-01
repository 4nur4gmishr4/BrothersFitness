// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { getRequestId, withRequestId, REQUEST_ID_HEADER } from '@/lib/request-id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('request-id', () => {
    it('mints a fresh UUID when no header is present', () => {
        const req = new Request('http://localhost/test');
        expect(getRequestId(req)).toMatch(UUID_RE);
    });

    it('honors a valid client-supplied id', () => {
        const req = new Request('http://localhost/test', { headers: { 'x-request-id': 'abc12345' } });
        expect(getRequestId(req)).toBe('abc12345');
    });

    it('ignores forged or malformed header values', () => {
        for (const bad of ['<script>', 'short', 'has spaces', 'x'.repeat(100)]) {
            const req = new Request('http://localhost/test', { headers: { 'x-request-id': bad } });
            expect(getRequestId(req)).toMatch(UUID_RE);
        }
    });

    it('attaches the request id header to a response', () => {
        const res = NextResponse.json({ ok: true });
        const out = withRequestId(res, 'req-456');
        expect(out.headers.get(REQUEST_ID_HEADER)).toBe('req-456');
    });
});
