import { useState, useEffect, useCallback, useRef } from "react";
import { C, type Project, type BuilderProfile, normalizeProject, normalizeUser } from "@/types";
import { bxApi } from "@/lib/api";
import {
  type SortKey, type CategoryStat, type ProjectPage, type ListQuery,
  fetchProjects, fetchAllProjects, replaceParam,
} from "@/lib/collections";
import { useLoginDialog } from "@/context/LoginDialogContext";
import ProjectRow from "@/components/ProjectRow";

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
}

const SORT_LABELS: Record<SortKey, string> = {
  best: "Best", trending: "Trending", new: "New", top: "Top", installs: "Most installed",
};

const ACCOLADE_PRIORITY: Record<string, number> = { "rank-1": 1, "rank-2": 2, "rank-3": 3, "top-5": 4, "top-15": 5 };
const rankWeight = (p: Project) => (p.accolade ? ACCOLADE_PRIORITY[p.accolade] ?? 99 : 99);

const PAGE_SIZE = 20;

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
}: ProjectListViewProps) {
  const { openLoginDialog } = useLoginDialog();
  const [sort, setSort] = useState<SortKey>(startSort && sorts.includes(startSort) ? startSort : sorts[0]);
  const [category, setCategory] = useState(startCategory);
  const [filterKey, setFilterKey] = useState(customFilters?.[0]?.key ?? "");
  const [projects, setProjects] = useState<Project[]>(() => (initial?.projects ?? []).map(normalizeProject));
  const [totalCount, setTotalCount] = useState(initial?.totalCount ?? 0);
  const [loading, setLoading] = useState(!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipNextLoad = useRef(!!initial && !customFilters);
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
    (wholeScope ? fetchAllCached(q) : fetchProjects({ ...q, limit: PAGE_SIZE, offset: 0 }))
      .then(d => {
        if (id !== requestId.current) return;
        setProjects(d.projects.map(normalizeProject));
        setTotalCount(d.totalCount);
        if (d.votedProjectIds.length) setVotedIds(d.votedProjectIds);
      })
      .catch(() => { if (id === requestId.current) setProjects([]); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [scopeKey, wholeScope]);

  useEffect(() => {
    if (skipNextLoad.current) { skipNextLoad.current = false; return; }
    load();
  }, [load, refreshKey]);

  const loadMore = useCallback(() => {
    if (wholeScope || loadingMore || projects.length >= totalCount) return;
    const id = requestId.current;
    setLoadingMore(true);
    fetchProjects({ ...JSON.parse(scopeKey), limit: PAGE_SIZE, offset: projects.length })
      .then(d => {
        if (id !== requestId.current) return;
        setProjects(prev => {
          const seen = new Set(prev.map(p => String(p.id)));
          return [...prev, ...d.projects.map(normalizeProject).filter(p => !seen.has(String(p.id)))];
        });
        if (d.projects.length === 0) setTotalCount(projects.length);
      })
      .finally(() => setLoadingMore(false));
  }, [wholeScope, loadingMore, projects.length, totalCount, scopeKey]);

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
    shown = [...(f ? shown.filter(f.predicate) : shown)].sort((a, b) => rankWeight(a) - rankWeight(b) || b.weighted - a.weighted);
  }
  if (searching) shown = shown.filter(p => matches(p, words));

  const pill = (active: boolean) => `chip${active ? " is-active" : ""}`;

  return (
    <div>
      <div className="list-toolbar">
        {customFilters ? (
          <div className="chip-row" role="tablist" aria-label="Filter projects">
            {customFilters.map(t => (
              <button key={t.key} type="button" role="tab" aria-selected={filterKey === t.key} className={pill(filterKey === t.key)} onClick={() => setFilterKey(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        ) : sorts.length > 1 && (
          <div className="seg" role="tablist" aria-label="Sort projects">
            {sorts.map(s => (
              <button key={s} type="button" role="tab" aria-selected={sort === s} className={`seg-btn${sort === s ? " is-active" : ""}`} onClick={() => pickSort(s)}>
                {SORT_LABELS[s]}
              </button>
            ))}
          </div>
        )}
        {categories.length > 0 && (
          <div className="chip-row" aria-label="Categories" ref={chipsRef}>
            <button type="button" className={pill(!category)} aria-pressed={!category} onClick={() => pickCategory("")}>All</button>
            {categories.map(c => (
              <button key={c.name} type="button" className={pill(category === c.name)} aria-pressed={category === c.name} onClick={() => pickCategory(c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {searching && !loading && shown.length > 0 && (
        <p className="list-count">
          {shown.length.toLocaleString()} {shown.length === 1 ? "project matches" : "projects match"} “{query.trim()}”
        </p>
      )}

      {loading && shown.length === 0 ? (
        <div aria-busy="true">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="prow no-thumb" style={{ pointerEvents: "none" }}>
              <div className="prow-text">
                <div className="skeleton" style={{ height: 18, width: "40%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: "75%" }} />
              </div>
              <div className="prow-meta"><div className="skeleton" style={{ height: 14, width: 180 }} /></div>
              <div className="prow-vote"><div className="skeleton" style={{ width: 52, height: 56, borderRadius: 10 }} /></div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          {searching ? (
            <>
              <p className="empty-title">Nothing here matches “{query.trim()}”</p>
              <p className="empty-body">Try a product name, a builder, a company or a tool like “Claude”.</p>
              {onClearQuery && <button type="button" className="btn-outline" onClick={onClearQuery}>Clear search</button>}
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
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          {shown.map(p => (
            <ProjectRow key={p.id} project={p} voted={votedIds.includes(String(p.id))} onVote={() => handleVote(p.id)} showEvent={showEvent} />
          ))}
          {!wholeScope && projects.length < totalCount && (
            <div ref={sentinelRef} style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: C.textMute }}>
              {loadingMore ? "Loading more projects…" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
