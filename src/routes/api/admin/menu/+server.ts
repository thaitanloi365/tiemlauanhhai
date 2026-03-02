import { json } from '@sveltejs/kit';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';
import { sampleCategories, sampleMenuItems } from '$lib/sample-data';
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
			note: body.note ?? null,
			preparation_time_minutes: body.preparationTimeMinutes ?? null,
			thumbnail_url: body.thumbnailUrl ?? null,
			is_available: true,
			is_topping: Boolean(body.isTopping),
			sort_order: Number(body.sortOrder ?? 0)
		})
		.select('*')
		.single();
	if (error) return json({ message: error.message }, { status: 500 });

	const variantsFromPayload = Array.isArray(body.variants) ? normalizeVariants(body.variants) : [];
	const variantsToInsert =
		variantsFromPayload.length > 0
			? variantsFromPayload
			: [
					{
						name: 'Mặc định',
						price: 0,
						serves_min: null,
						serves_max: null,
						is_default: true
					}
				];
	const { data: createdVariants, error: variantsError } = await supabase
		.from('menu_variants')
		.insert(
			variantsToInsert.map((entry) => ({
				menu_item_id: data.id,
				name: entry.name,
				price: entry.price,
				serves_min: entry.serves_min,
				serves_max: entry.serves_max,
				is_default: entry.is_default
			}))
		)
		.select('*');
	if (variantsError) return json({ message: variantsError.message }, { status: 500 });

	let createdMedia: any[] = [];
	if (Array.isArray(body.media) && body.media.length > 0) {
		const { data: insertedMedia, error: mediaError } = await supabase
			.from('menu_media')
			.insert(
				body.media.map((entry: any, index: number) => ({
					menu_item_id: data.id,
					type: entry.type,
					url: entry.url,
					alt_text: entry.altText ?? null,
					sort_order: index + 1
				}))
			)
			.select('*');
		if (mediaError) return json({ message: mediaError.message }, { status: 500 });
		createdMedia = insertedMedia ?? [];
	}

	return json({
		item: {
			...data,
			variants: createdVariants ?? [],
			media: createdMedia
		}
	});
}
