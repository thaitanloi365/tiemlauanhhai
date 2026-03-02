import { json, type RequestEvent } from '@sveltejs/kit';
import { canManageRole, type AdminRole } from '$lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { employeeSchema } from '$lib/utils/validation';

function ensureSuperAdmin(event: RequestEvent) {
	if (!event.locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	if (event.locals.adminUser.role !== 'super_admin') {
		return json({ message: 'Bạn không có quyền quản lý nhân viên' }, { status: 403 });
	}
	return null;
}

export async function GET(event: RequestEvent) {
	const unauthorized = ensureSuperAdmin(event);
	if (unauthorized) return unauthorized;
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const supabase = createServerSupabase();
	const { data, error } = await supabase
		.from('admin_users')
		.select('id,email,role,display_name,created_at')
		.order('created_at', { ascending: false });

	if (error) return json({ message: error.message }, { status: 500 });
	return json({ employees: data ?? [] });
}

export async function POST(event: RequestEvent) {
	const unauthorized = ensureSuperAdmin(event);
	if (unauthorized) return unauthorized;
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	let payload: unknown;
	try {
		payload = await event.request.json();
	} catch {
		return json({ message: 'Payload không hợp lệ' }, { status: 400 });
	}

	const parsed = employeeSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' }, { status: 400 });
	}

	const actorRole = event.locals.adminUser!.role as AdminRole;
	if (!canManageRole(actorRole, parsed.data.role)) {
		return json({ message: 'Không thể tạo nhân viên với vai trò này' }, { status: 403 });
	}

	const supabase = createServerSupabase();
	const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
		email: parsed.data.email,
		password: parsed.data.password,
		email_confirm: true
	});
	if (authError || !createdAuth.user) {
		return json({ message: authError?.message ?? 'Không thể tạo tài khoản' }, { status: 500 });
	}

	const { data, error } = await supabase
		.from('admin_users')
		.insert({
			id: createdAuth.user.id,
			email: parsed.data.email,
			role: parsed.data.role,
			display_name: parsed.data.displayName ?? null
		})
		.select('id,email,role,display_name,created_at')
		.single();

	if (error) {
		await supabase.auth.admin.deleteUser(createdAuth.user.id);
		return json({ message: error.message }, { status: 500 });
	}

	return json({ employee: data }, { status: 201 });
}
