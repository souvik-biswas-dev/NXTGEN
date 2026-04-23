'use server';

import { createAnonClient, createAdminClient } from '@/lib/supabase/server';
import { createSession, deleteSession, getSession } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
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
  const newSession = {
    userId: profile.user_id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  };
  await createSession(newSession);
  await auditLog(newSession, {
    action: 'admin.login',
    subject_type: 'user',
    subject_id: profile.user_id,
  });

  redirect('/');
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await auditLog(session, {
      action: 'admin.logout',
      subject_type: 'user',
      subject_id: session.userId,
    });
  }
  await deleteSession();
  redirect('/login');
}
