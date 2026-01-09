import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

export async function POST(req: Request) {
    // Auth guard
    const token = extractBearerToken(req.headers.get('Authorization'));
    if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const memberId = formData.get('memberId') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${memberId || Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('member-photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('member-photos')
            .getPublicUrl(data.path);

        return NextResponse.json({
            url: urlData.publicUrl,
            path: data.path
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
}
