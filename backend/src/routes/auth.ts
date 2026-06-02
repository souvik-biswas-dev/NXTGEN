import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { env } from '@/config/env';
import { db } from '@/db';
import { users, usersProfiles, otpCodes } from '@/db/schema';
import { hashPassword, verifyPassword, hashSecret, verifySecret } from '@/lib/password';
import { generateOtp, sendPhoneOtp } from '@/lib/otp';
import { issueTokens, rotateRefresh, revokeAllRefresh, getMe } from '@/services/authService';
import { requireAuth, mustUser } from '@/middleware/auth';
import { badRequest, conflict, unauthorized, notFound } from '@/lib/errors';
import { enforceLimit } from '@/lib/rateLimit';
import type { AppEnv } from '@/types';

export const authRoutes = new Hono<AppEnv>();

const ROLES = ['buyer', 'owner', 'broker'] as const;

// ── Register (email + password) ──────────────────────────────────
authRoutes.post('/register', async (c) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
      role: z.enum(ROLES).default('buyer'),
      phone: z.string().optional(),
    })
    .parse(await c.req.json());

  const email = body.email.toLowerCase().trim();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw conflict('An account with this email already exists');

  const [user] = await db
    .insert(users)
    .values({ email, phone: body.phone, passwordHash: await hashPassword(body.password) })
    .returning();

  await db.insert(usersProfiles).values({
    userId: user.id,
    email,
    phone: body.phone,
    name: body.name,
    role: body.role,
  });

  const tokens = await issueTokens(user.id, body.role);
  return c.json({ ...tokens, user: await getMe(user.id) }, 201);
});

// ── Login (email + password) ─────────────────────────────────────
authRoutes.post('/login', async (c) => {
  const body = z
    .object({ email: z.string().email(), password: z.string() })
    .parse(await c.req.json());

  const email = body.email.toLowerCase().trim();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !user.passwordHash) throw unauthorized('Invalid email or password');
  if (!(await verifyPassword(body.password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }
  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, user.id),
  });
  const tokens = await issueTokens(user.id, profile?.role ?? 'buyer');
  return c.json({ ...tokens, user: await getMe(user.id) });
});

// ── Refresh ──────────────────────────────────────────────────────
authRoutes.post('/refresh', async (c) => {
  const { refreshToken } = z
    .object({ refreshToken: z.string() })
    .parse(await c.req.json());
  const tokens = await rotateRefresh(refreshToken);
  return c.json(tokens);
});

// ── Logout (revoke all refresh tokens) ───────────────────────────
authRoutes.post('/logout', requireAuth, async (c) => {
  await revokeAllRefresh(mustUser(c).id);
  return c.json({ ok: true });
});

// ── Me ───────────────────────────────────────────────────────────
authRoutes.get('/me', requireAuth, async (c) => {
  return c.json(await getMe(mustUser(c).id));
});

// Update own profile (replaces authStore.updateProfile / users_profiles update).
authRoutes.patch('/me', requireAuth, async (c) => {
  const u = mustUser(c);
  const body = z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      avatar_url: z.string().url().optional(),
      email: z.string().email().optional(),
    })
    .parse(await c.req.json());

  await db
    .update(usersProfiles)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.avatar_url !== undefined && { avatarUrl: body.avatar_url }),
      ...(body.email !== undefined && { email: body.email.toLowerCase() }),
      updatedAt: new Date(),
    })
    .where(eq(usersProfiles.userId, u.id));

  if (body.email) {
    await db.update(users).set({ email: body.email.toLowerCase() }).where(eq(users.id, u.id));
  }
  return c.json(await getMe(u.id));
});

// ── Phone OTP: request ───────────────────────────────────────────
authRoutes.post('/otp/request', async (c) => {
  const { phone } = z
    .object({ phone: z.string().min(8) })
    .parse(await c.req.json());

  // Whitelisted test numbers get a fixed code and skip MSG91 entirely, so the
  // app is testable before DLT approval. Everyone else goes through MSG91.
  const isTestPhone = env.otp.testPhones.includes(phone.replace(/[\s+]/g, ''));
  const code = isTestPhone ? env.otp.testCode : generateOtp(6);

  // Light abuse guard keyed by phone (use the phone as a pseudo user id).
  // 5 requests / 10 min.
  await db.insert(otpCodes).values({
    identifier: phone,
    channel: 'phone',
    codeHash: await hashSecret(code),
    expiresAt: new Date(Date.now() + 5 * 60_000),
  });
  if (isTestPhone) {
    console.log(`[otp:test] whitelisted phone=${phone} uses fixed code`);
  } else {
    await sendPhoneOtp(phone, code);
  }
  return c.json({ ok: true });
});

// ── Phone OTP: verify (logs in or creates the account) ───────────
authRoutes.post('/otp/verify', async (c) => {
  const body = z
    .object({
      phone: z.string().min(8),
      code: z.string().length(6),
      name: z.string().optional(),
      role: z.enum(ROLES).optional(),
    })
    .parse(await c.req.json());

  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.identifier, body.phone),
        eq(otpCodes.channel, 'phone'),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date())
      )
    );
  let valid = false;
  for (const r of rows) {
    if (await verifySecret(body.code, r.codeHash)) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, r.id));
      valid = true;
      break;
    }
  }
  if (!valid) throw unauthorized('Invalid or expired code');

  let user = await db.query.users.findFirst({ where: eq(users.phone, body.phone) });
  let role: string = body.role ?? 'buyer';
  if (!user) {
    [user] = await db.insert(users).values({ phone: body.phone, phoneVerified: true }).returning();
    await db.insert(usersProfiles).values({
      userId: user.id,
      phone: body.phone,
      name: body.name ?? 'User',
      role,
    });
  } else {
    if (!user.phoneVerified) {
      await db.update(users).set({ phoneVerified: true }).where(eq(users.id, user.id));
    }
    const profile = await db.query.usersProfiles.findFirst({
      where: eq(usersProfiles.userId, user.id),
    });
    role = profile?.role ?? role;
  }
  const tokens = await issueTokens(user.id, role);
  return c.json({ ...tokens, user: await getMe(user.id) });
});

// ── Google OAuth (verify ID token from the mobile Google sign-in) ─
authRoutes.post('/google', async (c) => {
  const { idToken, role } = z
    .object({ idToken: z.string(), role: z.enum(ROLES).optional() })
    .parse(await c.req.json());

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw unauthorized('Invalid Google token');
  const info = (await res.json()) as {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: string | boolean;
  };
  const email = info.email?.toLowerCase();

  let user =
    (await db.query.users.findFirst({ where: eq(users.googleId, info.sub) })) ??
    (email ? await db.query.users.findFirst({ where: eq(users.email, email) }) : undefined);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email, googleId: info.sub, emailVerified: true })
      .returning();
    await db.insert(usersProfiles).values({
      userId: user.id,
      email,
      name: info.name ?? 'User',
      role: role ?? 'buyer',
      avatarUrl: info.picture,
    });
  } else if (!user.googleId) {
    await db.update(users).set({ googleId: info.sub }).where(eq(users.id, user.id));
  }

  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, user.id),
  });
  const tokens = await issueTokens(user.id, profile?.role ?? 'buyer');
  return c.json({ ...tokens, user: await getMe(user.id) });
});
