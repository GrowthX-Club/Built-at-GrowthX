import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { MetaDescriptor } from "react-router";
import {
  type Collection, type SortKey, type ProjectPage, type CollectionStats,
  fetchProjects, fetchCollectionStats, collectionStat, dateRange, isOpen, listParams,
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
  const { sort, category, q } = listParams(request.url, SORTS);
  const stats = await fetchCollectionStats();
  const asked = new URL(request.url).searchParams.get("season");
  const season = c.seasons
    ? c.seasons.find(s => s.key === asked) ?? c.seasons.find(s => (stats.tags[s.tag]?.count ?? 0) > 0) ?? c.seasons[0]
    : undefined;
  const tag = season?.tag ?? c.tags[0];
  const list = await fetchProjects({ sort, buildathon: tag, category: category || undefined, limit: 20 });
  return { list, stats, tag, seasonKey: season?.key ?? "", sort, category, q };
}

export function collectionMeta(c: Collection, data: CollectionData | undefined, extra: MetaDescriptor[] = []): MetaDescriptor[] {
  const season = c.seasons?.find(s => s.key === data?.seasonKey);
  const asked = !!season && season !== c.seasons?.find(s => (data?.stats.tags[s.tag]?.count ?? 0) > 0);
  const path = asked ? `${c.path}?season=${season!.key}` : c.path;
  const name = season ? `${c.name} ${season.label}` : c.name;
  return [
    ...pageMeta({ title: `${name} projects — Built at GrowthX`, description: `${c.blurb} See every project, the winners first.`, path }),
    ...(data ? [{ "script:ld+json": itemListLd(`${name} projects`, path, data.list.projects) }] : []),
    { "script:ld+json": breadcrumbLd([{ name: "Built at GrowthX", path: "/" }, { name: "Events", path: "/events" }, { name: c.name, path: c.path }]) },
    ...extra,
  ];
}

export default function CollectionPage({ c, customFilters, hideTitle = false }: {
  c: Collection;
  customFilters?: FilterTab[];
  /** The Sarvam page has its own hero above. */
  hideTitle?: boolean;
}) {
  const data = useLoaderData() as CollectionData;
  const [query, setQuery] = useState(data.q);
  const total = collectionStat(c, data.stats);
  const season = c.seasons?.find(s => s.key === data.seasonKey);
  const seasonStat = season ? data.stats.tags[season.tag] : undefined;
  const when = season ? season.when : dateRange(total.firstAt, total.lastAt);
  const count = season ? seasonStat?.count ?? 0 : total.count;

  return (
    <main className="page narrow">
      <nav aria-label="Breadcrumb" className="crumbs"><Link to="/events">Events</Link><span aria-hidden="true"> / </span><span>{c.name}</span></nav>
      <header className="page-head">
        {hideTitle
          ? <h2 className="page-title" style={{ fontSize: 30 }}>{c.name} projects</h2>
          : <h1 className="page-title">{c.name}</h1>}
        <p className="page-sub">{c.blurb}</p>
        {c.seasons && (
          <div className="chip-row" style={{ marginTop: 20 }} aria-label="Seasons">
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
        <SearchBox value={query} onChange={setQuery} placeholder={`Search ${season ? `${c.name} ${season.label}` : c.name} projects`} />
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
