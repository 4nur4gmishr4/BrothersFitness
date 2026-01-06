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

// DELETE member
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
