'use server';

import { createAnonClient, createAdminClient } from '@/lib/supabase/server';
import { createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginState = { error: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: formData.get('email')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation error' };
  }

  const { email, password } = parsed.data;

  // Sign in with Supabase Auth
  const supabase = createAnonClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Invalid email or password' };
  }

  // Verify the user has admin role using admin client (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from('users_profiles')
    .select('user_id, name, email, role')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'User profile not found' };
  }

  if (profile.role !== 'admin') {
    return { error: 'Access denied. Admin privileges required.' };
  }

  // Create JWT session
  await createSession({
    userId: profile.user_id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  });

  redirect('/');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/login');
}
