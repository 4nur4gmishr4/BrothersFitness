import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        // Fetch logs
        const { data, error } = await getServiceSupabase()
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            // If table doesn't exist, return empty array instead of crashing
            if (error.code === '42P01') {
                return NextResponse.json({ logs: [] });
            }
            throw error;
        }

        return NextResponse.json({ logs: data });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
