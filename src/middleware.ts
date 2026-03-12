import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/loans', '/reports', '/settings', '/staff'];

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  if (protectedRoutes.some(route => url.pathname.startsWith(route))) {
    if (!token) {
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