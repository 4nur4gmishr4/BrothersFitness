import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getServiceSupabase } from '@/lib/server-supabase';
import type { GymMember } from '@/lib/supabase';
import { getPlanPrice } from '@/lib/config';
import { logger } from '@/lib/logger';
import { retryableQuery } from '@/lib/retry';
import { getRequestId, withRequestId } from '@/lib/request-id';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/** YYYY-MM-DD date-only key in India Standard Time. */
function istDateKey(d: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}


export async function GET(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        // Fail CLOSED when CRON_SECRET is unset, and compare constant-time.
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            log.error('CRON_SECRET environment variable is not set');
            return withRequestId(NextResponse.json({ error: 'Server configuration error' }, { status: 503 }), requestId);
        }
        const authHeader = req.headers.get('authorization') || '';
        const expected = `Bearer ${cronSecret}`;
        const a = Buffer.from(authHeader);
        const b = Buffer.from(expected);
        const valid = a.length === b.length && timingSafeEqual(a, b);
        if (!valid) {
            return withRequestId(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), requestId);
        }

        const now = new Date();
        const todayKey = istDateKey(now);
        const [ty, tm] = todayKey.split('-').map(Number);

        // Previous calendar month as UTC date-only boundaries so the comparison
        // is timezone-independent (a member joining on the last day is included).
        const prevMonthStart = Date.UTC(ty, tm - 1 - 1, 1);
        const prevMonthEnd = Date.UTC(ty, tm - 1, 0);
        const lastMonthStr = new Date(prevMonthStart)
            .toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

        const prevMonthStartStr = new Date(prevMonthStart).toISOString().slice(0, 10);
        const prevMonthEndStr = new Date(prevMonthEnd).toISOString().slice(0, 10);

        const [{ count: totalMembers, error: errTotal }, { count: activeMembers, error: errActive }, { data: rawMembers, error }] = await Promise.all([
            getServiceSupabase().from('gym_members').select('*', { count: 'exact', head: true }),
            getServiceSupabase().from('gym_members').select('*', { count: 'exact', head: true }).gte('membership_end', todayKey),
            retryableQuery(() => getServiceSupabase().from('gym_members')
                .select('membership_type')
                .gte('membership_start', prevMonthStartStr)
                .lte('membership_start', prevMonthEndStr))
        ]);

        if (errTotal) throw errTotal;
        if (errActive) throw errActive;
        if (error) throw error;

        const lastMonthMembers = (rawMembers || []) as Partial<GymMember>[];

        // Revenue calculation
        const revenue = lastMonthMembers.reduce((sum: number, m: Partial<GymMember>) => {
            return sum + getPlanPrice(m.membership_type);
        }, 0);

        // Plan breakdown
        const planBreakdown: Record<string, number> = {};
        lastMonthMembers.forEach((m: Partial<GymMember>) => {
            const plan = m.membership_type || 'Monthly';
            planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
        });

        // Build report
        const report = {
            period: lastMonthStr,
            generatedAt: now.toISOString(),
            summary: {
                newMembers: lastMonthMembers.length,
                totalRevenue: revenue,
                activeMembers: activeMembers || 0,
                totalMembers: totalMembers || 0
            },
            planBreakdown,
            topPlans: Object.entries(planBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, count]) => ({ plan, count }))
        };

        // Log report
        log.info(`Monthly Report for ${lastMonthStr}`, { report });

        return withRequestId(
            NextResponse.json({
                success: true,
                report
            }),
            requestId
        );
    } catch (error) {
        log.error('CRON Revenue Error', { error: error instanceof Error ? error.message : 'Unknown' });
        return withRequestId(
            NextResponse.json(
                { error: 'Report generation failed' },
                { status: 500 }
            ),
            requestId
        );
    }
}
