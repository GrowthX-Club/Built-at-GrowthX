import { bxApi } from "@/lib/api";

export const SITE_URL = "https://built.growthx.club";

// ---- Events / collections ----
// One registry for every event tag the site shows. Names are the ones the site and GrowthX already use.
// Build Sprint is one programme across four seasons (BW01–BW04); each season keeps its own tag.

export interface Season {
  key: string;
  tag: string;
  label: string;
  /** Programme dates, shown on the season chip. */
  when: string;
  /** What the season was called when it ran. */
  ranAs?: string;
}

export interface Collection {
  slug: string;
  path: string;
  name: string;
  blurb: string;
  tags: string[];
  seasons?: Season[];
}

export const BUILD_SPRINT: Collection = {
  slug: "build-sprint",
  path: "/build-sprint",
  name: "Build Sprint",
  blurb: "GrowthX's build programme. Members pick one problem, ship it live and get real users.",
  tags: ["build-sprint", "build-week", "ai-immersion", "ai-weekender"],
  seasons: [
    { key: "04", tag: "build-sprint", label: "Season 04", when: "Oct 2026" },
    { key: "03", tag: "build-week", label: "Season 03", when: "Aug–Sep 2026", ranAs: "Build Week" },
    { key: "02", tag: "ai-immersion", label: "Season 02", when: "Aug 2026", ranAs: "AI Immersion" },
    { key: "01", tag: "ai-weekender", label: "Season 01", when: "Apr 2026", ranAs: "AI Weekender Buildathon" },
  ],
};

export const COLLECTIONS: Collection[] = [
  BUILD_SPRINT,
  {
    slug: "sarvam",
    path: "/sarvam",
    name: "Sarvam Epoch Buildathon",
    blurb: "~600 builders shipping with Sarvam AI in a single day.",
    tags: ["sarvam"],
  },
  {
    slug: "opencode",
    path: "/opencode",
    name: "OpenCode Buildathon",
    blurb: "India's first OpenCode Buildathon, powered by GrowthX.",
    tags: ["opencode"],
  },
  {
    slug: "openclaw",
    path: "/events/openclaw",
    name: "OpenClaw Buildathon",
    blurb: "India's first OpenClaw Buildathon.",
    tags: ["OpenClaw Buildathon"],
  },
];

/** Where a project's event tag lives on the site, and what to call it there. */
export function eventFor(tag: string | null | undefined): { name: string; href: string } | null {
  if (!tag) return null;
  for (const c of COLLECTIONS) {
    const season = c.seasons?.find(s => s.tag === tag);
    if (season) return { name: `${c.name} · ${season.label}`, href: `${c.path}?season=${season.key}` };
    if (c.tags.includes(tag)) return { name: c.name, href: c.path };
  }
  if (tag === "OpenCode Buildathon") return { name: "OpenCode Buildathon", href: "/opencode" };
  return null;
}

// ---- Stats per tag and per category ----

export interface TagStat { count: number; firstAt?: string; lastAt?: string }
export interface CategoryStat { name: string; count: number }
export interface CollectionStats { tags: Record<string, TagStat>; categories: CategoryStat[] }

type RawTag = { tag?: string; buildathon?: string; count?: number; first_at?: string; last_at?: string };
type RawCategory = { category?: string; name?: string; count?: number };

/**
 * GET /bx/collections ({ buildathons: [{ tag, count, first_at, last_at }], categories: [{ category, count }] }) when it
 * is live; until then, totalCount per tag and no categories (the chip row stays hidden).
 */
export async function fetchCollectionStats(): Promise<CollectionStats> {
  try {
    const r = await bxApi("/collections");
    if (r.ok) {
      const d = await r.json();
      const tags: Record<string, TagStat> = {};
      for (const t of (d.buildathons ?? d.tags ?? []) as RawTag[]) {
        const tag = t.tag ?? t.buildathon;
        if (tag) tags[tag] = { count: t.count ?? 0, firstAt: t.first_at, lastAt: t.last_at };
      }
      const categories = ((d.categories ?? []) as RawCategory[])
        .map(c => ({ name: c.category ?? c.name ?? "", count: c.count ?? 0 }))
        .filter(c => c.name && c.count > 0);
      return { tags, categories };
    }
  } catch { /* fall through */ }
  const all = COLLECTIONS.flatMap(c => c.tags);
  const rows = await Promise.all(all.map(async tag => {
    const d = await bxApi(`/projects?buildathon=${encodeURIComponent(tag)}&limit=1&sort=new`)
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    return [tag, { count: d?.totalCount ?? 0, lastAt: d?.projects?.[0]?.created_at }] as const;
  }));
  return { tags: Object.fromEntries(rows), categories: [] };
}

/** The category a builder picks when submitting (the backend files a project without one under "Other"). */
export const CATEGORIES = [
  "Developer tools", "Money", "Sales & marketing", "Business ops", "Learning", "Health", "Productivity", "Home & family",
  "Work & careers", "Creators & media", "Voice & language", "Legal & government", "Commerce", "Travel & local",
  "Community & social", "Fun & games", "Other",
] as const;

