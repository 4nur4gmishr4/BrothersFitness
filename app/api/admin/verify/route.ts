import { NextResponse } from 'next/server';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractBearerToken(authHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        // Verify against stored tokens
        if (verifyAdminToken(token)) {
            return NextResponse.json({
                valid: true,
                message: 'Session valid'
            });
        }

        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
