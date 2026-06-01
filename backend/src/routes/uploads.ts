import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, mustUser } from '@/middleware/auth';
import { isAllowed, isPrivate, maxBytes, signUpload } from '@/lib/cloudinary';
import { badRequest } from '@/lib/errors';
import type { AppEnv } from '@/types';

export const uploadRoutes = new Hono<AppEnv>();

// Issue a signed Cloudinary upload. The client POSTs the file + returned params
// (multipart) straight to Cloudinary, then persists the secure_url (public) or
// public_id (private broker docs). The API never proxies file bytes.
uploadRoutes.post('/sign', requireAuth, async (c) => {
  const u = mustUser(c);
  const body = z
    .object({
      kind: z.enum(['property-image', 'avatar', 'broker-document']),
      contentType: z.string(),
      size: z.number().int().positive().optional(),
    })
    .parse(await c.req.json());

  if (!isAllowed(body.kind, body.contentType)) {
    throw badRequest('Unsupported file type', 'bad_mime');
  }
  if (body.size && body.size > maxBytes(body.kind)) {
    throw badRequest(`File too large (max ${maxBytes(body.kind) / 1024 / 1024} MB)`, 'too_large');
  }

  const signed = signUpload(body.kind, u.id);
  return c.json({ ...signed, isPrivate: isPrivate(body.kind) });
});
