import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/config/env';

const accessKey = new TextEncoder().encode(env.jwt.accessSecret);
const refreshKey = new TextEncoder().encode(env.jwt.refreshSecret);

export interface AccessClaims {
  sub: string; // user id
  role: string; // users_profiles.role
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.jwt.accessTtl)
    .sign(accessKey);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessKey, { algorithms: ['HS256'] });
  return { sub: payload.sub as string, role: (payload.role as string) ?? 'buyer' };
}

/**
 * Opaque-ish refresh token: a JWT whose jti is stored (hashed) in
 * refresh_tokens so it can be revoked/rotated. We return both the
 * signed token and its jti for persistence.
 */
export async function signRefreshToken(userId: string, jti: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.refreshTtlDays}d`)
    .sign(refreshKey);
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
  const { payload } = await jwtVerify(token, refreshKey, { algorithms: ['HS256'] });
  return { sub: payload.sub as string, jti: payload.jti as string };
}
