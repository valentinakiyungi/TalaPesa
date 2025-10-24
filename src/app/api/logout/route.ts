import { NextResponse } from 'next/server';

export async function POST() {
  
  const response = NextResponse.json({ message: 'Logged out' });
  // Clear cookies 
  response.cookies.delete('token'); // replace 'token' with your cookie name
  return response;
}