import { NextResponse } from 'next/server';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getRequestId, withRequestId } from '@/lib/request-id';

export async function GET(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractBearerToken(authHeader);

        if (!token) {
            return withRequestId(
                NextResponse.json(
                    { error: 'No token provided' },
                    { status: 401 }
                ),
                requestId
            );
        }

        // Verify against stored tokens
        if (await verifyAdminToken(token)) {
            return withRequestId(
                NextResponse.json({
                    valid: true,
                    message: 'Session valid'
                }),
                requestId
            );
        }

        return withRequestId(
            NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            ),
            requestId
        );
    } catch (error) {
        log.error('Verify error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(
            NextResponse.json(
                { error: 'Verification failed' },
                { status: 500 }
            ),
            requestId
        );
    }
}
