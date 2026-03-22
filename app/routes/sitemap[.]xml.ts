import type { LoaderFunctionArgs } from "react-router";

const SITE_URL = "https://built.growthx.club";
const API_BASE = typeof process !== "undefined" && process.env?.VITE_API_URL
  ? process.env.VITE_API_URL
  : "http://localhost:8000/api/v1";

export async function loader({ request }: LoaderFunctionArgs) {
  const staticRoutes = [
    { url: SITE_URL, changefreq: "daily", priority: "1.0" },
    { url: `${SITE_URL}/projects`, changefreq: "daily", priority: "0.9" },
    { url: `${SITE_URL}/builders`, changefreq: "weekly", priority: "0.7" },
    { url: `${SITE_URL}/building`, changefreq: "daily", priority: "0.6" },
    { url: `${SITE_URL}/cities`, changefreq: "weekly", priority: "0.5" },
  ];

  let projectRoutes: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = [];
  try {
    const res = await fetch(`${API_BASE}/bx/projects?limit=500`);
    if (res.ok) {
      const data = await res.json();
      const projects = data.projects || data || [];
      projectRoutes = projects.map((p: { slug?: string; _id?: string; id?: string; updatedAt?: string; createdAt?: string }) => ({
        url: `${SITE_URL}/projects/${p.slug || p._id || p.id}`,
        lastmod: (p.updatedAt || p.createdAt || new Date().toISOString()).split("T")[0],
        changefreq: "weekly",
        priority: "0.8",
      }));
    }
  } catch {
    // If API is unavailable, return static routes only
  }

  const now = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map(
    (r) => `  <url>
    <loc>${r.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
${projectRoutes
  .map(
    (r) => `  <url>
    <loc>${r.url}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
