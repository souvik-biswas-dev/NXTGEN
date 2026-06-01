import { api } from '@/lib/api';

// Uploads go straight to Cloudinary using a short-lived signature the backend
// generates. The DB stores only the resulting secure_url (public images &
// avatars) or the public_id (private broker documents, viewed via a signed URL).

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const DOC_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function guessContentType(uri: string): string {
  const ext = (uri.split('.').pop() || '').toLowerCase().split('?')[0];
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

interface SignResponse {
  uploadUrl: string;
  params: Record<string, string | number>;
  folder: string;
  resourceType: string;
  isPrivate: boolean;
}

interface CloudinaryResult {
  secure_url: string;
  public_id: string;
}

async function uploadToCloudinary(
  localUri: string,
  kind: 'property-image' | 'avatar' | 'broker-document'
): Promise<{ secureUrl: string; publicId: string; isPrivate: boolean }> {
  const head = await fetch(localUri);
  if (!head.ok) throw new Error('Could not read the selected file');
  const blob = await head.blob();
  const limit = kind === 'broker-document' ? DOC_MAX_BYTES : IMAGE_MAX_BYTES;
  if (blob.size > limit) {
    throw new Error(`File is too large (max ${limit / 1024 / 1024} MB)`);
  }
  const contentType = blob.type && blob.type !== '' ? blob.type : guessContentType(localUri);

  const signed = await api.post<SignResponse>('/uploads/sign', {
    kind,
    contentType,
    size: blob.size,
  });

  // Multipart upload directly to Cloudinary with the signed params.
  const form = new FormData();
  const name = localUri.split('/').pop() || 'upload';
  // React Native FormData file shape.
  form.append('file', { uri: localUri, name, type: contentType } as unknown as Blob);
  for (const [k, v] of Object.entries(signed.params)) form.append(k, String(v));

  const res = await fetch(signed.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  const data = (await res.json()) as CloudinaryResult;
  return { secureUrl: data.secure_url, publicId: data.public_id, isPrivate: signed.isPrivate };
}

export type UploadImageParams = {
  localUri: string;
  /** 'property-images' | 'profile-avatars' (mapped to Cloudinary kinds). */
  bucket: 'property-images' | 'profile-avatars';
  /** Kept for call-site compatibility; the backend scopes by the authed user. */
  userId?: string;
  prefix?: string;
};

/** Upload an image and return its public secure_url. */
export async function uploadImage(params: UploadImageParams): Promise<string> {
  const kind = params.bucket === 'profile-avatars' ? 'avatar' : 'property-image';
  const { secureUrl } = await uploadToCloudinary(params.localUri, kind);
  return secureUrl;
}

export type UploadDocumentParams = {
  localUri: string;
  userId?: string;
  prefix: string;
};

/**
 * Upload a private broker document. Returns the Cloudinary public_id (persist
 * this) plus a signed URL valid for an hour (for immediate preview).
 */
export async function uploadBrokerDocument(
  params: UploadDocumentParams
): Promise<{ path: string; signedUrl: string }> {
  const { publicId } = await uploadToCloudinary(params.localUri, 'broker-document');
  const { url } = await api.get<{ url: string }>('/broker/verification/doc', { key: publicId });
  return { path: publicId, signedUrl: url };
}
