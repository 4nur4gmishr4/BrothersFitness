
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const token = extractBearerToken(req.headers.get('Authorization'));
        if (!token || !verifyAdminToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ leads: [] });
            }
            throw error;
        }

        return NextResponse.json({ leads: data });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const token = extractBearerToken(req.headers.get('Authorization'));
        if (!token || !verifyAdminToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('contact_submissions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}
