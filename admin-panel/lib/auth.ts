import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET is not configured. See ADMIN_ACCESS.md');
}

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 60 * 60 * 8; // 8 hours in seconds

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function createSession(session: AdminSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

export async function getSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
