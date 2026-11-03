import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { MetaDescriptor } from "react-router";
import {
  type Collection, type SortKey, type ProjectPage, type CollectionStats, SITE_URL,
  fetchProjects, fetchCollectionStats, collectionStat, dateRange, isOpen, listParams, defaultSeason, mosaicOf,
} from "@/lib/collections";
import { pageMeta, itemListLd, breadcrumbLd } from "@/lib/seo";
import ProjectListView, { type FilterTab } from "@/components/ProjectListView";
import SearchBox from "@/components/SearchBox";

const SORTS: SortKey[] = ["best", "trending", "new"];

export interface CollectionData {
  list: ProjectPage;
  stats: CollectionStats;
  tag: string;
  seasonKey: string;
  sort: SortKey;
  category: string;
  q: string;
}

/** Server loader for an event page: ?season= picks a Build Sprint season (default: newest with projects). */
export async function loadCollection(request: Request, c: Collection): Promise<CollectionData> {
  const { sort, sortAsked, category, q } = listParams(request.url, SORTS);
  const asked = c.seasons?.find(s => s.key === new URL(request.url).searchParams.get("season"));
  // The list for the asked (or newest) season loads alongside the stats; only a wrong guess costs a second request.
  const guess = (asked ?? c.seasons?.[0])?.tag ?? c.tags[0];
  const query = (tag: string, s: SortKey) => fetchProjects({ sort: s, buildathon: tag, category: category || undefined, limit: 20 });
  const [stats, first] = await Promise.all([fetchCollectionStats(), query(guess, sort)]);
  const season = asked ?? (c.seasons ? defaultSeason(c, stats) : undefined);
  const tag = season?.tag ?? c.tags[0];
  let list = tag === guess ? first : await query(tag, sort);
  let listSort = sort;
  // While nobody has voted here yet (Season 04 today) and there are no placings, newest first reads better than Best.
  if (!sortAsked && !list.error && list.projects.length > 0 && list.projects.every(p => !p.weighted_votes && !p.accolade)) {
    listSort = "new";
    list = await query(tag, "new");
  }
  return { list, stats, tag, seasonKey: season?.key ?? "", sort: listSort, category, q };
}

const absolute = (src: string) => (src.startsWith("/") ? `${SITE_URL}${src}` : src);

export function collectionMeta(c: Collection, data: CollectionData | undefined, extra: MetaDescriptor[] = []): MetaDescriptor[] {
  const season = c.seasons?.find(s => s.key === data?.seasonKey);
  const isDefault = !!data && season === defaultSeason(c, data.stats);
  const path = season && !isDefault ? `${c.path}?season=${season.key}` : c.path;
  const name = season ? `${c.name} ${season.label}` : c.name;
  return [
    ...pageMeta({
      title: `${name} projects — Built at GrowthX`,
      description: `${c.blurb} See every project, the winners first.`,
      path,
      ...(c.cover ? { image: absolute(c.cover) } : {}),
    }),
    ...(data ? [{ "script:ld+json": itemListLd(`${name} projects`, path, data.list.projects) }] : []),
    { "script:ld+json": breadcrumbLd([{ name: "Built at GrowthX", path: "/" }, { name: "Events", path: "/events" }, { name: c.name, path: c.path }]) },
    ...extra,
  ];
}

export default function CollectionPage({ c, customFilters }: { c: Collection; customFilters?: FilterTab[] }) {
  const data = useLoaderData() as CollectionData;
  const [query, setQuery] = useState(data.q);
  const total = collectionStat(c, data.stats);
  const season = c.seasons?.find(s => s.key === data.seasonKey);
  const seasonStat = season ? data.stats.tags[season.tag] : undefined;
  const when = season ? season.when : dateRange(total.firstAt, total.lastAt);
  const count = season ? seasonStat?.count ?? 0 : total.count;
  const small = !data.list.error && data.list.totalCount < 10;
  const mosaic = mosaicOf(data.list.projects);
  const art: "cover" | string[] | null = c.photos ? null
    : c.cover && (!season || season === c.seasons?.[0]) ? "cover"
    : mosaic.length ? mosaic : null;

  return (
    <main className="page">
      <nav aria-label="Breadcrumb" className="crumbs"><Link to="/events">Events</Link><span aria-hidden="true"> / </span><span>{c.name}</span></nav>
      {c.photos && <div className="photo-strip">{c.photos.map(src => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}</div>}
      {/* Devpost's hackathon banner: the event's real cover beside its name (the home page's Build Sprint band). The
          Build Sprint cover is Season 04's; other seasons and events without a cover show four of their best screenshots. */}
      <header className={art ? "sprint-band event-band" : "event-head"}>
        {art === "cover" && <img src={c.cover} alt={`${c.name} cover`} />}
        {Array.isArray(art) && <div className="coll-mosaic" aria-hidden="true">{art.map(src => <img key={src} src={src} alt="" />)}</div>}
        <div className={art ? "sprint-text" : undefined}>
          <h1 className="page-title">{season ? `${c.name} ${season.label}` : c.name}</h1>
          <p className="page-sub">{c.blurb}</p>
          <p className="coll-facts">
            {season?.ranAs ? `${season.label} ran as ${season.ranAs}. ` : ""}
            {isOpen(season ? seasonStat?.lastAt : total.lastAt) ? <span className="open-pill">Open now</span> : when}
            {count > 0 ? ` · ${count.toLocaleString()} ${count === 1 ? "project" : "projects"}` : ""}
          </p>
        </div>
      </header>
      {/* Devpost's hackathon tab strip; here one tab per season */}
      {c.seasons ? (
        <nav className="tabs" aria-label="Seasons">
          {c.seasons.map(s => (
            <Link key={s.key} to={`${c.path}?season=${s.key}`} preventScrollReset className={`tab${s.key === data.seasonKey ? " is-active" : ""}`}
              aria-current={s.key === data.seasonKey ? "page" : undefined}>
              {s.label}<span>{s.when}</span>
            </Link>
          ))}
        </nav>
      ) : <div style={{ height: 32 }} />}
      <ProjectListView
        key={data.tag}
        initial={data.list}
        tag={data.tag}
        sorts={SORTS}
        sort={data.sort}
        category={data.category}
        query={query}
        onClearQuery={() => setQuery("")}
        customFilters={customFilters}
        showEvent={false}
        toolbarEnd={small ? undefined : <SearchBox value={query} onChange={setQuery} placeholder={season ? `Search ${season.label} projects` : "Search projects"} />}
        emptyState={{
          title: "No projects here yet",
          description: season ? `${c.name} ${season.label} builds show up here once they are published.` : "Projects from this event show up here once they are published.",
        }}
      />
    </main>
  );
}
