import { NextResponse } from 'next/server';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

/**
 * Shared auth guard for /api/admin/* routes (used by 6 routes that previously
 * each re-implemented the same check). Returns the verified token string on
 * success, or a 401 NextResponse to return to the caller.
 *
 * Async because token verification consults the shared revocation set in
 * Redis (see lib/auth.ts); route handlers are already async so this is a
 * one-line `await`.
 */
export async function requireAdminToken(req: Request): Promise<string | NextResponse> {
    const token = extractBearerToken(req.headers.get('Authorization'));
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return token;
}
