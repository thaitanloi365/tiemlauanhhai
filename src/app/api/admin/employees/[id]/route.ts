import { NextRequest, NextResponse } from 'next/server';
import { canManageRole, type AdminRole } from '@/lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { employeeUpdateSchema } from '@/lib/schemas';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (adminUser.role !== 'super_admin') {
    return NextResponse.json(
      { message: 'Bạn không có quyền quản lý nhân viên' },
      { status: 403 },
    );
  }

  const params = await context.params;
  if (!params.id)
    return NextResponse.json(
      { message: 'Thiếu id nhân viên' },
      { status: 400 },
    );
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

  const parsed = employeeUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: target, error: targetError } = await supabase
    .from('admin_users')
    .select('id,role')
    .eq('id', params.id)
    .maybeSingle();

  if (targetError)
    return NextResponse.json({ message: targetError.message }, { status: 500 });
  if (!target)
    return NextResponse.json(
      { message: 'Không tìm thấy nhân viên' },
      { status: 404 },
    );
  if (target.id === adminUser.id) {
    return NextResponse.json(
      { message: 'Không thể tự thay đổi vai trò của chính bạn' },
      { status: 400 },
    );
  }

  const actorRole = adminUser.role as AdminRole;
  const currentTargetRole = target.role as AdminRole;
  if (
    !canManageRole(actorRole, currentTargetRole) ||
    !canManageRole(actorRole, parsed.data.role)
  ) {
    return NextResponse.json(
      { message: 'Không thể cập nhật vai trò nhân viên này' },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update({
      role: parsed.data.role,
      display_name: parsed.data.display_name ?? null,
    })
    .eq('id', params.id)
    .select('id,email,role,display_name,created_at')
    .single();

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (adminUser.role !== 'super_admin') {
    return NextResponse.json(
      { message: 'Bạn không có quyền quản lý nhân viên' },
      { status: 403 },
    );
  }

  const params = await context.params;
  if (!params.id)
    return NextResponse.json(
      { message: 'Thiếu id nhân viên' },
      { status: 400 },
    );
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }
  if (params.id === adminUser.id) {
    return NextResponse.json(
      { message: 'Không thể tự xoá tài khoản của chính bạn' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data: target, error: targetError } = await supabase
    .from('admin_users')
    .select('id,role')
    .eq('id', params.id)
    .maybeSingle();

  if (targetError)
    return NextResponse.json({ message: targetError.message }, { status: 500 });
  if (!target)
    return NextResponse.json(
      { message: 'Không tìm thấy nhân viên' },
      { status: 404 },
    );

  const actorRole = adminUser.role as AdminRole;
  const targetRole = target.role as AdminRole;
  if (!canManageRole(actorRole, targetRole)) {
    return NextResponse.json(
      { message: 'Không thể xoá nhân viên này' },
      { status: 403 },
    );
  }

  const { error } = await supabase.auth.admin.deleteUser(params.id);
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
