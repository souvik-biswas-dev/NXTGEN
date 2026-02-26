import { NextRequest, NextResponse } from 'next/server';

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET is not configured. See ADMIN_ACCESS.md');
}

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

const PUBLIC_PATHS = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

