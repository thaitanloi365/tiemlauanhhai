import { json } from '@sveltejs/kit';
import { getMenuData } from '$lib/server/menu';

export async function GET() {
	const { categories, menuItems, source } = await getMenuData();
	return json({ categories, menuItems, source });
}
