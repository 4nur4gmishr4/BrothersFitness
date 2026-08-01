import { NextResponse } from 'next/server';

// Never cache the response — uptime monitors must hit a live probe.
export const dynamic = 'force-dynamic';

/**
 * Liveness probe for uptime monitoring / load balancers.
 * Deliberately touches no external services so a non-200 here means the
 * process itself is unhealthy, not a flaky upstream dependency.
 */
export function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'brother-fitness-api',
        timestamp: new Date().toISOString(),
        uptimeSec: Math.round(process.uptime()),
    });
}
