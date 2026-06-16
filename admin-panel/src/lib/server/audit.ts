import { db } from './db';
import { adminAuditLog } from './schema';
import type { AdminSession } from './auth';

// Append-only admin action log. Swallows its own errors so auditing never
// blocks the primary action.
export async function auditLog(
  session: AdminSession,
  input: {
    action: string;
    subject_type: string;
    subject_id: string;
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      actorId: session.userId,
      actorEmail: session.email,
      action: input.action,
      subjectType: input.subject_type,
      subjectId: input.subject_id,
      before: (input.before ?? null) as object | null,
      after: (input.after ?? null) as object | null,
      metadata: (input.metadata ?? {}) as object,
    });
  } catch (err) {
    console.error('[audit] failed:', err);
  }
}
