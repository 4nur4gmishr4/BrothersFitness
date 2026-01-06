import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];

        // Simple token validation - check if it looks like a bcrypt hash
        if (token && token.startsWith('$2')) {
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
