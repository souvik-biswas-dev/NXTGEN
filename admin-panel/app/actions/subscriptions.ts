'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
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
  revalidatePath('/subscriptions');
  return { success: true };
}

export async function extendSubscription(subscriptionId: string, days: number) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
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

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('locality_reviews')
    .update({ rating, ...(avgPrice !== undefined && { avg_price: avgPrice }) })
    .eq('id', id);

  if (error) return { error: error.message };
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
  revalidatePath('/reviews');
  return { success: true };
}

export async function updatePlatformData(key: string, data: unknown) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('platform_data')
    .upsert({ key, data, updated_at: new Date().toISOString() });

  if (error) return { error: error.message };
  revalidatePath('/platform-data');
  return { success: true };
}
