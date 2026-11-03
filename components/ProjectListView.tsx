import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { C, type Project, type BuilderProfile, normalizeProject, normalizeUser } from "@/types";
import { bxApi } from "@/lib/api";
import {
  type SortKey, type CategoryStat, type ProjectPage, type ListQuery,
  fetchProjects, fetchAllProjects, replaceParam,
} from "@/lib/collections";
import { useLoginDialog } from "@/context/LoginDialogContext";
import ProjectCard, { ProjectCardSkeleton } from "@/components/ProjectCard";
import { SkillCard } from "@/components/SkillsPanel";

export interface FilterTab {
  key: string;
  label: string;
  predicate: (project: Project) => boolean;
}

export interface ProjectListViewProps {
  /** Server-rendered first page of the starting view, so the HTML carries the project names. */
  initial?: ProjectPage;
  /** Event tag (?buildathon=). */
  tag?: string;
  /** Only projects that ship a skill GrowthX has reviewed. */
  skillsOnly?: boolean;
  /** Sort tabs to offer, first is the default. */
  sorts?: SortKey[];
  /** Starting sort (from the URL). */
  sort?: SortKey;
  /** Category chips; the row hides when empty. */
  categories?: CategoryStat[];
  /** Starting category (from the URL). */
  category?: string;
  /** Search text, owned by the page's search box. */
  query?: string;
  onClearQuery?: () => void;
  /** Event-specific pills (Top 15, tracks) filtered on the client over the whole event. */
  customFilters?: FilterTab[];
  /** Show which event each project came from (off on an event's own page). */
  showEvent?: boolean;
  emptyState?: { title: string; description: string };
  /** Bump to reload (e.g. after a submit). */
  refreshKey?: number;
  /** A "Show more" button instead of infinite scroll, so what follows the list stays reachable (home). */
  moreButton?: boolean;
  /** How many cards to show before "Show more" (home shows two rows). */
  pageSize?: number;
  /** Something to put at the end of the toolbar (e.g. a search box). */
  toolbarEnd?: ReactNode;
}

const SORT_LABELS: Record<SortKey, string> = {
  best: "Best", trending: "Trending", new: "New", top: "Top", installs: "Popular",
};

const PAGE_SIZE = 21; // seven rows of three

// Whole-scope fetches (search, event pills) are cached per scope for the visit.
const allCache = new Map<string, Promise<ProjectPage>>();
function fetchAllCached(q: ListQuery) {
  const key = JSON.stringify(q);
  if (!allCache.has(key)) allCache.set(key, fetchAllProjects(q).catch(e => { allCache.delete(key); throw e; }));
  return allCache.get(key)!;
}

function matches(p: Project, words: string[]) {
  const hay = [
    p.name, p.tagline, p.builder.name, p.builder.company, p.category,
    ...(p.creators || []).map(c => `${c.name} ${c.company || ""}`),
    ...p.collabs.map(c => `${c.name} ${c.company || ""}`),
    ...p.stack,
  ].join(" ").toLowerCase();
  return words.every(w => hay.includes(w));
}

/** Six dots fly out of the vote button. */
export function voteBurst(btn: Element | null) {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9999;";
  const dots = [0, 55, 110, 170, 230, 300].map(deg => {
    const rad = (deg * Math.PI) / 180;
    const dist = 44 + Math.random() * 20;
    const dot = document.createElement("div");
    dot.className = "vote-burst-dot";
    dot.style.left = `${cx}px`;
    dot.style.top = `${cy}px`;
    dot.style.transform = "translate(-50%, -50%) scale(1)";
    dot.style.opacity = "1";
    dot.dataset.tx = `${Math.cos(rad) * dist}`;
    dot.dataset.ty = `${Math.sin(rad) * dist}`;
    container.appendChild(dot);
    return dot;
  });
  document.body.appendChild(container);
  requestAnimationFrame(() => dots.forEach(dot => {
    dot.style.transform = `translate(calc(-50% + ${dot.dataset.tx}px), calc(-50% + ${dot.dataset.ty}px)) scale(0)`;
    dot.style.opacity = "0";
  }));
  setTimeout(() => container.remove(), 550);
}

