import type { MetadataRoute } from 'next';
import { getMenuData } from '@/lib/server/menu';

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const { menuItems } = await getMenuData();

  const itemRoutes: MetadataRoute.Sitemap = menuItems.map((item) => ({
    url: `${siteUrl}/menu/${item.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/menu`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...itemRoutes,
  ];
}
