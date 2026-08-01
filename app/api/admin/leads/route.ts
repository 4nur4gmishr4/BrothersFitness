import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';

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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

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
            console.warn('Failed to log lead deletion:', logError);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}
