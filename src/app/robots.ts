import type { MetadataRoute } from 'next';

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/cart', '/orders'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