export default function ProjectListView({
  initial, tag, skillsOnly = false, sorts = ["best", "trending", "new"], sort: startSort, categories = [],
  category: startCategory = "", query = "", onClearQuery, customFilters, showEvent = true, emptyState, refreshKey = 0,
  moreButton = false, pageSize = PAGE_SIZE, toolbarEnd,
}: ProjectListViewProps) {
  const { openLoginDialog } = useLoginDialog();
  const [sort, setSort] = useState<SortKey>(startSort && sorts.includes(startSort) ? startSort : sorts[0]);
  const [category, setCategory] = useState(startCategory);
  const [filterKey, setFilterKey] = useState(customFilters?.[0]?.key ?? "");
  const [projects, setProjects] = useState<Project[]>(() => (initial?.projects ?? []).map(normalizeProject));
  const [totalCount, setTotalCount] = useState(initial?.totalCount ?? 0);
  const usable = !!initial && !initial.error;
  const [loading, setLoading] = useState(!usable);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // The server's first page is reused while the view is still the one it was rendered for (unless it failed, a
  // whole-scope view is needed, or the URL asks for a search). A key, not a one-shot flag, so effects that run
  // twice (React StrictMode) don't refetch it.
  const serverKey = useRef(usable && !customFilters && query.trim().length < 2
    ? JSON.stringify({ sort: startSort && sorts.includes(startSort) ? startSort : sorts[0], category: startCategory })
    : null).current;
  // Lists under 10 projects don't need sort or category controls (decided once, from the starting view).
  const small = useRef((initial?.totalCount ?? 10) < 10 && !initial?.error).current;
  const requestId = useRef(0);

  const words = query.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const searching = query.trim().length >= 2;
  const wholeScope = searching || !!customFilters;
  const scope: ListQuery = { sort: customFilters ? "best" : sort, buildathon: tag, category: category || undefined, has_skill: skillsOnly || undefined };
  const scopeKey = JSON.stringify(scope);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    const q: ListQuery = JSON.parse(scopeKey);
    (wholeScope ? fetchAllCached(q) : fetchProjects({ ...q, limit: pageSize, offset: 0 }))
      .then(d => {
        if (id !== requestId.current) return;
        setFailed(!!d.error && d.projects.length === 0);
        setProjects(d.projects.map(normalizeProject));
        setTotalCount(d.totalCount);
        if (d.votedProjectIds.length) setVotedIds(d.votedProjectIds);
      })
      .catch(() => { if (id === requestId.current) setProjects([]); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [scopeKey, wholeScope, pageSize]);

  useEffect(() => {
    if (refreshKey === 0 && !wholeScope && serverKey === JSON.stringify({ sort, category })) return;
    load();
  }, [load, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (wholeScope || loadingMore || projects.length >= totalCount) return;
    const id = requestId.current;
    setLoadingMore(true);
    fetchProjects({ ...JSON.parse(scopeKey), limit: pageSize, offset: projects.length })
      .then(d => {
        if (id !== requestId.current) return;
        setProjects(prev => {
          const seen = new Set(prev.map(p => String(p.id)));
          return [...prev, ...d.projects.map(normalizeProject).filter(p => !seen.has(String(p.id)))];
        });
        if (d.projects.length === 0) setTotalCount(projects.length);
      })
      .finally(() => setLoadingMore(false));
  }, [wholeScope, loadingMore, projects.length, totalCount, scopeKey, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore(); }, { rootMargin: "400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Who is signed in, and what they have voted for (the server-rendered page can't know).
  const loadUser = useCallback(() => {
    bxApi("/me").then(r => r.json()).then(d => {
      const u = normalizeUser(d.user);
      setUser(u);
      if (u) fetchProjects({ limit: 1 }).then(p => setVotedIds(p.votedProjectIds));
    }).catch(() => {});
  }, []);
  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    window.addEventListener("bx:login-success", loadUser);
    return () => window.removeEventListener("bx:login-success", loadUser);
  }, [loadUser]);

  const handleVote = async (projectId: string | number) => {
    if (!user) { openLoginDialog(() => { loadUser(); }); return; }
    const res = await bxApi("/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) });
    if (!res.ok) return;
    const result = await res.json();
    const pid = String(projectId);
    if (result.voted) {
      setVotedIds(ids => [...ids, pid]);
      voteBurst(document.querySelector(`[data-vote-id="${pid}"]`));
    } else {
      setVotedIds(ids => ids.filter(id => id !== pid));
    }
    const w = result.weighted ?? result.weighted_votes ?? result.weightedVotes ?? 0;
    const rv = result.raw ?? result.raw_votes ?? result.rawVotes ?? 0;
    setProjects(prev => prev.map(p => (String(p.id) === pid ? { ...p, weighted: w, raw: rv } : p)));
  };

  // Phones scroll the chip row sideways: keep the chosen category in view (row only, never the page).
  const chipsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>(".chip.is-active");
    if (row && chip && row.scrollWidth > row.clientWidth) row.scrollLeft = chip.offsetLeft - row.offsetLeft - 16;
  }, [category]);

  const pickSort = (s: SortKey) => { setSort(s); replaceParam("sort", s === sorts[0] ? "" : s); };
  const pickCategory = (c: string) => { setCategory(c); replaceParam("category", c); };

  let shown = projects;
  if (customFilters) {
    const f = customFilters.find(t => t.key === filterKey);
    if (f) shown = shown.filter(f.predicate);
  }
  if (searching) shown = shown.filter(p => matches(p, words));

  const pill = (active: boolean) => `chip${active ? " is-active" : ""}`;
  const clearSearch = () => { onClearQuery?.(); replaceParam("q", ""); };

  return (
    <div>
      {(!small || toolbarEnd) && <div className="list-toolbar">
        {customFilters ? (
          <div className="chip-row" role="group" aria-label="Filter projects">
            {customFilters.map(t => (
              <button key={t.key} type="button" aria-pressed={filterKey === t.key} className={pill(filterKey === t.key)} onClick={() => setFilterKey(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        ) : sorts.length > 1 && !small && (
          <div className="seg" role="group" aria-label="Sort projects">
            {sorts.map(s => (
              <button key={s} type="button" aria-pressed={sort === s} className={`seg-btn${sort === s ? " is-active" : ""}`} onClick={() => pickSort(s)}>
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>
        )}
        {categories.length > 0 && !small && (
          <div className="chip-row" role="group" aria-label="Categories" ref={chipsRef}>
            <button type="button" className={pill(!category)} aria-pressed={!category} onClick={() => pickCategory("")}>All</button>
            {categories.map(c => (
              <button key={c.name} type="button" className={pill(category === c.name)} aria-pressed={category === c.name} onClick={() => pickCategory(c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {toolbarEnd}
      </div>}

      {searching && !loading && shown.length > 0 && (
        <p className="list-count">
          {shown.length.toLocaleString()} {shown.length === 1 ? "project matches" : "projects match"} “{query.trim()}”
        </p>
      )}

      {loading && shown.length === 0 ? (
        <div aria-busy="true" className={skillsOnly ? "sgrid" : "pgrid"}>
          {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          {failed ? (
            <>
              <p className="empty-title">Projects didn't load</p>
              <button type="button" className="btn-outline" onClick={() => { allCache.clear(); load(); }}>Try again</button>
            </>
          ) : searching ? (
            <>
              <p className="empty-title">Nothing here matches “{query.trim()}”</p>
              <p className="empty-body">Try a product name, a builder, a company or a tool like “Claude”.</p>
              {onClearQuery && <button type="button" className="btn-outline" onClick={clearSearch}>Clear search</button>}
            </>
          ) : category ? (
            <>
              <p className="empty-title">No {category} projects here yet</p>
              <button type="button" className="btn-outline" onClick={() => pickCategory("")}>See all projects</button>
            </>
          ) : (
            <>
              <p className="empty-title">{emptyState?.title ?? "No projects yet"}</p>
              <p className="empty-body">{emptyState?.description ?? "Projects show up here once they are submitted."}</p>
            </>
          )}
        </div>
      ) : (
        <div aria-busy={loading}>
          <div className={skillsOnly ? "sgrid" : "pgrid"}>
            {shown.map((p, i) => skillsOnly
              ? <SkillCard key={p.id} skill={p} />
              : <ProjectCard key={p.id} project={p} voted={votedIds.includes(String(p.id))} onVote={() => handleVote(p.id)} showEvent={showEvent} eager={i < 3} />)}
          </div>
          {!wholeScope && projects.length < totalCount && (moreButton ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
              <button type="button" className="btn-outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Show more projects"}
              </button>
            </div>
          ) : (
            <div ref={sentinelRef} style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: C.textSec }}>
              {loadingMore ? "Loading more projects…" : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
