import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeAdminToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getRequestId, withRequestId } from '@/lib/request-id';

// Revokes the presented token's nonce so it can no longer authenticate,
// even within its 24h expiry window. Blacklist is shared via Redis when
// configured (see lib/auth.ts), so revocation holds across all instances.
export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        const res = NextResponse.json({ success: true });
        res.cookies.delete('admin_token');

        if (!token) {
            return withRequestId(res, requestId);
        }

        await revokeAdminToken(token);
        return withRequestId(res, requestId);
    } catch (error) {
        log.error('Logout error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(NextResponse.json({ error: 'Failed to logout' }, { status: 500 }), requestId);
    }
}
