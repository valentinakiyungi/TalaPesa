
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/auth/login', req.url));
  response.cookies.set('session', '', { maxAge: 0 });
  return response;
}