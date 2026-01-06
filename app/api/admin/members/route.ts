import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all members
export async function GET() {
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
    try {
        const body = await req.json();

        const { data, error } = await supabase
            .from('gym_members')
            .insert([body])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ member: data });
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
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Member ID required' },
                { status: 400 }
            );
        }

        // First, get the member to retrieve photo_url
        const { data: member } = await supabase
            .from('gym_members')
            .select('photo_url')
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

        return NextResponse.json({ member: data });
    } catch (error) {
        console.error('Error updating member:', error);
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        );
    }
}
