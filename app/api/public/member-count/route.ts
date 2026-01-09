import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { count, error } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // Inflate count by 85 as per user request
        const realCount = count || 0;
        const displayCount = realCount + 85;

        return NextResponse.json({ count: displayCount });
    } catch (error) {
        console.error('Error fetching member count:', error);
        // Return 85 + 0 as fallback
        return NextResponse.json({ count: 85 });
    }
}
