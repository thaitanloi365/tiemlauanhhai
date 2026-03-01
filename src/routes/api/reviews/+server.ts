import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { mockDb } from '$lib/server/mock-db';
import { reviewSchema } from '$lib/utils/validation';

export async function POST({ request }) {
	const parsed = reviewSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' }, { status: 400 });
	}

	const body = parsed.data;

	if (!hasSupabaseConfig()) {
		const detail = mockDb.getOrderDetail(body.orderId, body.sessionId);
		if (!detail) return json({ message: 'Đơn hàng không hợp lệ' }, { status: 403 });
		if (detail.order.status !== 'delivered') {
			return json({ message: 'Chỉ đánh giá được đơn đã giao' }, { status: 400 });
		}
		const ok = mockDb.createReview({
			id: crypto.randomUUID(),
			order_id: body.orderId,
			session_id: body.sessionId,
			rating: body.rating,
			comment: body.comment,
			created_at: new Date().toISOString()
		});
		if (!ok) return json({ message: 'Đơn này đã được đánh giá' }, { status: 400 });
		return json({ ok: true });
	}

	const supabase = createServerSupabase();
	const { data: order, error: orderError } = await supabase
		.from('orders')
		.select('id,status,session_id')
		.eq('id', body.orderId)
		.single();
	if (orderError || !order) return json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
	if (order.session_id !== body.sessionId) return json({ message: 'Session không khớp đơn hàng' }, { status: 403 });
	if (order.status !== 'delivered') return json({ message: 'Chỉ đánh giá được đơn đã giao' }, { status: 400 });

	const { error } = await supabase.from('reviews').insert({
		order_id: body.orderId,
		session_id: body.sessionId,
		rating: body.rating,
		comment: body.comment
	});
	if (error) return json({ message: error.message }, { status: 500 });
	return json({ ok: true });
}
