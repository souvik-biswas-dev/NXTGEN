import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { users, usersProfiles } from '$lib/server/schema';
import { createSession, clearSession } from '$lib/server/auth';
import { auditLog } from '$lib/server/audit';
import type { Actions } from './$types';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const form = Object.fromEntries(await request.formData());
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return fail(400, { error: 'Enter a valid email and password', email: String(form.email ?? '') });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return fail(401, { error: 'Invalid email or password', email });
    }

    const profile = await db.query.usersProfiles.findFirst({
      where: eq(usersProfiles.userId, user.id),
    });
    if (!profile) return fail(401, { error: 'Profile not found', email });
    if (profile.role !== 'admin') return fail(403, { error: 'Admin access required', email });

    const session = {
      userId: profile.userId,
      email: profile.email ?? email,
      name: profile.name ?? 'Admin',
      role: profile.role,
    };
    await createSession(cookies, session);
    await auditLog(session, { action: 'admin.login', subject_type: 'user', subject_id: session.userId });
    throw redirect(303, '/');
  },

  logout: async ({ cookies, locals }) => {
    if (locals.session) {
      await auditLog(locals.session, {
        action: 'admin.logout',
        subject_type: 'user',
        subject_id: locals.session.userId,
      });
    }
    clearSession(cookies);
    throw redirect(303, '/login');
  },
};
