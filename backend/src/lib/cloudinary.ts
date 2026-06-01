import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

// Image/document storage on Cloudinary. The app uploads bytes straight to
// Cloudinary using a short-lived signature the backend generates — the API
// never proxies file bytes. The DB stores only the secure_url (public assets)
// or the public_id (private broker documents, served via a signed URL).

if (env.cloudinary.configured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export type UploadKind = 'property-image' | 'avatar' | 'broker-document';

const FOLDER: Record<UploadKind, string> = {
  'property-image': 'property-images',
  avatar: 'profile-avatars',
  'broker-document': 'broker-documents',
};

const ALLOWED: Record<UploadKind, string[]> = {
  'property-image': ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  'broker-document': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const MAX_BYTES: Record<UploadKind, number> = {
  'property-image': 5 * 1024 * 1024,
  avatar: 5 * 1024 * 1024,
  'broker-document': 10 * 1024 * 1024,
};

export function isAllowed(kind: UploadKind, contentType: string): boolean {
  return ALLOWED[kind].includes(contentType);
}
export function maxBytes(kind: UploadKind): number {
  return MAX_BYTES[kind];
}
export function isPrivate(kind: UploadKind): boolean {
  return kind === 'broker-document';
}

export interface SignedUpload {
  uploadUrl: string;
  params: Record<string, string | number>;
  folder: string;
  resourceType: 'image' | 'raw' | 'auto';
}

/**
 * Build a signed Cloudinary upload payload. The client POSTs the file plus
 * these params (multipart) to `uploadUrl`. Files are scoped to a per-user
 * folder; broker documents are uploaded as `authenticated` (private).
 */
export function signUpload(kind: UploadKind, userId: string): SignedUpload {
  if (!env.cloudinary.configured) throw new Error('Cloudinary is not configured');

  const folder = `${FOLDER[kind]}/${userId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  // PDFs are 'raw'; images use 'image'. 'auto' lets Cloudinary detect.
  const resourceType: SignedUpload['resourceType'] = kind === 'broker-document' ? 'auto' : 'image';

  // Params that must be signed (alphabetical) — keep in sync with what the client sends.
  const toSign: Record<string, string | number> = { folder, timestamp };
  if (isPrivate(kind)) toSign.type = 'authenticated';

  const signature = cloudinary.utils.api_sign_request(toSign, env.cloudinary.apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/${resourceType}/upload`,
    params: {
      ...toSign,
      api_key: env.cloudinary.apiKey,
      signature,
    },
    folder,
    resourceType,
  };
}

/** Short-lived signed delivery URL for a private (authenticated) asset. */
export function signedUrl(publicId: string, ttlSeconds = 3600): string {
  return cloudinary.url(publicId, {
    type: 'authenticated',
    sign_url: true,
    secure: true,
    resource_type: 'image',
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}

export async function deleteAsset(publicId: string): Promise<void> {
  if (!env.cloudinary.configured) return;
  await cloudinary.uploader.destroy(publicId);
}
