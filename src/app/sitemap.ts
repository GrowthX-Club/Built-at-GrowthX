import { MetadataRoute } from 'next';

const SITE_URL = 'https://built.growthx.club';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/builders`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/building`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/cities`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE}/bx/projects?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const projects = data.projects || data || [];
      projectRoutes = projects.map((p: { _id?: string; id?: string; updatedAt?: string; createdAt?: string }) => ({
        url: `${SITE_URL}/projects/${p._id || p.id}`,
        lastModified: p.updatedAt || p.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // If API is unavailable, return static routes only
  }

  return [...staticRoutes, ...projectRoutes];
}
