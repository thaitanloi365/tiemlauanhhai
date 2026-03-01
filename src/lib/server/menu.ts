import { sampleCategories, sampleMenuItems } from '$lib/sample-data';
import type { Category, MenuItem, MenuMedia, MenuVariant } from '$lib/types';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';

export async function getMenuData() {
	if (!hasSupabaseConfig()) {
		return {
			source: 'sample' as const,
			categories: sampleCategories,
			menuItems: sampleMenuItems
		};
	}

	const supabase = createServerSupabase();
	const [{ data: categories }, { data: items }, { data: variants }, { data: media }] = await Promise.all([
		supabase.from('categories').select('*').order('sort_order', { ascending: true }),
		supabase.from('menu_items').select('*').eq('is_available', true).order('sort_order', { ascending: true }),
		supabase.from('menu_variants').select('*').order('price', { ascending: true }),
		supabase.from('menu_media').select('*').order('sort_order', { ascending: true })
	]);

	const variantsByItem = new Map<string, MenuVariant[]>();
	for (const variant of (variants ?? []) as MenuVariant[]) {
		const group = variantsByItem.get(variant.menu_item_id) ?? [];
		group.push(variant);
		variantsByItem.set(variant.menu_item_id, group);
	}

	const mediaByItem = new Map<string, MenuMedia[]>();
	for (const itemMedia of (media ?? []) as MenuMedia[]) {
		const group = mediaByItem.get(itemMedia.menu_item_id) ?? [];
		group.push(itemMedia);
		mediaByItem.set(itemMedia.menu_item_id, group);
	}

	const menuItems: MenuItem[] = ((items ?? []) as Omit<MenuItem, 'variants' | 'media'>[]).map((item) => ({
		...item,
		variants: variantsByItem.get(item.id) ?? [],
		media: mediaByItem.get(item.id) ?? []
	}));

	return {
		source: 'supabase' as const,
		categories: (categories ?? []) as Category[],
		menuItems
	};
}

export async function getMenuItemBySlug(slug: string) {
	const menu = await getMenuData();
	const categoryById = new Map(menu.categories.map((category) => [category.id, category.slug]));
	const item = menu.menuItems.find((entry) => entry.slug === slug);
	const relatedItems = menu.menuItems
		.filter((entry) => entry.category_id === item?.category_id && entry.id !== item?.id)
		.slice(0, 4);
	const toppings = menu.menuItems.filter(
		(entry) => categoryById.get(entry.category_id) === 'topping' && entry.variants.length > 0
	);
	const drinks = menu.menuItems.filter(
		(entry) => categoryById.get(entry.category_id) === 'do-uong' && entry.variants.length > 0
	);

	return {
		...menu,
		item,
		relatedItems,
		toppings,
		drinks
	};
}
