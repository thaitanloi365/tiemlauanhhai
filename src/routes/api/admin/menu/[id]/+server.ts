import { json, type RequestEvent } from '@sveltejs/kit';
import { createServerSupabase, deleteStorageFiles, hasSupabaseConfig } from '$lib/server/supabase';
import { toSlug } from '$lib/utils/format';

export async function PATCH({ params, request }: RequestEvent) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const body = await request.json();
	const supabase = createServerSupabase();
	const [{ data: existingItem, error: existingItemError }, { data: existingMedia, error: existingMediaError }] =
		await Promise.all([
			supabase.from('menu_items').select('thumbnail_url').eq('id', params.id).maybeSingle(),
			supabase.from('menu_media').select('url').eq('menu_item_id', params.id)
		]);

	if (existingItemError) {
		return json({ message: existingItemError.message }, { status: 500 });
	}
	if (existingMediaError) {
		return json({ message: existingMediaError.message }, { status: 500 });
	}

	const { error } = await supabase
		.from('menu_items')
		.update({
			category_id: body.categoryId,
			name: body.name,
			slug: body.name ? toSlug(body.name) : undefined,
			description: body.description,
			ingredients: body.ingredients,
			note: body.note,
			preparation_time_minutes: body.preparationTimeMinutes,
			thumbnail_url: body.thumbnailUrl,
			is_available: body.isAvailable,
			is_topping: body.isTopping,
			sort_order: body.sortOrder
		})
		.eq('id', params.id);
	if (error) return json({ message: error.message }, { status: 500 });

	if (Array.isArray(body.media)) {
		const { error: deleteMediaError } = await supabase.from('menu_media').delete().eq('menu_item_id', params.id);
		if (deleteMediaError) return json({ message: deleteMediaError.message }, { status: 500 });

		if (body.media.length > 0) {
			const { error: insertMediaError } = await supabase.from('menu_media').insert(
				body.media.map((entry: any, index: number) => ({
					menu_item_id: params.id,
					type: entry.type,
					url: entry.url,
					alt_text: entry.altText ?? null,
					sort_order: index + 1
				}))
			);
			if (insertMediaError) return json({ message: insertMediaError.message }, { status: 500 });
		}
	}

	const oldUrls = new Set<string>();
	if (typeof existingItem?.thumbnail_url === 'string' && existingItem.thumbnail_url.length > 0) {
		oldUrls.add(existingItem.thumbnail_url);
	}
	for (const entry of existingMedia ?? []) {
		if (typeof entry.url === 'string' && entry.url.length > 0) {
			oldUrls.add(entry.url);
		}
	}

	const newUrls = new Set<string>();
	if (typeof body.thumbnailUrl === 'string' && body.thumbnailUrl.length > 0) {
		newUrls.add(body.thumbnailUrl);
	}
	if (Array.isArray(body.media)) {
		for (const entry of body.media) {
			if (typeof entry?.url === 'string' && entry.url.length > 0) {
				newUrls.add(entry.url);
			}
		}
	}

	const removedUrls = Array.from(oldUrls).filter((url) => !newUrls.has(url));
	await deleteStorageFiles(removedUrls);

	return json({ ok: true });
}

export async function DELETE({ params }: RequestEvent) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}
	const supabase = createServerSupabase();
	const [{ data: existingItem, error: existingItemError }, { data: existingMedia, error: existingMediaError }] =
		await Promise.all([
			supabase.from('menu_items').select('thumbnail_url').eq('id', params.id).maybeSingle(),
			supabase.from('menu_media').select('url').eq('menu_item_id', params.id)
		]);
	if (existingItemError) return json({ message: existingItemError.message }, { status: 500 });
	if (existingMediaError) return json({ message: existingMediaError.message }, { status: 500 });

	const { error } = await supabase.from('menu_items').delete().eq('id', params.id);
	if (error) return json({ message: error.message }, { status: 500 });

	const urlsToDelete: string[] = [];
	if (typeof existingItem?.thumbnail_url === 'string' && existingItem.thumbnail_url.length > 0) {
		urlsToDelete.push(existingItem.thumbnail_url);
	}
	for (const entry of existingMedia ?? []) {
		if (typeof entry.url === 'string' && entry.url.length > 0) {
			urlsToDelete.push(entry.url);
		}
	}

	await deleteStorageFiles(urlsToDelete);

	return json({ ok: true });
}
