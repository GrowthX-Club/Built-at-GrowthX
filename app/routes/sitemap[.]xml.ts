import { bxApi } from "@/lib/api";
import { SITE_URL, fetchAllProjects, fetchCollectionStats, listedCollections, defaultSeason, serverSignal } from "@/lib/collections";

type Entry = { loc: string; lastmod?: string };

/** Every project slug (+ updated date) from GET /bx/sitemap, else by paging /bx/projects; null if either falls short. */
async function projectEntries(): Promise<Entry[] | null> {
  try {
    const r = await bxApi("/sitemap", { signal: serverSignal() });
    if (r.ok) {
      const d = await r.json();
      const rows = (d.projects ?? []) as { slug?: string; _id?: string; updated_at?: string }[];
      if (rows.length) return rows.map(p => ({ loc: `${SITE_URL}/projects/${p.slug || p._id}`, lastmod: p.updated_at }));
    }
  } catch { /* fall back */ }
  const all = await fetchAllProjects({ sort: "new" });
  if (all.error || all.projects.length < all.totalCount || all.totalCount === 0) return null;
  return all.projects.map(p => ({
    loc: `${SITE_URL}/projects/${p.slug || p._id}`,
    lastmod: (p.updated_at || p.created_at) as string | undefined,
  }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function loader() {
  const [projects, stats] = await Promise.all([projectEntries(), fetchCollectionStats()]);
  // A partial sitemap would tell search engines pages are gone: say "try later" instead.
  if (!projects || stats.error) {
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
  }
  const pages: Entry[] = [
    { loc: SITE_URL },
    { loc: `${SITE_URL}/events` },
    { loc: `${SITE_URL}/skills` },
    { loc: `${SITE_URL}/builders` },
    ...listedCollections(stats).flatMap(c => [
      { loc: `${SITE_URL}${c.path}` },
      // The default season is the collection page itself; only the others get their own URL.
      ...(c.seasons ?? []).filter(s => s !== defaultSeason(c, stats) && (stats.tags[s.tag]?.count ?? 0) > 0)
        .map(s => ({ loc: `${SITE_URL}${c.path}?season=${s.key}` })),
    ]),
    ...projects,
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${esc(p.loc)}</loc>${p.lastmod ? `<lastmod>${p.lastmod.slice(0, 10)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
