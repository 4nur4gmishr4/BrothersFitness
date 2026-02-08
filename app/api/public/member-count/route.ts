import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { count, error } = await supabase
            .from('gym_members')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // Return real count
        const displayCount = count || 0;

        return NextResponse.json({ count: displayCount });
    } catch (error) {
        console.error('Error fetching member count:', error);
        return NextResponse.json({ count: 0 });
    }
}
