import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Hardcoded admin password - in production, use environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BroFit@Admin2024';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Password required' },
                { status: 400 }
            );
        }

        // Check if password matches (using direct comparison for simplicity)
        // In production, you would compare hashed passwords
        const isValid = password === ADMIN_PASSWORD;

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate a simple session token
        const token = await bcrypt.hash(`${Date.now()}-admin-session`, 10);

        return NextResponse.json({
            success: true,
            token,
            message: 'Welcome, Aman!'
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
