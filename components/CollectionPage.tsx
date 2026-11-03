import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { MetaDescriptor } from "react-router";
import {
  type Collection, type SortKey, type ProjectPage, type CollectionStats, SITE_URL,
  fetchProjects, fetchCollectionStats, collectionStat, dateRange, isOpen, listParams, defaultSeason,
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

  return (
    <main className="page">
      {c.photos ? (
        <div className="photo-strip">{c.photos.map(src => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}</div>
      ) : c.cover ? (
        <img className="coll-hero-img" src={c.cover} alt={`${c.name} cover`} fetchPriority="high" />
      ) : null}
      <nav aria-label="Breadcrumb" className="crumbs"><Link to="/events">Events</Link><span aria-hidden="true"> / </span><span>{c.name}</span></nav>
      <header className="page-head">
        <h1 className="page-title">{c.name}</h1>
        <p className="page-sub">{c.blurb}</p>
        {c.seasons && (
          <div className="chip-row" style={{ marginTop: 18 }} role="group" aria-label="Seasons">
            {c.seasons.map(s => (
              <Link
                key={s.key}
                to={`${c.path}?season=${s.key}`}
                preventScrollReset
                className={`chip${s.key === data.seasonKey ? " is-active" : ""}`}
                aria-current={s.key === data.seasonKey ? "page" : undefined}
              >
                {s.label} · {s.when}
              </Link>
            ))}
          </div>
        )}
        <p className="coll-facts">
          {season?.ranAs ? `${season.label} ran as ${season.ranAs}. ` : ""}
          {isOpen(season ? seasonStat?.lastAt : total.lastAt) ? <span className="open-pill">Open now</span> : when}
          {count > 0 ? ` · ${count.toLocaleString()} ${count === 1 ? "project" : "projects"}` : ""}
        </p>
        {!small && <SearchBox value={query} onChange={setQuery} placeholder={`Search ${season ? `${c.name} ${season.label}` : c.name} projects`} />}
      </header>
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
        emptyState={{
          title: "No projects here yet",
          description: season ? `${c.name} ${season.label} builds show up here once they are published.` : "Projects from this event show up here once they are published.",
        }}
      />
    </main>
  );
}
