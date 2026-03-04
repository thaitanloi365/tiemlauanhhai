import { NextRequest, NextResponse } from 'next/server';
import { changePasswordSchema } from '@/lib/schemas';
import {
  createServerSupabase,
  createServerSupabaseAuthClient,
  hasSupabaseConfig,
} from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

export async function POST(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const parsed = changePasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const authClient = createServerSupabaseAuthClient();
  const { data: signInData, error: signInError } =
    await authClient.auth.signInWithPassword({
      email: adminUser.email,
      password: parsed.data.current_password,
    });
  if (signInError || !signInData.user) {
    return NextResponse.json(
      { message: 'Mật khẩu hiện tại không chính xác' },
      { status: 401 },
    );
  }

  const adminClient = createServerSupabase();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    adminUser.id,
    {
      password: parsed.data.new_password,
    },
  );
  if (updateError)
    return NextResponse.json({ message: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
