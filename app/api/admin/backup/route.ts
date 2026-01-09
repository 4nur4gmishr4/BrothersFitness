import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminToken, extractBearerToken } from '@/lib/auth';

export async function GET(req: Request) {
    // Verify admin auth
    const token = extractBearerToken(req.headers.get('Authorization'));
    if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all members
        const { data: members, error } = await supabase
            .from('gym_members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `backup_${timestamp}.json`;
        const backupData = JSON.stringify({
            exported_at: new Date().toISOString(),
            total_members: members?.length || 0,
            members: members || []
        }, null, 2);

        // Try to upload to Supabase Storage
        let storageUrl = null;
        try {
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('backups')
                .upload(filename, backupData, {
                    contentType: 'application/json',
                    upsert: true
                });

            if (!uploadError && uploadData) {
                const { data: urlData } = supabase
                    .storage
                    .from('backups')
                    .getPublicUrl(filename);
                storageUrl = urlData.publicUrl;
            }
        } catch (storageError) {
            console.warn('Storage upload failed (bucket may not exist):', storageError);
        }

        return NextResponse.json({
            success: true,
            filename,
            total_members: members?.length || 0,
            storage_url: storageUrl,
            // Also return the data directly for download
            data: JSON.parse(backupData)
        });
    } catch (error: unknown) {
        console.error('Backup error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create backup',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
