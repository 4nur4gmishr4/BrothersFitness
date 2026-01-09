
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Verify auth
        const token = extractBearerToken(req.headers.get('Authorization'));
        if (!token || !verifyAdminToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch logs
        const { data, error } = await supabase
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
