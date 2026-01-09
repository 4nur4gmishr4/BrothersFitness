import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

// Helper to check auth
function checkAuth(req: Request): NextResponse | null {
    const token = extractBearerToken(req.headers.get('Authorization'));
    if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

// Helper to log admin activity (fails silently if table doesn't exist)
async function logActivity(
    actionType: 'CREATE' | 'UPDATE' | 'DELETE',
    memberId: string | null,
    memberName: string | null,
    details?: Record<string, unknown>
) {
    try {
        await supabase.from('admin_activity_logs').insert([{
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

// GET all members
export async function GET(req: Request) {
    const authError = checkAuth(req);
    if (authError) return authError;

    try {
        const { data, error } = await supabase
            .from('gym_members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ members: data });
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
    const authError = checkAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();

        const { data, error } = await supabase
            .from('gym_members')
            .insert([body])
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
    const authError = checkAuth(req);
    if (authError) return authError;

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
        const { data: member } = await supabase
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
                    await supabase.storage.from('member-photos').remove([filename]);
                }
            } catch (storageError) {
                console.warn('Failed to delete photo from storage:', storageError);
                // Continue with member deletion even if photo deletion fails
            }
        }

        // Now delete the member record
        const { error } = await supabase
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
    const authError = checkAuth(req);
    if (authError) return authError;

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('gym_members')
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log the update
        await logActivity('UPDATE', id, data.full_name, {
            updated_fields: Object.keys(updateData)
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
