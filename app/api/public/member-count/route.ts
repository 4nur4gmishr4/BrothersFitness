import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';

// H2 fix: force dynamic so the member count reflects live data
// instead of being frozen at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { count, error } = await getServiceSupabase()
            .from('gym_members')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // Return real count
        const displayCount = count || 0;

        return NextResponse.json({ count: displayCount });
    } catch (error) {
        console.error('Error fetching member count:', error);
        // L37: return 503 instead of masking the outage as count:0.
        return NextResponse.json({ error: 'Could not load member count' }, { status: 503 });
    }
}
