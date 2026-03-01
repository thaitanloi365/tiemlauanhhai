import { json } from '@sveltejs/kit';
import { ADMIN_COOKIE_NAME, getAdminByUserId } from '$lib/server/admin-auth';
import { createServerSupabaseAuthClient, hasSupabaseConfig } from '$lib/server/supabase';
import { adminLoginSchema } from '$lib/utils/validation';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request, cookies, url }: RequestEvent) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const parsed = adminLoginSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Email hoặc mật khẩu không hợp lệ' }, { status: 400 });
	}

	const authClient = createServerSupabaseAuthClient();
	const { data, error } = await authClient.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password
	});
	if (error || !data.user || !data.session) {
		return json({ message: 'Sai email hoặc mật khẩu' }, { status: 401 });
	}

	const adminUser = await getAdminByUserId(data.user.id);
	if (!adminUser) {
		return json({ message: 'Tài khoản không có quyền admin' }, { status: 403 });
	}

	cookies.set(ADMIN_COOKIE_NAME, data.session.access_token, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: data.session.expires_in ?? 60 * 60
	});

	return json({
		ok: true,
		admin: {
			id: adminUser.id,
			email: adminUser.email,
			role: adminUser.role
		}
	});
}
