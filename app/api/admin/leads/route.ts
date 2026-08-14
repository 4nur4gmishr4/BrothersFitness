import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { data, error } = await getServiceSupabase()
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
    } catch {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(req.url, 'http://localhost');
        const id = searchParams.get('id');

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!id || !uuidRegex.test(id)) return NextResponse.json({ error: 'Valid UUID required' }, { status: 400 });

        // Fetch the lead first so we can log what was deleted
        const { data: lead } = await getServiceSupabase()
            .from('contact_submissions')
            .select('name, email')
            .eq('id', id)
            .single();

        const { error } = await getServiceSupabase()
            .from('contact_submissions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Audit the deletion (best-effort)
        try {
            await getServiceSupabase().from('admin_activity_logs').insert([{
                action_type: 'LEAD_DELETE',
                member_id: null,
                member_name: lead?.name || null,
                details: { email: lead?.email || null }
            }]);
        } catch (logError) {
            logger.warn('Failed to log lead deletion', { error: logError instanceof Error ? logError.message : 'Unknown' });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}
