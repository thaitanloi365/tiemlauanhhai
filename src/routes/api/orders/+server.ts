import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { mockDb } from '$lib/server/mock-db';
import { sampleCategories, sampleMenuItems } from '$lib/sample-data';
import { orderSchema } from '$lib/utils/validation';
import type { Order, OrderItem } from '$lib/types';

export async function GET({ url }) {
	const sessionId = url.searchParams.get('sessionId');
	if (!sessionId) return json({ message: 'Thiếu sessionId' }, { status: 400 });

	if (!hasSupabaseConfig()) {
		return json({ orders: mockDb.getOrdersBySession(sessionId) });
	}

	const supabase = createServerSupabase();
	const { data, error } = await supabase
		.from('orders')
		.select('*')
		.eq('session_id', sessionId)
		.order('created_at', { ascending: false });

	if (error) return json({ message: error.message }, { status: 500 });
	return json({ orders: data });
}

export async function POST({ request }) {
	const payload = await request.json();
	const parsed = orderSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 });
	}

	const body = parsed.data;

	if (!hasSupabaseConfig()) {
		const categoryById = new Map(sampleCategories.map((category) => [category.id, category.slug]));
		const itemByVariantId = new Map(
			sampleMenuItems.flatMap((item) => item.variants.map((variant) => [variant.id, item]))
		);
		const hasLauItem = body.items.some((item) => {
			const menuItem = itemByVariantId.get(item.variantId);
			return menuItem ? categoryById.get(menuItem.category_id) === 'lau' : false;
		});
		if (!hasLauItem) {
			return json({ message: 'Vui lòng chọn ít nhất 1 món lẩu cho đơn hàng.' }, { status: 400 });
		}

		const variantPriceMap = new Map(
			sampleMenuItems.flatMap((item) => item.variants.map((variant) => [variant.id, variant.price]))
		);
		const now = new Date().toISOString();
		const order: Order = {
			id: crypto.randomUUID(),
			session_id: body.sessionId,
			customer_name: body.customerName,
			phone: body.phone,
			address: body.address,
			province: body.province,
			district: body.district,
			ward: body.ward,
			note: body.note ?? null,
			total_amount: body.items.reduce(
				(sum, item) => sum + item.quantity * (variantPriceMap.get(item.variantId) ?? 10000),
				0
			),
			status: 'pending',
			tracking_id: null,
			tracking_url: null,
			created_at: now,
			updated_at: now
		};
		const orderItems: OrderItem[] = body.items.map((item) => ({
			id: crypto.randomUUID(),
			order_id: order.id,
			menu_variant_id: item.variantId,
			quantity: item.quantity,
			unit_price: variantPriceMap.get(item.variantId) ?? 10000
		}));
		mockDb.createOrder(order, orderItems);
		return json({ orderId: order.id });
	}

	const supabase = createServerSupabase();
	const variantIds = body.items.map((item) => item.variantId);
	const { data: variants, error: variantsError } = await supabase
		.from('menu_variants')
		.select('id,price,menu_item_id')
		.in('id', variantIds);
	if (variantsError) return json({ message: variantsError.message }, { status: 500 });

	const menuItemIds = [...new Set((variants ?? []).map((variant) => variant.menu_item_id as string))];
	const { data: menuItems, error: menuItemsError } = await supabase
		.from('menu_items')
		.select('id,category_id')
		.in('id', menuItemIds);
	if (menuItemsError) return json({ message: menuItemsError.message }, { status: 500 });

	const categoryIds = [...new Set((menuItems ?? []).map((menuItem) => menuItem.category_id as string))];
	const { data: categories, error: categoriesError } = await supabase
		.from('categories')
		.select('id,slug')
		.in('id', categoryIds);
	if (categoriesError) return json({ message: categoriesError.message }, { status: 500 });

	const categoryById = new Map((categories ?? []).map((category) => [category.id as string, category.slug as string]));
	const itemById = new Map((menuItems ?? []).map((item) => [item.id as string, item.category_id as string]));
	const hasLauItem = (variants ?? []).some((variant) => {
		const categoryId = itemById.get(variant.menu_item_id as string);
		return categoryId ? categoryById.get(categoryId) === 'lau' : false;
	});
	if (!hasLauItem) {
		return json({ message: 'Vui lòng chọn ít nhất 1 món lẩu cho đơn hàng.' }, { status: 400 });
	}

	const priceByVariant = new Map((variants ?? []).map((variant) => [variant.id, variant.price as number]));
	const totalAmount = body.items.reduce(
		(sum, item) => sum + (priceByVariant.get(item.variantId) ?? 0) * item.quantity,
		0
	);

	const { data: order, error: orderError } = await supabase
		.from('orders')
		.insert({
			session_id: body.sessionId,
			customer_name: body.customerName,
			phone: body.phone,
			address: body.address,
			province: body.province,
			district: body.district,
			ward: body.ward,
			note: body.note,
			total_amount: totalAmount,
			status: 'pending'
		})
		.select('id')
		.single();

	if (orderError) return json({ message: orderError.message }, { status: 500 });

	const orderItems = body.items.map((item) => ({
		order_id: order.id,
		menu_variant_id: item.variantId,
		quantity: item.quantity,
		unit_price: priceByVariant.get(item.variantId) ?? 0
	}));
	const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
	if (itemsError) return json({ message: itemsError.message }, { status: 500 });

	await supabase.from('order_status_logs').insert({
		order_id: order.id,
		status: 'pending',
		note: 'Đơn hàng được tạo'
	});

	return json({ orderId: order.id });
}
