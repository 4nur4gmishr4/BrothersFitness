import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

// POST (not GET) so a crawled/CSRF'd GET can't trigger a data dump side-effect.
export async function POST(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        // Fetch all members
        const { data: members, error } = await getServiceSupabase()
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

        // Try to upload to Supabase Storage (fails gracefully if the bucket
        // is not public / missing — the response data is the download source).
        let storageUrl = null;
        try {
            const { data: uploadData, error: uploadError } = await getServiceSupabase()
                .storage
                .from('backups')
                .upload(filename, backupData, {
                    contentType: 'application/json',
                    upsert: true
                });

            if (!uploadError && uploadData) {
                const { data: urlData } = getServiceSupabase()
                    .storage
                    .from('backups')
                    .getPublicUrl(filename);
                storageUrl = urlData.publicUrl;
            } else if (uploadError) {
                logger.warn('Storage upload error', { error: uploadError.message });
            }
        } catch (storageError) {
            logger.warn('Storage upload failed (bucket may not exist)', { error: storageError instanceof Error ? storageError.message : 'Unknown' });
        }

        // Audit the backup
        try {
            await getServiceSupabase().from('admin_activity_logs').insert([{
                action_type: 'BACKUP',
                member_id: null,
                member_name: 'admin',
                details: { filename, total_members: members?.length || 0 }
            }]);
        } catch (logError) {
            logger.warn('Failed to log backup', { error: logError instanceof Error ? logError.message : 'Unknown' });
        }

        return NextResponse.json({
            success: true,
            filename,
            total_members: members?.length || 0,
            storage_url: storageUrl
        });
    } catch (error: unknown) {
        logger.error('Backup error', { error: error instanceof Error ? error.message : 'Unknown' });
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}
