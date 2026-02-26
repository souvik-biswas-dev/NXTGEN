'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function updateUserRole(userId: string, role: string) {
  const validRoles = ['buyer', 'owner', 'broker', 'admin'];
  if (!validRoles.includes(role)) return { error: 'Invalid role' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users_profiles')
    .update({ role })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  revalidatePath('/users');
  return { success: true };
}

export async function toggleBrokerVerification(userId: string, verified: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users_profiles')
    .update({ verified_broker: verified })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();
  // Delete from Supabase Auth (cascades to users_profiles due to FK)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath('/users');
  return { success: true };
}

export async function createAdminUser(email: string, password: string, name: string, phone: string) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    phone: z.string().optional(),
  });

  const parsed = schema.safeParse({ email, password, name, phone });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Validation error' };

  const supabase = createAdminClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) return { error: authError?.message || 'Failed to create user' };

  // Create profile with admin role
  const { error: profileError } = await supabase.from('users_profiles').insert({
    user_id: authData.user.id,
    email,
    name,
    phone: phone || '',
    role: 'admin',
    verified_broker: false,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/users');
  return { success: true, userId: authData.user.id };
}
