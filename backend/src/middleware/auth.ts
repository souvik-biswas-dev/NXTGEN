import { createMiddleware } from 'hono/factory';
import { verifyAccessToken } from '@/lib/jwt';
import { forbidden, unauthorized } from '@/lib/errors';
import type { AppEnv, AuthUser } from '@/types';

async function extract(authHeader?: string): Promise<AuthUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const claims = await verifyAccessToken(token);
    return { id: claims.sub, role: claims.role };
  } catch {
    return null;
  }
}

/** Populates c.get('user') if a valid token is present; never rejects. */
export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  c.set('user', await extract(c.req.header('Authorization')));
  await next();
});

/** Requires a valid access token. 401 otherwise. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const user = await extract(c.req.header('Authorization'));
  if (!user) throw unauthorized();
  c.set('user', user);
  await next();
});

/** Requires an authenticated admin. */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const user = await extract(c.req.header('Authorization'));
  if (!user) throw unauthorized();
  if (user.role !== 'admin') throw forbidden('Admin access required');
  c.set('user', user);
  await next();
});

/** Convenience: get the authed user or throw. */
export function mustUser(c: { get: (k: 'user') => AuthUser | null }): AuthUser {
  const u = c.get('user');
  if (!u) throw unauthorized();
  return u;
}
