import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';
import { MemberSchema } from '@/lib/validation';

// All admin routes use the service-role client (bypasses RLS) because the
// admin tables have no anon/authenticated grants. The HMAC token in
// `Authorization` is the only gate — enforced by requireAdminToken().

// Helper to log admin activity (fails silently if table doesn't exist)
async function logActivity(
    actionType: 'CREATE' | 'UPDATE' | 'DELETE',
    memberId: string | null,
    memberName: string | null,
    details?: Record<string, unknown>
) {
    try {
        await getServiceSupabase().from('admin_activity_logs').insert([{
            action_type: actionType,
            member_id: memberId,
            member_name: memberName,
            details: details || null
        }]);
    } catch (err) {
        // Silently fail - logging shouldn't block operations
        console.warn('Activity log failed:', err);
    }
}

// Pagination defaults — keep pages small so a growing member table never
// ships the whole dataset to the admin grid in one payload.
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
    if (value === null || value.trim() === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
}

// GET members. Supports server-side search + pagination for the admin grid.
// With no query params this returns every member (backward-compatible with the
// stats/analytics that need the full list).
export async function GET(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim() || '';
        const page = clampInt(searchParams.get('page'), 1, 1, Number.MAX_SAFE_INTEGER);
        const pageSize = clampInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
        const sortBy = searchParams.get('sortBy') || 'newest';

        const paginate = searchParams.has('page') || searchParams.has('pageSize');
        const isSearch = search.length > 0;

        // Only talk to the DB for the requested page; total reflects the filter
        // so the client can render page controls without a second round-trip.
        let query = getServiceSupabase()
            .from('gym_members')
            .select('*', { count: isSearch || paginate ? 'exact' : undefined });

        if (isSearch) {
            const term = `%${search}%`;
            // Fuzzy-ish ILIKE across name + mobile; the leading % keeps the
            // match working from anywhere in the field.
            query = query.or(`full_name.ilike.${term},mobile.ilike.${term}`);
        }

        switch (sortBy) {
            case 'oldest':
                query = query.order('created_at', { ascending: true });
                break;
            case 'a-z':
                query = query.order('full_name', { ascending: true });
                break;
            case 'z-a':
                query = query.order('full_name', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        if (paginate) {
            const from = (page - 1) * pageSize;
            query = query.range(from, from + pageSize - 1);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            members: data,
            ...(paginate || isSearch ? { total: count ?? data.length, page, pageSize } : {}),
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        );
    }
}

// POST new member
export async function POST(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();

        // Validate every field, and constrain membership_type to known plans
        // so it stays a safe PLAN_PRICES lookup key (a typo used to yield ₹0).
        const parsed = MemberSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid member data' },
                { status: 400 }
            );
        }

        const { data, error } = await getServiceSupabase()
            .from('gym_members')
            .insert([parsed.data])
            .select()
            .single();

        if (error) throw error;

        // Log the creation
        await logActivity('CREATE', data.id, data.full_name, {
            membership_type: data.membership_type,
            mobile: data.mobile
        });

        // Generate WhatsApp welcome message URL
        const welcomeMessage = encodeURIComponent(
            `🏋️ Welcome to Brother's Fitness, ${data.full_name}! 🎉\n\n` +
            `Your ${data.membership_type} membership is now ACTIVE! 💪\n\n` +
            `📅 Start: ${data.membership_start}\n` +
            `📅 End: ${data.membership_end}\n\n` +
            `Let's crush those goals together! 🔥\n\n` +
            `- Team BroFit`
        );
        const whatsappUrl = data.mobile ?
            `https://wa.me/91${data.mobile.replace(/\D/g, '')}?text=${welcomeMessage}` : null;

        return NextResponse.json({
            member: data,
            welcomeWhatsApp: whatsappUrl
        });
    } catch (error) {
        console.error('Error creating member:', error);
        return NextResponse.json(
            { error: 'Failed to create member' },
            { status: 500 }
        );
    }
}

// DELETE member (also removes photo from storage)
export async function DELETE(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        // First, get the member to retrieve photo_url and name for logging
        const { data: member } = await getServiceSupabase()
            .from('gym_members')
            .select('photo_url, full_name, mobile')
            .eq('id', id)
            .single();

        // If member has a photo, delete it from storage
        if (member?.photo_url) {
            try {
                // Extract filename from URL (e.g., "https://...supabase.co/storage/v1/object/public/member-photos/filename.jpg")
                const urlParts = member.photo_url.split('/');
                const filename = urlParts[urlParts.length - 1];
                if (filename) {
                    await getServiceSupabase().storage.from('member-photos').remove([filename]);
                }
            } catch (storageError) {
                console.warn('Failed to delete photo from storage:', storageError);
                // Continue with member deletion even if photo deletion fails
            }
        }

        // Now delete the member record
        const { error } = await getServiceSupabase()
            .from('gym_members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log the deletion
        await logActivity('DELETE', id, member?.full_name || null, {
            mobile: member?.mobile
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting member:', error);
        return NextResponse.json(
            { error: 'Failed to delete member' },
            { status: 500 }
        );
    }
}

// PUT update member
export async function PUT(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        const parsed = MemberSchema.safeParse(updateData);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid member data' },
                { status: 400 }
            );
        }

        const { data, error } = await getServiceSupabase()
            .from('gym_members')
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log the update
        await logActivity('UPDATE', id, data.full_name, {
            updated_fields: Object.keys(parsed.data)
        });

        return NextResponse.json({ member: data });
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        );
    }
}
