import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings', '/my-projects', '/login'],
    },
    sitemap: 'https://built.growthx.club/sitemap.xml',
  };
}
