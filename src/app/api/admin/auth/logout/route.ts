import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/server/admin-auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: ADMIN_COOKIE_NAME, path: '/' });
  return response;
}
