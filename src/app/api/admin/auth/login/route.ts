import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminByUserId } from '@/lib/server/admin-auth';
import {
  createServerSupabaseAuthClient,
  hasSupabaseConfig,
} from '@/lib/server/supabase';
import { adminLoginSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Email hoặc mật khẩu không hợp lệ' },
      { status: 400 },
    );
  }

  const authClient = createServerSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user || !data.session) {
    return NextResponse.json(
      { message: 'Sai email hoặc mật khẩu' },
      { status: 401 },
    );
  }

  const adminUser = await getAdminByUserId(data.user.id);
  if (!adminUser) {
    return NextResponse.json(
      { message: 'Tài khoản không có quyền admin' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    },
  });

  response.cookies.set(ADMIN_COOKIE_NAME, data.session.access_token, {
    path: '/',
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: data.session.expires_in ?? 60 * 60,
  });

  return response;
}
