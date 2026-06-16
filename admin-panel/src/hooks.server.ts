import { redirect, type Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/auth';

// Load the admin session into locals, and gate everything except /login.
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.session = await readSession(event.cookies);

  const path = event.url.pathname;
  const isPublic = path === '/login' || path.startsWith('/favicon');

  if (!isPublic && (!event.locals.session || event.locals.session.role !== 'admin')) {
    throw redirect(302, '/login');
  }
  if (path === '/login' && event.locals.session?.role === 'admin') {
    throw redirect(302, '/');
  }

  return resolve(event);
};
