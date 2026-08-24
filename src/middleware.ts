// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    if (url.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const url = req.nextUrl.clone();
    if (url.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('auth');
    return res;
  }

  // Attach user info to request headers for downstream handlers.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId as string);
  requestHeaders.set('x-user-email', payload.email as string);
  requestHeaders.set('x-user-name', payload.name as string);
  requestHeaders.set('x-user-role', payload.role as string);

  // Role authorization check for page routes
  const url = req.nextUrl.clone();
  const role = payload.role as string;
  const path = url.pathname;

  if (path.startsWith('/student') && role !== 'STUDENT') {
    url.pathname = role === 'TEACHER' ? '/teacher' : '/admin';
    return NextResponse.redirect(url);
  }
  if (path.startsWith('/teacher') && role !== 'TEACHER') {
    url.pathname = role === 'STUDENT' ? '/student' : '/admin';
    return NextResponse.redirect(url);
  }
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    url.pathname = role === 'STUDENT' ? '/student' : '/teacher';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Protect API routes and role-specific pages.
  // Public routes (/login, /api/auth/*) are excluded so unauthenticated users can log in.
  matcher: [
    '/api/((?!auth/).*)',
    '/student/:path*',
    '/teacher/:path*',
    '/admin/:path*',
  ],
};
