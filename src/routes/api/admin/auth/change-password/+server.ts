import { json, type RequestEvent } from '@sveltejs/kit';
import { changePasswordSchema } from '$lib/utils/validation';
import {
	createServerSupabase,
	createServerSupabaseAuthClient,
	hasSupabaseConfig
} from '$lib/server/supabase';

export async function POST({ locals, request }: RequestEvent) {
	if (!locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ message: 'Payload không hợp lệ' }, { status: 400 });
	}

	const parsed = changePasswordSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' }, { status: 400 });
	}

	const authClient = createServerSupabaseAuthClient();
	const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
		email: locals.adminUser.email,
		password: parsed.data.currentPassword
	});
	if (signInError || !signInData.user) {
		return json({ message: 'Mật khẩu hiện tại không chính xác' }, { status: 401 });
	}

	const adminClient = createServerSupabase();
	const { error: updateError } = await adminClient.auth.admin.updateUserById(locals.adminUser.id, {
		password: parsed.data.newPassword
	});
	if (updateError) return json({ message: updateError.message }, { status: 500 });

	return json({ ok: true });
}
