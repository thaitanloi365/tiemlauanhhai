import { json, type RequestEvent } from '@sveltejs/kit';
import { canManageRole, type AdminRole } from '$lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { employeeUpdateSchema } from '$lib/utils/validation';

function ensureSuperAdmin(event: RequestEvent) {
	if (!event.locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	if (event.locals.adminUser.role !== 'super_admin') {
		return json({ message: 'Bạn không có quyền quản lý nhân viên' }, { status: 403 });
	}
	return null;
}

export async function PATCH(event: RequestEvent<{ id: string }>) {
	const unauthorized = ensureSuperAdmin(event);
	if (unauthorized) return unauthorized;
	if (!event.params.id) return json({ message: 'Thiếu id nhân viên' }, { status: 400 });
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	let payload: unknown;
	try {
		payload = await event.request.json();
	} catch {
		return json({ message: 'Payload không hợp lệ' }, { status: 400 });
	}

	const parsed = employeeUpdateSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' }, { status: 400 });
	}

	const supabase = createServerSupabase();
	const { data: target, error: targetError } = await supabase
		.from('admin_users')
		.select('id,role')
		.eq('id', event.params.id)
		.maybeSingle();

	if (targetError) return json({ message: targetError.message }, { status: 500 });
	if (!target) return json({ message: 'Không tìm thấy nhân viên' }, { status: 404 });
	if (target.id === event.locals.adminUser!.id) {
		return json({ message: 'Không thể tự thay đổi vai trò của chính bạn' }, { status: 400 });
	}

	const actorRole = event.locals.adminUser!.role as AdminRole;
	const currentTargetRole = target.role as AdminRole;
	if (!canManageRole(actorRole, currentTargetRole) || !canManageRole(actorRole, parsed.data.role)) {
		return json({ message: 'Không thể cập nhật vai trò nhân viên này' }, { status: 403 });
	}

	const { data, error } = await supabase
		.from('admin_users')
		.update({
			role: parsed.data.role,
			display_name: parsed.data.displayName ?? null
		})
		.eq('id', event.params.id)
		.select('id,email,role,display_name,created_at')
		.single();

	if (error) return json({ message: error.message }, { status: 500 });
	return json({ employee: data });
}

export async function DELETE(event: RequestEvent<{ id: string }>) {
	const unauthorized = ensureSuperAdmin(event);
	if (unauthorized) return unauthorized;
	if (!event.params.id) return json({ message: 'Thiếu id nhân viên' }, { status: 400 });
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}
	if (event.params.id === event.locals.adminUser!.id) {
		return json({ message: 'Không thể tự xoá tài khoản của chính bạn' }, { status: 400 });
	}

	const supabase = createServerSupabase();
	const { data: target, error: targetError } = await supabase
		.from('admin_users')
		.select('id,role')
		.eq('id', event.params.id)
		.maybeSingle();

	if (targetError) return json({ message: targetError.message }, { status: 500 });
	if (!target) return json({ message: 'Không tìm thấy nhân viên' }, { status: 404 });

	const actorRole = event.locals.adminUser!.role as AdminRole;
	const targetRole = target.role as AdminRole;
	if (!canManageRole(actorRole, targetRole)) {
		return json({ message: 'Không thể xoá nhân viên này' }, { status: 403 });
	}

	const { error } = await supabase.auth.admin.deleteUser(event.params.id);
	if (error) return json({ message: error.message }, { status: 500 });

	return json({ ok: true });
}
