import { supabase } from '@/lib/supabase';

// Defence-in-depth for file uploads. The bucket itself also enforces
// file_size_limit + allowed_mime_types (see migration 006), but we
// verify client-side too so users get an immediate error before the
// network round-trip, and so we control the exact Content-Type header.

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches bucket limit.
export const DOC_MAX_BYTES = 10 * 1024 * 1024;  // 10 MB — broker-documents bucket.

// Magic-byte signatures (first few bytes of the file). Extensions lie; magic
// bytes don't. We still reject unless BOTH the extension and the magic match.
const SIGNATURES: Array<{ mime: string; ext: string[]; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', ext: ['jpg', 'jpeg'], bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  ext: ['png'],          bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', ext: ['webp'],         bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF — followed by WEBP at +8
  { mime: 'image/heic', ext: ['heic', 'heif'], bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: 'application/pdf', ext: ['pdf'],     bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function detectMime(buf: ArrayBuffer, ext: string): string | null {
  const view = new Uint8Array(buf);
  for (const sig of SIGNATURES) {
    if (!sig.ext.includes(ext)) continue;
    const start = sig.offset ?? 0;
    if (view.length < start + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => view[start + i] === b);
    if (match) {
      // WebP needs the trailing 'WEBP' marker at offset 8 to be real.
      if (sig.mime === 'image/webp') {
        const marker = String.fromCharCode(view[8] ?? 0, view[9] ?? 0, view[10] ?? 0, view[11] ?? 0);
        if (marker !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export type UploadImageParams = {
  localUri: string;
  bucket: 'property-images' | 'profile-avatars';
  userId: string;
  /** Subfolder inside the user's folder, e.g. 'properties' or 'avatars'. */
  prefix?: string;
};

/**
 * Upload a local image URI to Supabase Storage after size + MIME checks.
 * Path always starts with `<userId>/` so the bucket's storage policy
 * (which requires `auth.uid()::text = foldername[1]`) allows the write.
 */
export async function uploadImage(params: UploadImageParams): Promise<string> {
  const { localUri, bucket, userId, prefix } = params;

  const response = await fetch(localUri);
  if (!response.ok) throw new Error('Could not read the selected file');
  const blob = await response.blob();
  if (blob.size > IMAGE_MAX_BYTES) {
    throw new Error(`Image is too large (max ${IMAGE_MAX_BYTES / 1024 / 1024} MB)`);
  }
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const extRaw = (localUri.split('.').pop() || '').toLowerCase();
  const ext = extRaw.length <= 5 ? extRaw : '';
  const mime = detectMime(arrayBuffer, ext);
  if (!mime || !mime.startsWith('image/')) {
    throw new Error('Only JPEG, PNG, WebP, or HEIC images are allowed');
  }

  // RLS requires the first path segment to equal the caller's auth.uid.
  const folder = prefix ? `${userId}/${prefix}` : `${userId}`;
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: mime, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

export type UploadDocumentParams = {
  localUri: string;
  userId: string;
  /** Human-meaningful subfolder, e.g. 'broker-verification/id'. */
  prefix: string;
};

/**
 * Upload a document (image or PDF) to the private `broker-documents` bucket
 * and return a short-lived signed URL plus the storage path. Persist the
 * path, not the signed URL — signed URLs expire.
 */
export async function uploadBrokerDocument(
  params: UploadDocumentParams,
): Promise<{ path: string; signedUrl: string }> {
  const { localUri, userId, prefix } = params;

  const response = await fetch(localUri);
  if (!response.ok) throw new Error('Could not read the selected file');
  const blob = await response.blob();
  if (blob.size > DOC_MAX_BYTES) {
    throw new Error(`File is too large (max ${DOC_MAX_BYTES / 1024 / 1024} MB)`);
  }
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const extRaw = (localUri.split('.').pop() || '').toLowerCase();
  const ext = extRaw.length <= 5 ? extRaw : '';
  const mime = detectMime(arrayBuffer, ext);
  if (!mime) {
    throw new Error('Only JPEG, PNG, WebP, or PDF files are allowed');
  }

  const fileName = `${userId}/${prefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('broker-documents')
    .upload(fileName, arrayBuffer, { contentType: mime, upsert: false });
  if (error) throw error;

  // Signed URL valid for 7 days — long enough for admin review window.
  const { data, error: signError } = await supabase.storage
    .from('broker-documents')
    .createSignedUrl(fileName, 7 * 24 * 3600);
  if (signError || !data) throw signError ?? new Error('Could not sign URL');
  return { path: fileName, signedUrl: data.signedUrl };
}
