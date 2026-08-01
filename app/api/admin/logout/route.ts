import { NextResponse } from 'next/server';
import { revokeAdminToken, extractBearerToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getRequestId, withRequestId } from '@/lib/request-id';

// Revokes the presented token's nonce so it can no longer authenticate,
// even within its 24h expiry window. Blacklist is shared via Redis when
// configured (see lib/auth.ts), so revocation holds across all instances.
export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        const token = extractBearerToken(req.headers.get('Authorization'));
        if (!token) {
            return withRequestId(NextResponse.json({ success: true }), requestId);
        }

        await revokeAdminToken(token);
        return withRequestId(NextResponse.json({ success: true }), requestId);
    } catch (error) {
        log.error('Logout error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(NextResponse.json({ success: true }, { status: 200 }), requestId);
    }
}
