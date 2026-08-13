import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { generateAdminToken } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validation';
import { getServiceSupabase } from '@/lib/server-supabase';
import { logger } from '@/lib/logger';
import { getRequestId, withRequestId } from '@/lib/request-id';

export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        // Rate limit: 5 login attempts per 15 minutes per IP (trusted IP source)
        const ip = getClientIp(req);
        const rateCheck = await checkRateLimit(`login_${ip}`, RATE_LIMITS.LOGIN);

        if (!rateCheck.allowed) {
            return withRequestId(
                NextResponse.json(
                    { error: `Too many login attempts. Try again in ${rateCheck.resetIn} seconds.`, resetIn: rateCheck.resetIn },
                    { status: 429 }
                ),
                requestId
            );
        }

        const body = await req.json();

        // Validate with Zod
        const parsed = LoginSchema.safeParse(body);
        if (!parsed.success) {
            return withRequestId(
                NextResponse.json(
                    { error: parsed.error.issues[0]?.message || 'Invalid request' },
                    { status: 400 }
                ),
                requestId
            );
        }

        const { password } = parsed.data;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Ensure ADMIN_PASSWORD is set
        if (!adminPassword) {
            log.error('ADMIN_PASSWORD environment variable is not set');
            return withRequestId(
                NextResponse.json(
                    { error: 'Server configuration error' },
                    { status: 500 }
                ),
                requestId
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
            // Audit failed logins (best-effort, never blocks the attempt)
            log.warn('Admin login failed', { ip });
            return withRequestId(
                NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                ),
                requestId
            );
        }

        // Generate a stateless session token
        const token = generateAdminToken();

        // Audit successful login (fails silently if the table doesn't exist yet)
        try {
            await getServiceSupabase().from('admin_activity_logs').insert([{
                action_type: 'LOGIN',
                member_id: null,
                member_name: 'admin',
                details: { ip }
            }]);
        } catch (logError) {
            log.warn('Failed to log admin login', { error: logError instanceof Error ? logError.message : 'Unknown' });
        }

        return withRequestId(
            NextResponse.json({
                success: true,
                token,
                message: 'Welcome back'
            }),
            requestId
        );
    } catch (error) {
        log.error('Login error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(
            NextResponse.json(
                { error: 'Authentication failed' },
                { status: 500 }
            ),
            requestId
        );
    }
}
