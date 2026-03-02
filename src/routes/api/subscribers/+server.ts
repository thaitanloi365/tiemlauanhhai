import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { subscriberSchema } from '$lib/utils/validation';

export async function POST({ request }: RequestEvent) {
	const payload = await request.json();
	const parsed = subscriberSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 });
	}

	if (!hasSupabaseConfig()) {
		return json({ message: 'Đã ghi nhận đăng ký nhận thông báo.' });
	}

	const body = parsed.data;
	const supabase = createServerSupabase();
	const { error } = await supabase.from('area_subscribers').upsert(
		{
			email: body.email,
			province: body.province,
			district: body.district ?? null
		},
		{ onConflict: 'email,province' }
	);
	if (error) {
		return json({ message: error.message }, { status: 500 });
	}

	return json({ message: 'Đã ghi nhận đăng ký nhận thông báo.' });
}
