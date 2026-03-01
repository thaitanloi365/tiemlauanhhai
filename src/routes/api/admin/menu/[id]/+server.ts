import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { toSlug } from '$lib/utils/format';

export async function PATCH({ params, request }) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const body = await request.json();
	const supabase = createServerSupabase();
	const { error } = await supabase
		.from('menu_items')
		.update({
			category_id: body.categoryId,
			name: body.name,
			slug: body.name ? toSlug(body.name) : undefined,
			description: body.description,
			ingredients: body.ingredients,
			thumbnail_url: body.thumbnailUrl,
			is_available: body.isAvailable,
			is_topping: body.isTopping,
			sort_order: body.sortOrder
		})
		.eq('id', params.id);
	if (error) return json({ message: error.message }, { status: 500 });

	if (Array.isArray(body.media)) {
		await supabase.from('menu_media').delete().eq('menu_item_id', params.id);
		if (body.media.length > 0) {
			await supabase.from('menu_media').insert(
				body.media.map((entry: any, index: number) => ({
					menu_item_id: params.id,
					type: entry.type,
					url: entry.url,
					alt_text: entry.altText ?? null,
					sort_order: index + 1
				}))
			);
		}
	}
	return json({ ok: true });
}

export async function DELETE({ params }) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}
	const supabase = createServerSupabase();
	const { error } = await supabase.from('menu_items').delete().eq('id', params.id);
	if (error) return json({ message: error.message }, { status: 500 });
	return json({ ok: true });
}
