'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
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
  await auditLog(session, {
    action: verified ? 'property.verify' : 'property.unverify',
    subject_type: 'property',
    subject_id: propertyId,
    after: { verified },
  });
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
  await auditLog(session, {
    action: featured ? 'property.feature' : 'property.unfeature',
    subject_type: 'property',
    subject_id: propertyId,
    after: { featured },
  });
  revalidatePath('/properties');
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from('properties')
    .select('id, title, owner_id, broker_id, city, price, verified, featured')
    .eq('id', propertyId)
    .maybeSingle();
  const { error } = await supabase.from('properties').delete().eq('id', propertyId);
  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'property.delete',
    subject_type: 'property',
    subject_id: propertyId,
    before: before ?? undefined,
  });
  revalidatePath('/properties');
  return { success: true };
}

export async function bulkVerifyProperties(propertyIds: string[]) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    return { error: 'No properties selected' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('properties')
    .update({ verified: true })
    .in('id', propertyIds);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'property.bulk_verify',
    subject_type: 'property',
    subject_id: propertyIds.join(','),
    metadata: { count: propertyIds.length },
  });
  revalidatePath('/properties');
  return { success: true };
}

export async function bulkDeleteProperties(propertyIds: string[]) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    return { error: 'No properties selected' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('properties').delete().in('id', propertyIds);
  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'property.bulk_delete',
    subject_type: 'property',
    subject_id: propertyIds.join(','),
    metadata: { count: propertyIds.length },
  });
  revalidatePath('/properties');
  return { success: true };
}
