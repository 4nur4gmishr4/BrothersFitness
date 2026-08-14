import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';
import { MemberSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';

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
        logger.warn('Activity log failed', { error: err instanceof Error ? err.message : 'Unknown' });
    }
}

// Pagination defaults — keep pages small so a growing member table never
// ships the whole dataset to the admin grid in one payload.
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Escape PostgREST `or()` filter metacharacters so a search string
// containing commas, %, or _ doesn't splice extra predicates or act as
// a wildcard. Admin-gated route, but defensive.
function escapeOrFilter(term: string): string {
    return term.replace(/[,_%]/g, '\\$&');
}

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
            const term = `%${escapeOrFilter(search)}%`;
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
        logger.error('Error fetching members', { error: error instanceof Error ? error.message : 'Unknown' });
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

        // Log the creation (best-effort)
        try {
            await logActivity('CREATE', data.id, data.full_name, {
                membership_type: data.membership_type,
                mobile: data.mobile
            });
        } catch (logError) {
            logger.warn('Failed to log member creation activity', { error: logError instanceof Error ? logError.message : 'Unknown' });
        }

        // Generate WhatsApp welcome message URL
        const welcomeMessage = encodeURIComponent(
            `🏋️ Welcome to Brother's Fitness, ${data.full_name}! 🎉\n\n` +
            `Your ${data.membership_type} membership is now ACTIVE! 💪\n\n` +
            `📅 Start: ${data.membership_start}\n` +
            `📅 End: ${data.membership_end}\n\n` +
            `Let's crush those goals together! 🔥\n\n` +
            `- Team Brothers Fitness`
        );
        // L47: avoid `91` + `91xxx` = `9191xxx` — use the same country-code
        // dedup pattern applied in LeadsInbox (M29).
        const whatsappUrl = data.mobile ? (() => {
            const digits = data.mobile.replace(/\D/g, '');
            const number = digits.startsWith('91') ? digits : `91${digits}`;
            return `https://wa.me/${number}?text=${welcomeMessage}`;
        })() : null;

        return NextResponse.json({
            member: data,
            welcomeWhatsApp: whatsappUrl
        });
    } catch (error) {
        logger.error('Error creating member', { error: error instanceof Error ? error.message : 'Unknown' });
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
        const { searchParams } = new URL(req.url, 'http://localhost');
        let id = searchParams.get('id');

        if (!id) {
            try {
                const body = await req.json();
                id = body?.id || null;
            } catch {
                // Not JSON or empty body
            }
        }

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        // First, get the member to retrieve photo_url and name for logging
        const { data: member, error: fetchError } = await getServiceSupabase()
            .from('gym_members')
            .select('photo_url, full_name, mobile')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        // Return 404 instead of reporting success for a non-existent member.
        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            );
        }

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
                logger.warn('Failed to delete photo from storage', { error: storageError instanceof Error ? storageError.message : 'Unknown' });
                // Continue with member deletion even if photo deletion fails
            }
        }

        // Now delete the member record
        const { error } = await getServiceSupabase()
            .from('gym_members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log the deletion (best-effort)
        try {
            await logActivity('DELETE', id, member?.full_name || null, {
                mobile: member?.mobile
            });
        } catch (logError) {
            logger.warn('Failed to log member deletion activity', { error: logError instanceof Error ? logError.message : 'Unknown' });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error deleting member', { error: error instanceof Error ? error.message : 'Unknown' });
        return NextResponse.json(
            { error: 'Failed to delete member' },
            { status: 500 }
        );
    }
}

// PUT update member (supports partial updates)
export async function PUT(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    const PartialMemberSchema = MemberSchema.partial();

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        const hasFields = Object.keys(updateData).length > 0;
        if (!hasFields) {
            return NextResponse.json(
                { error: 'No fields provided for update' },
                { status: 400 }
            );
        }

        const parsed = PartialMemberSchema.safeParse(updateData);
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
        logger.error('Error updating member', { error: error instanceof Error ? error.message : 'Unknown' });
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        );
    }
}
