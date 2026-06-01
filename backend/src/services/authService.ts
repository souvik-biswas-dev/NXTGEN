import { and, eq, isNull, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { users, usersProfiles, refreshTokens } from '@/db/schema';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/jwt';
import { hashSecret, verifySecret } from '@/lib/password';
import { env } from '@/config/env';
import { unauthorized } from '@/lib/errors';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Issue a fresh access + refresh pair, persisting the refresh token (hashed). */
export async function issueTokens(userId: string, role: string): Promise<TokenPair> {
  const jti = nanoid(32);
  const refreshToken = await signRefreshToken(userId, jti);
  const expiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 86400_000);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: await hashSecret(jti),
    expiresAt,
  });
  const accessToken = await signAccessToken({ sub: userId, role });
  return { accessToken, refreshToken };
}

/** Rotate: validate the presented refresh token, revoke it, issue a new pair. */
export async function rotateRefresh(token: string): Promise<TokenPair> {
  let sub: string;
  let jti: string;
  try {
    ({ sub, jti } = await verifyRefreshToken(token));
  } catch {
    throw unauthorized('Invalid refresh token');
  }

  // Find a live (non-revoked, non-expired) token row for this user that matches the jti.
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, sub),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    );
  let matched: (typeof rows)[number] | undefined;
  for (const r of rows) {
    if (await verifySecret(jti, r.tokenHash)) {
      matched = r;
      break;
    }
  }
  if (!matched) throw unauthorized('Refresh token revoked or expired');

  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, matched.id));

  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, sub),
  });
  return issueTokens(sub, profile?.role ?? 'buyer');
}

/** Revoke all refresh tokens for a user (logout-all / sign out). */
export async function revokeAllRefresh(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

/** The user + profile shape returned to the client (mirrors the old Supabase user). */
export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, userId),
  });
  if (!user) throw unauthorized();
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    profile: profile ?? null,
  };
}
