'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const VALID_ROLES = ['buyer', 'owner', 'broker', 'admin'] as const;

export async function updateUserRole(userId: string, role: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  if (!(VALID_ROLES as readonly string[]).includes(role)) return { error: 'Invalid role' };

  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from('users_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  const { error } = await supabase
    .from('users_profiles')
    .update({ role })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'user.role_change',
    subject_type: 'user',
    subject_id: userId,
    before: before ?? undefined,
    after: { role },
  });
  revalidatePath('/users');
  return { success: true };
}

export async function toggleBrokerVerification(userId: string, verified: boolean) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users_profiles')
    .update({ verified_broker: verified })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  await auditLog(session, {
    action: verified ? 'broker.verify' : 'broker.unverify',
    subject_type: 'user',
    subject_id: userId,
    after: { verified_broker: verified },
  });
  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }
  if (userId === session.userId) {
    return { error: 'You cannot delete your own account' };
  }

  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from('users_profiles')
    .select('user_id, email, name, role')
    .eq('user_id', userId)
    .maybeSingle();
  // Delete from Supabase Auth (cascades to users_profiles due to FK)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  await auditLog(session, {
    action: 'user.delete',
    subject_type: 'user',
    subject_id: userId,
    before: before ?? undefined,
  });
  revalidatePath('/users');
  return { success: true };
}

const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(12, 'Admin passwords must be at least 12 characters')
    .max(72)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a digit')
    .regex(/[^A-Za-z0-9]/, 'Must contain a symbol'),
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number').optional().or(z.literal('')),
});

export async function createAdminUser(email: string, password: string, name: string, phone: string) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  const parsed = createAdminSchema.safeParse({ email, password, name, phone });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation error' };

  const supabase = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) return { error: authError?.message || 'Failed to create user' };

  // Create profile with admin role
  const { error: profileError } = await supabase.from('users_profiles').insert({
    user_id: authData.user.id,
    email: parsed.data.email,
    name: parsed.data.name,
    phone: parsed.data.phone || '',
    role: 'admin',
    verified_broker: false,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  await auditLog(session, {
    action: 'user.create_admin',
    subject_type: 'user',
    subject_id: authData.user.id,
    metadata: { email: parsed.data.email, name: parsed.data.name },
  });
  revalidatePath('/users');
  return { success: true, userId: authData.user.id };
}
