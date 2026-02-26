'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function togglePropertyVerified(propertyId: string, verified: boolean) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('properties')
    .update({ verified })
    .eq('id', propertyId);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}

export async function togglePropertyFeatured(propertyId: string, featured: boolean) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('properties')
    .update({ featured })
    .eq('id', propertyId);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);
  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}

export async function bulkVerifyProperties(propertyIds: string[]) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('properties')
    .update({ verified: true })
    .in('id', propertyIds);

  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}

export async function bulkDeleteProperties(propertyIds: string[]) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('properties').delete().in('id', propertyIds);
  if (error) return { error: error.message };
  revalidatePath('/properties');
  return { success: true };
}
