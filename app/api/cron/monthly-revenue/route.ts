import { NextResponse } from 'next/server';
import { supabase, type GymMember } from '@/lib/supabase';
import { getPlanPrice } from '@/lib/pricing-config';
import { logger } from '@/lib/logger';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthStr = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Fetch all members
        const { data: rawMembers, error } = await supabase
            .from('gym_members')
            .select('*');

        if (error) throw error;

        const members = rawMembers as GymMember[];

        // Calculate last month's stats
        const lastMonthMembers = (members || []).filter((m: GymMember) => {
            if (!m.membership_start) return false;
            const start = new Date(m.membership_start);
            return start >= lastMonth && start <= lastMonthEnd;
        });

        // Revenue calculation
        const revenue = lastMonthMembers.reduce((sum: number, m: GymMember) => {
            return sum + getPlanPrice(m.membership_type);
        }, 0);

        // Plan breakdown
        const planBreakdown: Record<string, number> = {};
        lastMonthMembers.forEach((m: GymMember) => {
            const plan = m.membership_type || 'Monthly';
            planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
        });

        // Active members count
        const activeMembers = (members || []).filter((m: GymMember) => {
            if (!m.membership_end) return true;
            return new Date(m.membership_end) >= now;
        }).length;

        // Build report
        const report = {
            period: lastMonthStr,
            generatedAt: now.toISOString(),
            summary: {
                newMembers: lastMonthMembers.length,
                totalRevenue: revenue,
                activeMembers,
                totalMembers: members?.length || 0
            },
            planBreakdown,
            topPlans: Object.entries(planBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, count]) => ({ plan, count }))
        };

        // Log report
        logger.info(`Monthly Report for ${lastMonthStr}`, { report });

        // Send to Discord/Telegram if webhook configured
        if (process.env.DISCORD_WEBHOOK_URL) {
            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `📊 **Monthly Revenue Report - ${lastMonthStr}**\n\n` +
                        `💰 Revenue: ₹${revenue.toLocaleString()}\n` +
                        `👥 New Members: ${lastMonthMembers.length}\n` +
                        `✅ Active Members: ${activeMembers}\n` +
                        `📋 Total Members: ${members?.length || 0}\n\n` +
                        `**Plan Breakdown:**\n` +
                        Object.entries(planBreakdown).map(([plan, count]) => `• ${plan}: ${count}`).join('\n')
                })
            });
        }

        return NextResponse.json({
            success: true,
            report
        });
    } catch (error) {
        logger.error('CRON Revenue Error', { error: error instanceof Error ? error.message : 'Unknown' });
        return NextResponse.json(
            { error: 'Report generation failed' },
            { status: 500 }
        );
    }
}
