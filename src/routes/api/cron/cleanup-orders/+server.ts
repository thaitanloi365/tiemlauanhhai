import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRE_AFTER_MS = DAY_MS;
const DELETE_AFTER_EXPIRED_MS = 7 * DAY_MS;

function isAuthorized(request: Request, secret: string | undefined) {
	if (!secret) return false;
	const authHeader = request.headers.get('authorization');
	return authHeader === `Bearer ${secret}`;
}

export async function GET({ request }: RequestEvent) {
	if (!isAuthorized(request, env.CRON_SECRET)) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	if (!hasSupabaseConfig()) {
		return json({
			ok: true,
			markedExpiredCount: 0,
			deletedExpiredCount: 0,
			message: 'Supabase chưa được cấu hình, bỏ qua cron cleanup.'
		});
	}

	const now = new Date();
	const nowIso = now.toISOString();
	const expireCutoffIso = new Date(now.getTime() - EXPIRE_AFTER_MS).toISOString();
	const deleteCutoffIso = new Date(now.getTime() - DELETE_AFTER_EXPIRED_MS).toISOString();
	const supabase = createServerSupabase();

	const { data: markedRows, error: markError } = await supabase
		.from('orders')
		.update({
			expired_at: nowIso,
			updated_at: nowIso
		})
		.eq('status', 'pending')
		.is('expired_at', null)
		.lt('created_at', expireCutoffIso)
		.select('id');

	if (markError) return json({ message: markError.message }, { status: 500 });

	const markedOrderIds = (markedRows ?? []).map((row) => row.id as string);
	if (markedOrderIds.length > 0) {
		const logs = markedOrderIds.map((orderId) => ({
			order_id: orderId,
			status: 'pending' as const,
			note: 'Đơn hàng đã quá 24 giờ ở trạng thái chờ xác nhận.'
		}));
		const { error: logError } = await supabase.from('order_status_logs').insert(logs);
		if (logError) return json({ message: logError.message }, { status: 500 });
	}

	const { data: deletedRows, error: deleteError } = await supabase
		.from('orders')
		.delete()
		.lt('expired_at', deleteCutoffIso)
		.select('id');

	if (deleteError) return json({ message: deleteError.message }, { status: 500 });

	return json({
		ok: true,
		markedExpiredCount: markedOrderIds.length,
		deletedExpiredCount: (deletedRows ?? []).length
	});
}
