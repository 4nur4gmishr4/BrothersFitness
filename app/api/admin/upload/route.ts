import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

export async function POST(req: Request) {
    const auth = await requireAdminToken(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const memberId = formData.get('memberId') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate type + size server-side (previously only client checks).
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: 'Only image files (JPEG, PNG, WebP, AVIF, GIF) are allowed' },
                { status: 400 }
            );
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'Image must be 5 MB or smaller' },
                { status: 400 }
            );
        }

        // Never trust the client filename for the storage path — sanitize it so
        // no path traversal / weird extensions reach the bucket.
        const extension = ALLOWED_TYPES.has(file.type)
            ? (file.name.split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            : 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(extension) ? extension : 'jpg';
        const safeId = String(memberId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        const fileName = `${safeId || Date.now()}.${safeExt}`;

        const { data, error } = await getServiceSupabase().storage
            .from('member-photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = getServiceSupabase().storage
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
