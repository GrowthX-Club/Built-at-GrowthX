import { bxApi } from "@/lib/api";
import { SITE_URL, COLLECTIONS, fetchAllProjects } from "@/lib/collections";

type Entry = { loc: string; lastmod?: string };

/** Every project slug (+ updated date): GET /bx/sitemap when live, else page through /bx/projects. */
async function projectEntries(): Promise<Entry[]> {
  try {
    const r = await bxApi("/sitemap");
    if (r.ok) {
      const d = await r.json();
      const rows = (d.projects ?? []) as { slug?: string; _id?: string; updated_at?: string }[];
      if (rows.length) return rows.map(p => ({ loc: `${SITE_URL}/projects/${p.slug || p._id}`, lastmod: p.updated_at }));
    }
  } catch { /* fall back */ }
  const { projects } = await fetchAllProjects({ sort: "new" });
  return projects.map(p => ({
    loc: `${SITE_URL}/projects/${p.slug || p._id}`,
    lastmod: (p.updated_at || p.created_at) as string | undefined,
  }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function loader() {
  const pages: Entry[] = [
    { loc: SITE_URL },
    { loc: `${SITE_URL}/events` },
    { loc: `${SITE_URL}/skills` },
    { loc: `${SITE_URL}/builders` },
    ...COLLECTIONS.flatMap(c => [
      { loc: `${SITE_URL}${c.path}` },
      ...(c.seasons ?? []).map(s => ({ loc: `${SITE_URL}${c.path}?season=${s.key}` })),
    ]),
    ...(await projectEntries()),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${esc(p.loc)}</loc>${p.lastmod ? `<lastmod>${p.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
