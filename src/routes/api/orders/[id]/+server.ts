import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { mockDb } from '$lib/server/mock-db';
import { adminOrderUpdateSchema } from '$lib/utils/validation';
import { ADMIN_COOKIE_NAME, getAdminByUserId, type AdminUser } from '$lib/server/admin-auth';
import type { RequestEvent } from '@sveltejs/kit';

async function resolveAdminUser(locals: App.Locals, cookies: { get: (name: string) => string | undefined }): Promise<AdminUser | null> {
	if (locals.adminUser) return locals.adminUser;

	const token = cookies.get(ADMIN_COOKIE_NAME);
	if (!token || !hasSupabaseConfig()) return null;

	const supabase = createServerSupabase();
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) return null;
	return getAdminByUserId(data.user.id);
}

export async function GET({ params, url, locals, cookies }: RequestEvent<{ id: string }>) {
	const sessionId = url.searchParams.get('sessionId');
	const isAdmin = url.searchParams.get('admin') === '1';
	const adminUser = isAdmin ? await resolveAdminUser(locals, cookies) : null;
	if (isAdmin && !adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!sessionId && !isAdmin) return json({ message: 'Thiếu sessionId' }, { status: 400 });

	if (!hasSupabaseConfig()) {
		const detail = mockDb.getOrderDetail(params.id, isAdmin ? undefined : sessionId ?? '');
		if (!detail) return json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
		return json(detail);
	}

	const supabase = createServerSupabase();
	let orderRequest = supabase.from('orders').select('*').eq('id', params.id);
	if (!isAdmin) orderRequest = orderRequest.eq('session_id', sessionId!);
	const { data: order, error: orderError } = await orderRequest.single();
	if (orderError || !order) return json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });

	const [{ data: items }, { data: logs }, { data: review }] = await Promise.all([
		supabase
			.from('order_items')
			.select('*,menu_variant:menu_variants(*,menu_item:menu_items(id,name,slug,thumbnail_url))')
			.eq('order_id', order.id),
		supabase.from('order_status_logs').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
		supabase.from('reviews').select('*').eq('order_id', order.id).maybeSingle()
	]);

	return json({ order, items: items ?? [], logs: logs ?? [], review: review ?? null });
}

export async function PATCH({ params, request, locals, cookies }: RequestEvent) {
	const adminUser = await resolveAdminUser(locals, cookies);
	if (!adminUser) return json({ message: 'Unauthorized' }, { status: 401 });

	const parsed = adminOrderUpdateSchema.safeParse(await request.json());
	if (!parsed.success) return json({ message: 'Payload không hợp lệ' }, { status: 400 });

	if (!hasSupabaseConfig()) {
		const updated = mockDb.updateOrder(params.id ?? '', {
			status: parsed.data.status,
			tracking_id: parsed.data.trackingId ?? null,
			tracking_url: parsed.data.trackingUrl ?? null
		});
		if (!updated) return json({ message: 'Không tìm thấy đơn' }, { status: 404 });
		return json({ ok: true });
	}

	const supabase = createServerSupabase();
	const { error } = await supabase
		.from('orders')
		.update({
			status: parsed.data.status,
			tracking_id: parsed.data.trackingId ?? null,
			tracking_url: parsed.data.trackingUrl ?? null
		})
		.eq('id', params.id);

	if (error) return json({ message: error.message }, { status: 500 });

	await supabase.from('order_status_logs').insert({
		order_id: params.id,
		status: parsed.data.status,
		note: 'Cập nhật từ admin'
	});

	return json({ ok: true });
}
