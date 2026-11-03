import { SITE_URL, COLLECTIONS, fetchProjects, fetchCollectionStats, collectionStat, dateRange, type RawProject } from "@/lib/collections";

// For AI answer engines: what Built at GrowthX is, its collections, the best projects and the skills, as plain links.
const line = (p: RawProject) =>
  `- [${p.name}](${SITE_URL}/projects/${p.slug || p._id})${p.tagline ? `: ${String(p.tagline).replace(/\s+/g, " ").trim()}` : ""}`;

export async function loader() {
  const [stats, best, skills] = await Promise.all([
    fetchCollectionStats(),
    fetchProjects({ sort: "best", limit: 30 }),
    fetchProjects({ has_skill: true, sort: "installs", limit: 50 }),
  ]);

  const collections = COLLECTIONS.map(c => {
    const s = collectionStat(c, stats);
    const facts = [dateRange(s.firstAt, s.lastAt), s.count ? `${s.count} ${s.count === 1 ? "project" : "projects"}` : ""].filter(Boolean).join(", ");
    const seasons = (c.seasons ?? [])
      .map(x => `  - [${c.name} ${x.label}, ${x.when}${x.ranAs ? ` (ran as ${x.ranAs})` : ""}](${SITE_URL}${c.path}?season=${x.key})`)
      .join("\n");
    return `- [${c.name}](${SITE_URL}${c.path})${facts ? ` (${facts})` : ""}: ${c.blurb}${seasons ? `\n${seasons}` : ""}`;
  }).join("\n");

  const content = `# Built at GrowthX

> Products and AI skills built by members of GrowthX, India's community of product, growth and tech people. Members ship them at Build Sprint and GrowthX buildathons, or on their own, and the community upvotes them.

Every project page has what the product does, a link to try it, who built it (with their company), what it was built with, and the discussion. Skill pages also have install steps for Claude, ChatGPT, Claude Code and Codex.

## Browse

- [Best projects](${SITE_URL}/): winners first (1st, 2nd and 3rd place, Top 5, Top 15), then the most upvoted
- [Events](${SITE_URL}/events): every Build Sprint season and buildathon
- [Skills](${SITE_URL}/skills): AI skills members built, checked by GrowthX before they are listed
- [Builders](${SITE_URL}/builders): members ranked by projects shipped

## Events

${collections}

## Best projects

${best.projects.map(line).join("\n")}

## Skills

${skills.projects.map(line).join("\n")}

## Links

- Sitemap: ${SITE_URL}/sitemap.xml
- GrowthX: https://growthx.club
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
