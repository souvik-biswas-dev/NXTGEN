'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function cancelSubscription(subscriptionId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'subscription.cancel',
    subject_type: 'subscription',
    subject_id: subscriptionId,
  });
  revalidatePath('/subscriptions');
  return { success: true };
}

export async function extendSubscription(subscriptionId: string, days: number) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (!Number.isFinite(days) || days <= 0 || days > 730) {
    return { error: 'Days must be between 1 and 730' };
  }

  const supabase = createAdminClient();

  // Get current ends_at
  const { data, error: fetchError } = await supabase
    .from('subscriptions')
    .select('ends_at')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !data) return { error: 'Subscription not found' };

  const newEndsAt = new Date(data.ends_at);
  newEndsAt.setDate(newEndsAt.getDate() + days);

  const { error } = await supabase
    .from('subscriptions')
    .update({ ends_at: newEndsAt.toISOString(), status: 'active' })
    .eq('id', subscriptionId);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'subscription.extend',
    subject_type: 'subscription',
    subject_id: subscriptionId,
    before: { ends_at: data.ends_at },
    after: { ends_at: newEndsAt.toISOString(), status: 'active' },
    metadata: { days },
  });
  revalidatePath('/subscriptions');
  return { success: true };
}

export async function updateLocalityReview(
  id: string,
  rating: number,
  avgPrice?: number
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { error: 'Rating must be between 0 and 5' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('locality_reviews')
    .update({ rating, ...(avgPrice !== undefined && { avg_price: avgPrice }) })
    .eq('id', id);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'locality_review.update',
    subject_type: 'locality_review',
    subject_id: id,
    after: { rating, avg_price: avgPrice },
  });
  revalidatePath('/reviews');
  return { success: true };
}

export async function deleteLocalityReview(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('locality_reviews').delete().eq('id', id);
  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'locality_review.delete',
    subject_type: 'locality_review',
    subject_id: id,
  });
  revalidatePath('/reviews');
  return { success: true };
}

export async function updatePlatformData(key: string, data: unknown) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (typeof key !== 'string' || key.length === 0 || key.length > 120) {
    return { error: 'Invalid key' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('platform_data')
    .upsert({ key, data, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'platform_data.update',
    subject_type: 'platform_data',
    subject_id: key,
  });
  revalidatePath('/platform-data');
  return { success: true };
}
