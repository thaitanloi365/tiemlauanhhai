import { getMenuData } from '$lib/server/menu';
import type { PageServerLoad } from './$types';

function inPriceRange(price: number, range: string) {
	if (!range) return true;
	if (range === 'lt50') return price < 50000;
	if (range === '50to100') return price >= 50000 && price <= 100000;
	if (range === '100to200') return price > 100000 && price <= 200000;
	if (range === 'gt200') return price > 200000;
	return true;
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'
	});

	const category = 'lau';
	const price = url.searchParams.get('price') ?? '';
	const sort = url.searchParams.get('sort') ?? 'popular';

	const { categories, menuItems, source } = await getMenuData();
	const categoryById = new Map(categories.map((entry) => [entry.id, entry.slug]));

	let filtered = menuItems.filter((item) => {
		if (category && categoryById.get(item.category_id) !== category) return false;
		const lowest = Math.min(...item.variants.map((variant) => variant.price));
		return inPriceRange(lowest, price);
	});

	if (sort === 'price_asc') {
		filtered = filtered.sort(
			(a, b) =>
				Math.min(...a.variants.map((variant) => variant.price)) -
				Math.min(...b.variants.map((variant) => variant.price))
		);
	} else if (sort === 'price_desc') {
		filtered = filtered.sort(
			(a, b) =>
				Math.max(...b.variants.map((variant) => variant.price)) -
				Math.max(...a.variants.map((variant) => variant.price))
		);
	}

	return {
		source,
		categories,
		menuItems: filtered,
		filters: { category, price, sort }
	};
};
