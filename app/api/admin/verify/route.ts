import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getRequestId, withRequestId } from '@/lib/request-id';

export async function GET(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        const authHeader = req.headers.get('Authorization');
        let token: string | null | undefined = extractBearerToken(authHeader);

        if (!token) {
            try {
                const cookieStore = await cookies();
                token = cookieStore.get('admin_token')?.value;
            } catch {
                // Cookie access fallback
            }
        }

        if (!token) {
            return withRequestId(
                NextResponse.json(
                    { valid: false, message: 'No token provided' },
                    { status: 200 }
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
                { valid: false, message: 'Invalid token' },
                { status: 200 }
            ),
            requestId
        );
    } catch (error) {
        log.error('Verify error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(
            NextResponse.json(
                { valid: false, error: 'Verification failed' },
                { status: 500 }
            ),
            requestId
        );
    }
}

