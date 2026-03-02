import { json, type RequestEvent } from '@sveltejs/kit';
import { createServerSupabase, deleteStorageFiles, hasSupabaseConfig } from '$lib/server/supabase';
import { toSlug } from '$lib/utils/format';

type VariantPayload = {
	name: string;
	price: number;
	serves_min: number | null;
	serves_max: number | null;
	is_default: boolean;
};

function normalizeVariants(input: any[]): VariantPayload[] {
	const normalized = input
		.map((entry) => ({
			name: typeof entry?.name === 'string' ? entry.name.trim() : '',
			price: Number(entry?.price),
			serves_min:
				entry?.servesMin === null || entry?.servesMin === undefined || entry?.servesMin === ''
					? null
					: Number(entry.servesMin),
			serves_max:
				entry?.servesMax === null || entry?.servesMax === undefined || entry?.servesMax === ''
					? null
					: Number(entry.servesMax),
			is_default: Boolean(entry?.isDefault)
		}))
		.filter((entry) => entry.name.length > 0 && Number.isFinite(entry.price) && entry.price >= 0)
		.map((entry) => ({
			...entry,
			price: Math.round(entry.price),
			serves_min: entry.serves_min === null || !Number.isFinite(entry.serves_min) ? null : Math.round(entry.serves_min),
			serves_max: entry.serves_max === null || !Number.isFinite(entry.serves_max) ? null : Math.round(entry.serves_max)
		}));

	if (normalized.length === 0) return [];

	let defaultIndex = normalized.findIndex((entry) => entry.is_default);
	if (defaultIndex < 0) defaultIndex = 0;
	return normalized.map((entry, index) => ({
		...entry,
		is_default: index === defaultIndex
	}));
}

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

	if (Array.isArray(body.variants)) {
		const normalizedVariants = normalizeVariants(body.variants);
		const variantsToInsert =
			normalizedVariants.length > 0
				? normalizedVariants
				: [
						{
							name: 'Mặc định',
							price: 0,
							serves_min: null,
							serves_max: null,
							is_default: true
						}
					];
		const { error: deleteVariantsError } = await supabase.from('menu_variants').delete().eq('menu_item_id', params.id);
		if (deleteVariantsError) return json({ message: deleteVariantsError.message }, { status: 500 });

		const { error: insertVariantsError } = await supabase.from('menu_variants').insert(
			variantsToInsert.map((entry) => ({
				menu_item_id: params.id,
				name: entry.name,
				price: entry.price,
				serves_min: entry.serves_min,
				serves_max: entry.serves_max,
				is_default: entry.is_default
			}))
		);
		if (insertVariantsError) return json({ message: insertVariantsError.message }, { status: 500 });
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

	const [
		{ data: updatedItem, error: updatedItemError },
		{ data: updatedVariants, error: updatedVariantsError },
		{ data: updatedMedia, error: updatedMediaError }
	] = await Promise.all([
		supabase.from('menu_items').select('*').eq('id', params.id).maybeSingle(),
		supabase.from('menu_variants').select('*').eq('menu_item_id', params.id).order('price', { ascending: true }),
		supabase.from('menu_media').select('*').eq('menu_item_id', params.id).order('sort_order', { ascending: true })
	]);
	if (updatedItemError) return json({ message: updatedItemError.message }, { status: 500 });
	if (updatedVariantsError) return json({ message: updatedVariantsError.message }, { status: 500 });
	if (updatedMediaError) return json({ message: updatedMediaError.message }, { status: 500 });

	return json({
		ok: true,
		item: {
			...(updatedItem ?? {}),
			variants: updatedVariants ?? [],
			media: updatedMedia ?? []
		}
	});
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
