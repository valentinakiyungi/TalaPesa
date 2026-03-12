import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/loans', '/reports', '/settings', '/staff'];

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  console.log('[Middleware]', url.pathname, 'Token:', token ? 'exists' : 'missing');

  if (protectedRoutes.some(route => url.pathname.startsWith(route))) {
    if (!token) {
      console.log('[Middleware] No token → redirect to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!login|register|forgot-password|api|_next/static|_next/image|favicon.ico).*)'],
};