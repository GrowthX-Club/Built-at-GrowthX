import { bxApi } from "@/lib/api";
import { demoFromDescription, normalizeProject, projectImage } from "@/types";

export const SITE_URL = "https://built.growthx.club";

/** One of the site's own photos (e.g. /sarvam/…), resized by the CDN, which fetches it from built.growthx.club. */
export const sitePhoto = (src: string, width: number) =>
  src.startsWith("/") ? `https://public-cdn.growthx.club/cdn-cgi/image/width=${width},quality=75,format=auto/${SITE_URL}${src}` : src;

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
  /** A real photo or cover GrowthX already uses for the event; cards without one get the typographic cover. */
  cover?: string;
  /** Photos for the strip at the top of the event page. */
  photos?: string[];
  /** Short name for the typographic cover. */
  mark?: string;
}

export const BUILD_SPRINT: Collection = {
  slug: "build-sprint",
  path: "/build-sprint",
  name: "Build Sprint",
  blurb: "GrowthX's build programme. Members pick one problem, ship it live and get real users.",
  tags: ["build-sprint", "build-week", "ai-immersion", "ai-weekender"],
  // The Season 04 cover from growthx.club/build-sprint (its og:image).
  cover: "https://public-cdn.growthx.club/cdn-cgi/image/width=1600,quality=80,format=auto/gx-assets/build-sprint/og-build-sprint-v2.jpg",
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
    blurb: "A one-day buildathon in Bengaluru where members built with Sarvam AI's speech and language models.",
    tags: ["sarvam"],
    cover: "/sarvam/winners-group.jpg",
    photos: ["/sarvam/crowd-celebration.jpg", "/sarvam/host-stage.jpg", "/sarvam/winners-group.jpg", "/sarvam/raised-hands.jpg", "/sarvam/original-sign.jpg"],
  },
  {
    slug: "opencode",
    path: "/opencode",
    name: "OpenCode Buildathon",
    blurb: "India's first OpenCode Buildathon, powered by GrowthX.",
    tags: ["opencode"],
    mark: "OpenCode",
  },
  {
    slug: "openclaw",
    path: "/events/openclaw",
    name: "OpenClaw Buildathon",
    blurb: "India's first OpenClaw Buildathon.",
    tags: ["OpenClaw Buildathon"],
    mark: "OpenClaw",
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
  return null;
}

/** The pill on Build Sprint rows ("Build Sprint · S04"); Seasons 04 and 03 only. */
export function sprintPill(tag: string | null | undefined): string | null {
  return tag === "build-sprint" ? "Build Sprint · S04" : tag === "build-week" ? "Build Sprint · S03" : null;
}

// ---- Stats per tag and per category ----

export interface TagStat { count: number; firstAt?: string; lastAt?: string }
export interface CategoryStat { name: string; count: number }
export interface CollectionStats { tags: Record<string, TagStat>; categories: CategoryStat[]; error?: boolean }

type RawTag = { tag?: string | null; count?: number; first_at?: string; last_at?: string };
type RawCategory = { category?: string; count?: number };

/** Server fetches give up after 2.5 s so a slow API can't hold the page; the client then retries. */
export const serverSignal = () => (typeof window === "undefined" ? AbortSignal.timeout(2500) : undefined);

// One copy per server instance for 60 s (the API caches it for 60 s too).
let statsCache: { at: number; data: CollectionStats } | null = null;

/** GET /bx/collections: { buildathons: [{ tag, count, first_at, last_at }], categories: [{ category, count }] }. */
export async function fetchCollectionStats(): Promise<CollectionStats> {
  if (statsCache && Date.now() - statsCache.at < 60000) return statsCache.data;
  try {
    const r = await bxApi("/collections", { signal: serverSignal() });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const tags: Record<string, TagStat> = {};
    for (const t of (d.buildathons ?? []) as RawTag[]) {
      if (t.tag) tags[t.tag] = { count: t.count ?? 0, firstAt: t.first_at, lastAt: t.last_at };
    }
    const categories = ((d.categories ?? []) as RawCategory[])
      .map(c => ({ name: c.category ?? "", count: c.count ?? 0 }))
      .filter(c => c.name && c.count > 0);
    const data = { tags, categories };
    statsCache = { at: Date.now(), data };
    return data;
  } catch {
    return { tags: {}, categories: [], error: true };
  }
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
  const firsts = parts.map(p => p.firstAt).filter(Boolean) as string[];
  const lasts = parts.map(p => p.lastAt).filter(Boolean) as string[];
  return {
    count: parts.reduce((s, p) => s + p.count, 0),
    firstAt: firsts.sort()[0],
    lastAt: lasts.sort().slice(-1)[0],
  };
}

/** Four screenshots of a project list's best entries, for an event that has no cover of its own; [] when fewer. */
export function mosaicOf(projects: RawProject[], width = 480): string[] {
  const imgs = projects.map(p => projectImage(normalizeProject(p), width)).filter(Boolean) as string[];
  return imgs.length >= 4 ? imgs.slice(0, 4) : [];
}

/** Mosaics for the listed events without a cover, keyed by slug (one small request each). */
export async function fetchMosaics(colls: Collection[]): Promise<Record<string, string[]>> {
  const bare = colls.filter(c => !c.cover && !c.photos);
  const lists = await Promise.all(bare.map(c => fetchProjects({ sort: "best", buildathon: c.tags.join(","), limit: 12 })));
  return Object.fromEntries(bare.map((c, i) => [c.slug, mosaicOf(lists[i].projects)]));
}

/** Events worth a card: at least 5 projects (a one-project event page reads as empty). */
export function listedCollections(stats: CollectionStats): Collection[] {
  return COLLECTIONS.filter(c => stats.error || collectionStat(c, stats).count >= 5);
}

/** The season an event page opens on: the newest with projects. */
export function defaultSeason(c: Collection, stats: CollectionStats): Season | undefined {
  return c.seasons?.find(s => (stats.tags[s.tag]?.count ?? 0) > 0) ?? c.seasons?.[0];
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
/** error = the API didn't answer; the page shows a loading state and the browser asks again. */
export interface ProjectPage { projects: RawProject[]; totalCount: number; votedProjectIds: string[]; error?: boolean }

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

// Lists never show the long description; dropping it keeps server-rendered pages light. A demo video linked in it
// is kept first, as media, so the card can show its still.
const slim = (p: RawProject): RawProject => {
  const { description, ...rest } = p;
  const demo = demoFromDescription(p.media, description);
  return demo ? { ...rest, demo } : rest;
};

export async function fetchProjects(q: ListQuery): Promise<ProjectPage> {
  try {
    const r = await bxApi(`/projects?${qs(q)}`, { signal: serverSignal() });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    return {
      projects: ((d.projects ?? []) as RawProject[]).map(slim),
      totalCount: d.totalCount ?? 0,
      votedProjectIds: d.votedProjectIds ?? [],
    };
  } catch {
    return { projects: [], totalCount: 0, votedProjectIds: [], error: true };
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
  return { projects, totalCount: first.totalCount, votedProjectIds: first.votedProjectIds, error: [first, ...rest].some(p => p.error) };
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
    sortAsked: !!s && sorts.includes(s),
    category: sp.get("category") ?? "",
    q: sp.get("q") ?? "",
  };
}
