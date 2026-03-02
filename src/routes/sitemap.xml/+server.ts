import { getMenuData } from '$lib/server/menu';
import type { RequestHandler } from './$types';

const staticPublicRoutes = ['/', '/menu'];

function toUrlTag(baseUrl: string, path: string, lastModified: string) {
	return `<url><loc>${baseUrl}${path}</loc><lastmod>${lastModified}</lastmod></url>`;
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const baseUrl = url.origin;
	const lastModified = new Date().toISOString();
	const { menuItems } = await getMenuData();

	const dynamicMenuRoutes = menuItems.map((item) => `/menu/${encodeURIComponent(item.slug)}`);
	const uniqueRoutes = Array.from(new Set([...staticPublicRoutes, ...dynamicMenuRoutes]));

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes.map((path) => toUrlTag(baseUrl, path, lastModified)).join('\n')}
</urlset>`;

	setHeaders({
		'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
	});

	return new Response(sitemap, {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
};
