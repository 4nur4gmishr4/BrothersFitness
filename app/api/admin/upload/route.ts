import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-supabase';
import { requireAdminToken } from '@/lib/admin-auth';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

// Map a detected magic-byte signature back to a canonical extension. This is
// what we trust — NOT the client-supplied File.type/name, which can claim
// image/jpeg for arbitrary content (M9).
const EXT_FROM_SIGNATURE: Array<{ ext: string; bytes: number[] }> = [
    { ext: 'jpg', bytes: [0xFF, 0xD8, 0xFF] },                                          // JPEG
    { ext: 'png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },           // PNG
    { ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },                                    // GIF8
];

/** Sniff the real image type from the first bytes of the file. */
function sniffImageExt(buf: ArrayBuffer): string | null {
    const bytes = new Uint8Array(buf);
    if (bytes.length < 12) return null;

    for (const sig of EXT_FROM_SIGNATURE) {
        if (sig.bytes.every((b, i) => bytes[i] === b)) return sig.ext;
    }
    // WebP: RIFF....WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return 'webp';
    }
    // AVIF / HEIC-style ISO BMFF: "ftyp" box with an avif/avis brand.
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
        if (brand === 'avif' || brand === 'avis') return 'avif';
    }
    return null;
}

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

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'Image must be 5 MB or smaller' },
                { status: 400 }
            );
        }

        // Validate by magic bytes, not the client-claimed MIME type.
        const ext = sniffImageExt(await file.arrayBuffer());
        if (!ext || !ALLOWED_TYPES.has(`image/${ext === 'jpg' ? 'jpeg' : ext}`)) {
            return NextResponse.json(
                { error: 'Only image files (JPEG, PNG, WebP, AVIF, GIF) are allowed' },
                { status: 400 }
            );
        }

        // The storage path extension comes from the sniffed signature, never
        // the untrusted client filename.
        const safeId = String(memberId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
        const fileName = `${safeId || Date.now()}.${ext}`;

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
