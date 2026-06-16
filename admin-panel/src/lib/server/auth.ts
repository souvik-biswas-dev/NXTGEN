import { SignJWT, jwtVerify } from 'jose';
import type { Cookies } from '@sveltejs/kit';
import { ADMIN_JWT_SECRET } from '$env/static/private';

const SECRET = new TextEncoder().encode(ADMIN_JWT_SECRET);
const COOKIE = 'admin_session';
const TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function createSession(cookies: Cookies, session: AdminSession): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(SECRET);
  cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TTL_SECONDS,
    path: '/',
  });
}

export async function readSession(cookies: Cookies): Promise<AdminSession | null> {
  const token = cookies.get(COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
  } catch {
    /* invalid/expired */
  }
  return null;
}

export function clearSession(cookies: Cookies): void {
  cookies.delete(COOKIE, { path: '/' });
}
