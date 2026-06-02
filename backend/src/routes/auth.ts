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
import { badRequest, conflict, unauthorized, ApiError } from '@/lib/errors';
import { enforceLimit, rlKey } from '@/lib/rateLimit';
import type { AppEnv } from '@/types';
import type { Context } from 'hono';

export const authRoutes = new Hono<AppEnv>();

const ROLES = ['buyer', 'owner', 'broker'] as const;

/** Best-effort client IP (Render/most proxies set x-forwarded-for). */
function clientIp(c: Context): string {
  const xff = c.req.header('x-forwarded-for');
  return xff?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
}

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

  await enforceLimit(rlKey(`register-ip:${clientIp(c)}`), 'register', 20, 3600, 'Too many sign-up attempts. Try again later.');

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
  // Brute-force guard: per-account and per-IP.
  await enforceLimit(rlKey(`login:${email}`), 'login', 10, 900, 'Too many login attempts. Try again later.');
  await enforceLimit(rlKey(`login-ip:${clientIp(c)}`), 'login_ip', 50, 900, 'Too many login attempts. Try again later.');

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
      name: z.string().min(1).max(120).optional(),
      phone: z.string().min(8).max(20).optional(),
      avatar_url: z.string().url().optional(),
      email: z.string().email().optional(),
    })
    .parse(await c.req.json());

  const newEmail = body.email?.toLowerCase().trim();

  // Changing email: enforce uniqueness ourselves (friendly 409 instead of a raw
  // DB constraint 500) and drop the verified flag until the new address is proven.
  if (newEmail) {
    const clash = await db.query.users.findFirst({ where: eq(users.email, newEmail) });
    if (clash && clash.id !== u.id) throw conflict('That email is already in use');
  }

  await db
    .update(usersProfiles)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.avatar_url !== undefined && { avatarUrl: body.avatar_url }),
      ...(newEmail !== undefined && { email: newEmail }),
      updatedAt: new Date(),
    })
    .where(eq(usersProfiles.userId, u.id));

  if (newEmail) {
    await db
      .update(users)
      .set({ email: newEmail, emailVerified: false, updatedAt: new Date() })
      .where(eq(users.id, u.id));
  }
  return c.json(await getMe(u.id));
});

// ── Phone OTP: request ───────────────────────────────────────────
authRoutes.post('/otp/request', async (c) => {
  const { phone } = z
    .object({ phone: z.string().min(8).max(20) })
    .parse(await c.req.json());

  // Abuse guard: cap OTP sends per phone and per IP (SMS bombing / cost).
  await enforceLimit(rlKey(`otp:${phone}`), 'otp_request', 5, 600, 'Too many OTP requests. Please wait a few minutes.');
  await enforceLimit(rlKey(`otp-ip:${clientIp(c)}`), 'otp_request_ip', 20, 600, 'Too many OTP requests. Please wait a few minutes.');

  // Whitelisted test numbers get a fixed code and skip MSG91 entirely, so the
  // app is testable before DLT approval. Everyone else goes through MSG91.
  const isTestPhone = env.otp.testPhones.includes(phone.replace(/[\s+]/g, ''));
  const code = isTestPhone ? env.otp.testCode : generateOtp(6);

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

  // Cap verification attempts so a 6-digit code can't be brute-forced.
  await enforceLimit(rlKey(`otpv:${body.phone}`), 'otp_verify', 10, 600, 'Too many attempts. Request a new code.');

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
    .object({ idToken: z.string().min(1), role: z.enum(ROLES).optional() })
    .parse(await c.req.json());

  // Fail closed: without configured client IDs we cannot validate the token's
  // audience, so Google sign-in must be explicitly configured.
  if (env.google.clientIds.length === 0) {
    throw new ApiError(500, 'Google sign-in is not configured');
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) throw unauthorized('Invalid Google token');
  const info = (await res.json()) as {
    sub: string;
    aud?: string;
    iss?: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: string | boolean;
  };

  // Critical: verify the token was minted for *our* app, not some other Google
  // OAuth client. Without this, an ID token from any app would be accepted.
  if (!info.aud || !env.google.clientIds.includes(info.aud)) {
    throw unauthorized('Google token was issued for a different application');
  }
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') {
    throw unauthorized('Invalid Google token issuer');
  }
  // Only trust a verified email for account linking.
  const emailVerified = info.email_verified === true || info.email_verified === 'true';
  const email = emailVerified ? info.email?.toLowerCase() : undefined;

  let user =
    (await db.query.users.findFirst({ where: eq(users.googleId, info.sub) })) ??
    (email ? await db.query.users.findFirst({ where: eq(users.email, email) }) : undefined);

  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email, googleId: info.sub, emailVerified })
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
