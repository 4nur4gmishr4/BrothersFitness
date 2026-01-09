import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { generateAdminToken } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        // Rate limit: 5 login attempts per 15 minutes per IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
        const rateCheck = checkRateLimit(`login_${ip}`, RATE_LIMITS.LOGIN);

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateCheck.resetIn} seconds.` },
                { status: 429 }
            );
        }

        const body = await req.json();

        // Validate with Zod
        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid request' },
                { status: 400 }
            );
        }

        const { password } = parsed.data;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Ensure ADMIN_PASSWORD is set
        if (!adminPassword) {
            logger.error('ADMIN_PASSWORD environment variable is not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Timing-safe password comparison to prevent timing attacks
        const passwordBuffer = Buffer.from(password);
        const adminPasswordBuffer = Buffer.from(adminPassword);

        // Lengths must match for timingSafeEqual, so we pad/compare safely
        let isValid = false;
        if (passwordBuffer.length === adminPasswordBuffer.length) {
            isValid = timingSafeEqual(passwordBuffer, adminPasswordBuffer);
        } else {
            // Perform a dummy comparison to maintain constant time
            timingSafeEqual(adminPasswordBuffer, adminPasswordBuffer);
            isValid = false;
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate a stateless session token
        const token = generateAdminToken();

        return NextResponse.json({
            success: true,
            token,
            message: 'Welcome, Aman!'
        });
    } catch (error) {
        logger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown' });
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
