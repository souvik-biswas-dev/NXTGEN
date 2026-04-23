import { createAdminClient } from '@/lib/supabase/server';
import type { AdminSession } from '@/lib/auth';

// Append a row to admin_audit_log. Service-role write so RLS is irrelevant.
// Swallows its own errors: auditing must not block the primary action, but
// we still console.error for observability.
export async function auditLog(
  session: AdminSession,
  input: {
    action: string;                    // e.g. 'property.verify'
    subject_type: string;              // 'property' | 'user' | 'subscription'
    subject_id: string;                // string form of target id
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from('admin_audit_log').insert({
      actor_id: session.userId,
      actor_email: session.email,
      action: input.action,
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error('[audit] failed to write log:', err);
  }
}
