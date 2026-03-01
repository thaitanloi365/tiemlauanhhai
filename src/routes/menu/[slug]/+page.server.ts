import { error } from '@sveltejs/kit';
import { MENU_IMAGE } from '$lib/constants/assets';
import { getMenuItemBySlug } from '$lib/server/menu';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const { item, relatedItems, toppings, drinks, categories } = await getMenuItemBySlug(params.slug);
	if (!item) {
		throw error(404, 'Không tìm thấy món ăn');
	}

	const canonical = `${url.origin}/menu/${item.slug}`;
	const categoryById = new Map(categories.map((category) => [category.id, category.slug]));
	return {
		item,
		relatedItems,
		toppings,
		drinks,
		isLauItem: categoryById.get(item.category_id) === 'lau',
		seo: {
			title: `${item.name} | Tiệm Lẩu Anh Hai`,
			description: item.description ?? `Chi tiết món ${item.name} tại Tiệm Lẩu Anh Hai`,
			image: item.thumbnail_url || MENU_IMAGE,
			url: canonical
		}
	};
};
