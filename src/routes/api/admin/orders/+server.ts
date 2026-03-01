import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { mockDb } from '$lib/server/mock-db';

export async function GET({ url }) {
	const status = url.searchParams.get('status');
	const query = url.searchParams.get('q')?.trim().toLowerCase();

	if (!hasSupabaseConfig()) {
		const stats = mockDb.getAdminStats();
		let orders = mockDb.getAllOrders();
		if (status) orders = orders.filter((order) => order.status === status);
		if (query) {
			orders = orders.filter(
				(order) =>
					order.customer_name.toLowerCase().includes(query) || order.phone.toLowerCase().includes(query)
			);
		}
		return json({ stats, orders });
	}

	const supabase = createServerSupabase();
	let request = supabase.from('orders').select('*').order('created_at', { ascending: false });
	if (status) request = request.eq('status', status);
	if (query) request = request.or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%`);

	const { data: orders, error } = await request;
	if (error) return json({ message: error.message }, { status: 500 });

	const stats = {
		total: orders?.length ?? 0,
		pending: (orders ?? []).filter((order) => order.status === 'pending').length,
		preparing: (orders ?? []).filter((order) => order.status === 'preparing').length,
		delivered: (orders ?? []).filter((order) => order.status === 'delivered').length
	};
	return json({ stats, orders });
}
