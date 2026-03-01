import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { sampleCategories, sampleMenuItems } from '$lib/sample-data';
import { toSlug } from '$lib/utils/format';

export async function GET() {
	if (!hasSupabaseConfig()) {
		return json({ items: sampleMenuItems, categories: sampleCategories });
	}
	const supabase = createServerSupabase();
	const [{ data: items, error: itemsError }, { data: variants }, { data: media }, { data: categories }] = await Promise.all([
		supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
		supabase.from('menu_variants').select('*').order('price', { ascending: true }),
		supabase.from('menu_media').select('*').order('sort_order', { ascending: true }),
		supabase.from('categories').select('*').order('sort_order', { ascending: true })
	]);
	if (itemsError) return json({ message: itemsError.message }, { status: 500 });

	const variantsByItem = new Map<string, any[]>();
	for (const variant of variants ?? []) {
		const list = variantsByItem.get(variant.menu_item_id) ?? [];
		list.push(variant);
		variantsByItem.set(variant.menu_item_id, list);
	}

	const mediaByItem = new Map<string, any[]>();
	for (const entry of media ?? []) {
		const list = mediaByItem.get(entry.menu_item_id) ?? [];
		list.push(entry);
		mediaByItem.set(entry.menu_item_id, list);
	}

	return json({
		categories: categories ?? [],
		items: (items ?? []).map((item) => ({
			...item,
			variants: variantsByItem.get(item.id) ?? [],
			media: mediaByItem.get(item.id) ?? []
		}))
	});
}

export async function POST({ request }) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}
	const body = await request.json();
	const supabase = createServerSupabase();
	const { data, error } = await supabase
		.from('menu_items')
		.insert({
			category_id: body.categoryId,
			name: body.name,
			slug: toSlug(body.name),
			description: body.description ?? null,
			ingredients: body.ingredients ?? null,
			thumbnail_url: body.thumbnailUrl ?? null,
			is_available: true,
			is_topping: Boolean(body.isTopping),
			sort_order: Number(body.sortOrder ?? 0)
		})
		.select('*')
		.single();
	if (error) return json({ message: error.message }, { status: 500 });

	if (Array.isArray(body.media) && body.media.length > 0) {
		const { error: mediaError } = await supabase.from('menu_media').insert(
			body.media.map((entry: any, index: number) => ({
				menu_item_id: data.id,
				type: entry.type,
				url: entry.url,
				alt_text: entry.altText ?? null,
				sort_order: index + 1
			}))
		);
		if (mediaError) return json({ message: mediaError.message }, { status: 500 });
	}

	return json({ item: data });
}
