import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { brokerVerifications } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import { signedUrl } from '@/lib/cloudinary';
import { conflict, forbidden } from '@/lib/errors';
import type { AppEnv } from '@/types';

export const brokerRoutes = new Hono<AppEnv>();

// Submit / resubmit a verification request (RERA + documents already uploaded to R2).
brokerRoutes.post('/verification', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({
      full_name: z.string(),
      rera_id: z.string(),
      agency_name: z.string().optional(),
      years_experience: z.number().int().optional(),
      id_document_url: z.string(),
      rera_document_url: z.string(),
      agency_document_url: z.string().optional(),
    })
    .parse(await c.req.json());

  const existing = await db.query.brokerVerifications.findFirst({
    where: eq(brokerVerifications.userId, u.id),
  });
  if (existing && existing.status === 'approved') throw conflict('Already verified');

  const values = {
    userId: u.id,
    fullName: b.full_name,
    reraId: b.rera_id,
    agencyName: b.agency_name,
    yearsExperience: b.years_experience,
    idDocumentUrl: b.id_document_url,
    reraDocumentUrl: b.rera_document_url,
    agencyDocumentUrl: b.agency_document_url,
    status: 'pending' as const,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(brokerVerifications)
    .values(values)
    .onConflictDoUpdate({ target: brokerVerifications.userId, set: values })
    .returning();
  return c.json(row, 201);
});

brokerRoutes.get('/verification', requireAuth, async (c) => {
  const u = mustUser(c);
  const row = await db.query.brokerVerifications.findFirst({
    where: eq(brokerVerifications.userId, u.id),
  });
  return c.json({ verification: row ?? null });
});

// Short-lived signed GET URL for a private broker document (owner or admin).
brokerRoutes.get('/verification/doc', requireAuth, async (c) => {
  const u = mustUser(c);
  const key = c.req.query('key'); // Cloudinary public_id, e.g. broker-documents/<userId>/<file>
  if (!key) throw forbidden('key required');
  const ownerSegment = key.split('/')[1];
  if (u.role !== 'admin' && ownerSegment !== u.id) throw forbidden();
  return c.json({ url: signedUrl(key) });
});