/**
 * Category chips, biggest first. Only once projects are really spread across categories (not the old all-"AI"
 * field), and never "Other" (mostly hidden test rows).
 */
export function usefulCategories(cats: CategoryStat[]): CategoryStat[] {
  const total = cats.reduce((s, c) => s + c.count, 0);
  if (cats.length < 3 || cats.some(c => c.count > total * 0.7)) return [];
  return cats.filter(c => c.name !== "Other").sort((a, b) => b.count - a.count);
}

export function collectionStat(c: Collection, stats: CollectionStats): TagStat {
  const parts = c.tags.map(t => stats.tags[t]).filter(Boolean) as TagStat[];
  // Without first_at (older backend), each tag's latest project still bounds the range from below.
  const firsts = parts.map(p => p.firstAt ?? p.lastAt).filter(Boolean) as string[];
  const lasts = parts.map(p => p.lastAt).filter(Boolean) as string[];
  return {
    count: parts.reduce((s, p) => s + p.count, 0),
    firstAt: firsts.sort()[0],
    lastAt: lasts.sort().slice(-1)[0],
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const month = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600000); // IST
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** "Oct 2026", "Aug–Sep 2026", "Apr–Oct 2026"; empty when the dates are unknown. */
export function dateRange(firstAt?: string, lastAt?: string): string {
  if (!lastAt) return "";
  const end = month(lastAt);
  if (!firstAt) return end;
  const start = month(firstAt);
  if (start === end) return end;
  const [sm, sy] = start.split(" ");
  const [em, ey] = end.split(" ");
  return sy === ey ? `${sm}–${em} ${ey}` : `${start} – ${end}`;
}

/** An event is open while projects are still coming in: one in the last 7 days. */
export function isOpen(lastAt?: string): boolean {
  return !!lastAt && Date.now() - new Date(lastAt).getTime() < 7 * 86400000;
}

// ---- Project lists ----

export type SortKey = "best" | "trending" | "new" | "top" | "installs";
export type RawProject = Record<string, unknown>;
export interface ProjectPage { projects: RawProject[]; totalCount: number; votedProjectIds: string[] }

export interface ListQuery {
  sort?: SortKey;
  buildathon?: string;
  category?: string;
  has_skill?: boolean;
  limit?: number;
  offset?: number;
}

const qs = (q: ListQuery) =>
  new URLSearchParams(
    Object.entries(q).filter(([, v]) => v !== undefined && v !== "" && v !== false).map(([k, v]) => [k, String(v)])
  ).toString();

// Lists never show the long description; dropping it keeps server-rendered pages light.
const slim = (p: RawProject): RawProject => { const { description: _d, ...rest } = p; return rest; };

// ponytail: sort=best is new on the backend; until it is live, Best falls back to most upvoted.
// A 400 is remembered for 10 minutes so each page doesn't ask twice; delete once the backend has it.
let bestUnsupportedAt = 0;

export async function fetchProjects(q: ListQuery): Promise<ProjectPage> {
  try {
    if (q.sort === "best" && Date.now() - bestUnsupportedAt < 600000) q = { ...q, sort: "top" };
    let r = await bxApi(`/projects?${qs(q)}`);
    if (r.status === 400 && q.sort === "best") {
      bestUnsupportedAt = Date.now();
      r = await bxApi(`/projects?${qs({ ...q, sort: "top" })}`);
    }
    if (!r.ok) return { projects: [], totalCount: 0, votedProjectIds: [] };
    const d = await r.json();
    return {
      projects: ((d.projects ?? []) as RawProject[]).map(slim),
      totalCount: d.totalCount ?? 0,
      votedProjectIds: d.votedProjectIds ?? [],
    };
  } catch {
    return { projects: [], totalCount: 0, votedProjectIds: [] };
  }
}

/** Every project in a scope, 100 per request, in parallel after the first page. */
export async function fetchAllProjects(q: ListQuery): Promise<ProjectPage> {
  const first = await fetchProjects({ ...q, limit: 100, offset: 0 });
  const offsets = [];
  for (let o = 100; o < first.totalCount; o += 100) offsets.push(o);
  const rest = await Promise.all(offsets.map(offset => fetchProjects({ ...q, limit: 100, offset })));
  const seen = new Set<string>();
  const projects = [first, ...rest].flatMap(p => p.projects).filter(p => {
    const id = String(p._id ?? p.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return { projects, totalCount: first.totalCount, votedProjectIds: first.votedProjectIds };
}

/** Keep a list's state in the address bar (shareable, survives reload) without re-running the route loader. */
export function replaceParam(key: string, value: string) {
  const u = new URL(window.location.href);
  if (value) u.searchParams.set(key, value);
  else u.searchParams.delete(key);
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
}

/** The list view a URL asks for: ?sort=&category=&q= */
export function listParams(url: string, sorts: SortKey[]) {
  const sp = new URL(url).searchParams;
  const s = sp.get("sort") as SortKey | null;
  return {
    sort: s && sorts.includes(s) ? s : sorts[0],
    category: sp.get("category") ?? "",
    q: sp.get("q") ?? "",
  };
}
