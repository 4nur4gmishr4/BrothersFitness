import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { count, error } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // If no members exist, return 85 as a starting point
        const memberCount = count || 85;

        return NextResponse.json({ count: memberCount });
    } catch (error) {
        console.error('Error fetching member count:', error);
        // Return 85 as fallback on error
        return NextResponse.json({ count: 85 });
    }
}
