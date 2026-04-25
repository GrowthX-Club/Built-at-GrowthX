import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  C,
  T,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectIcon from "@/components/ProjectIcon";
import TrackChip from "@/components/TrackChip";
import AccoladeBadge from "@/components/AccoladeBadge";

// Renders the accolade + track meta row when either field is set.
// Returns null when neither is set, so the caller doesn't have to add an empty container.
function ProjectMetaRow({ project }: { project: Project }) {
  const accolade = project.accolade;
  const track = project.track;
  if (!accolade && !track) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {accolade && <AccoladeBadge accolade={accolade} />}
      {track && <TrackChip track={track} />}
    </div>
  );
}

// ---- Builder cycler (extracted from _index to share between feeds) ----

function BuilderItem({ b }: { b: { name: string; company: string; companyColor: string; companyLogo?: string } }) {
  return (
    <div style={{ height: 36, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
      <div style={{
        fontSize: T.bodySm, fontWeight: 600, color: C.text,
        fontFamily: "var(--sans)", marginBottom: 2, lineHeight: 1.2,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {b.name}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: T.label, fontFamily: "var(--sans)",
        minWidth: 0,
      }}>
        <span style={{
          width: 12, height: 12, borderRadius: 3,
          background: b.companyColor || C.accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: T.micro, fontWeight: 800, color: "#fff",
          fontFamily: "var(--sans)", flexShrink: 0,
          overflow: "hidden", position: "relative",
        }}>
          {b.company[0]}
          {b.company && <img src={getCompanyLogoUrl(b.company, b.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </span>
        <span style={{ fontWeight: 400, color: C.textMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.company}</span>
      </div>
    </div>
  );
}

function BuilderCycler({ builders }: { builders: { name: string; company: string; companyColor: string; companyLogo?: string }[] }) {
  const [active, setActive] = useState(0);
  const [sliding, setSliding] = useState(false);
  const single = builders.length === 1;
  const ITEM_H = 36;

  useEffect(() => {
    if (single) return;
    const t = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setActive(a => (a + 1) % builders.length);
        setSliding(false);
      }, 300);
    }, 3000);
    return () => clearInterval(t);
  }, [builders.length, single]);

  const next = (active + 1) % builders.length;

  return (
    <div style={{ textAlign: "left", minWidth: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, overflow: "hidden", height: ITEM_H }}>
          <div style={{
            display: "flex", flexDirection: "column",
            transform: sliding ? `translateY(-${ITEM_H}px)` : "translateY(0)",
            transition: sliding ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}>
            <BuilderItem b={builders[active]} />
            <BuilderItem b={builders[next]} />
          </div>
        </div>

        {!single && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 2 }}>
            {builders.map((_, di) => (
              <div key={di} style={{
                width: 4, height: 4, borderRadius: 4,
                background: di === active ? C.text : C.borderLight,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- ProjectListView ----

export interface ProjectListViewProps {
  headerTitle: string;
  headerSubtitle: string;
  /** Optional buildathon tag (e.g. 'ai-weekender') passed as ?buildathon= filter */
  buildathonFilter?: string;
  /** Custom empty-state content shown when API returns no projects */
  emptyState?: {
    icon?: string;
    title: string;
    description: string;
  };
  defaultSort?: "trending" | "new" | "top";
  /** Bump this counter to force a reload (e.g. after a successful submit). */
  refreshKey?: number;
  /**
   * Whether to render the "Host pick this week" card for featured projects.
   * Defaults to true (main feed). Filtered showcase routes (e.g. /ai-weekender)
   * pass false — "this week" copy doesn't fit a dedicated buildathon view, and
   * featured projects then render in the regular list instead of vanishing.
   */
  featuredEnabled?: boolean;
}

const PAGE_SIZE = 20;

const DEFAULT_EMPTY = {
  icon: "🚀",
  title: "No projects yet",
  description: "Be the first to submit your project and show the GrowthX community what you've built.",
};

export default function ProjectListView({
  headerTitle,
  headerSubtitle,
  buildathonFilter,
  emptyState,
  defaultSort = "trending",
  refreshKey = 0,
  featuredEnabled = true,
}: ProjectListViewProps) {
  const navigate = useNavigate();
  const { openLoginDialog } = useLoginDialog();
  const { isMobile, isTablet } = useResponsive();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);
  const [voteAnimId, setVoteAnimId] = useState<string | number | null>(null);
  const [sortMode, setSortMode] = useState<"trending" | "new" | "top">(defaultSort);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const sortModeRef = useRef(sortMode);
  sortModeRef.current = sortMode;

  const filterSuffix = buildathonFilter ? `&buildathon=${encodeURIComponent(buildathonFilter)}` : "";

  const loadProjects = useCallback(() => {
    const requestedSort = sortMode;
    setLoading(true);
    setProjects([]);
    setHasMore(false);
    loadingMoreRef.current = false;
    bxApi(`/projects?limit=${PAGE_SIZE}&offset=0&sort=${sortMode}${filterSuffix}`)
      .then((r) => r.json())
      .then((d) => {
        if (sortModeRef.current !== requestedSort) return;
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        setProjects(list);
        setVotedIds(d.votedProjectIds || d.votedIds || d.voted_ids || []);
        setHasMore(PAGE_SIZE < (d.totalCount || 0));
      })
      .finally(() => {
        if (sortModeRef.current === requestedSort) setLoading(false);
      });
  }, [sortMode, filterSuffix]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    const requestedSort = sortMode;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    bxApi(`/projects?limit=${PAGE_SIZE}&offset=${projects.length}&sort=${sortMode}${filterSuffix}`)
      .then((r) => r.json())
      .then((d) => {
        if (sortModeRef.current !== requestedSort) return;
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        if (list.length === 0) {
          setHasMore(false);
          return;
        }
        setProjects((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const deduped = list.filter((p: Project) => !seen.has(p.id));
          const next = [...prev, ...deduped];
          setHasMore(next.length < (d.totalCount || 0));
          return next;
        });
        const newVoted = d.votedProjectIds || d.votedIds || d.voted_ids || [];
        if (newVoted.length) setVotedIds((prev) => Array.from(new Set([...prev, ...newVoted])));
      })
      .finally(() => { loadingMoreRef.current = false; setLoadingMore(false); });
  }, [hasMore, projects.length, sortMode, filterSuffix]);

  const loadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProjects();
    loadUser();
  }, [loadProjects, loadUser, refreshKey]);

  // Refetch user when login completes elsewhere in the app
  useEffect(() => {
    const handler = () => loadUser();
    window.addEventListener("bx:login-success", handler);
    return () => window.removeEventListener("bx:login-success", handler);
  }, [loadUser]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleSignIn = () => {
    openLoginDialog(() => { loadUser(); loadProjects(); });
  };

  const handleVote = async (projectId: string | number) => {
    if (!user) {
      handleSignIn();
      return;
    }
    const res = await bxApi("/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) return;
    const result = await res.json();
    if (result.voted) {
      setVotedIds((ids) => [...ids, projectId]);
      setVoteAnimId(projectId);
      setTimeout(() => setVoteAnimId(null), 500);
      const btn = document.querySelector(`[data-vote-id="${projectId}"]`) as HTMLElement;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const container = document.createElement("div");
        container.style.cssText = `position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9999;`;
        const dots: HTMLElement[] = [];
        [0, 55, 110, 170, 230, 300].forEach(deg => {
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
          dots.push(dot);
        });
        document.body.appendChild(container);
        requestAnimationFrame(() => {
          dots.forEach(dot => {
            dot.style.transform = `translate(calc(-50% + ${dot.dataset.tx}px), calc(-50% + ${dot.dataset.ty}px)) scale(0)`;
            dot.style.opacity = "0";
          });
        });
        setTimeout(() => container.remove(), 550);
      }
    } else {
      setVotedIds((ids) => ids.filter((id) => id !== projectId));
    }
    const w = result.weighted ?? result.weighted_votes ?? result.weightedVotes ?? 0;
    const rv = result.raw ?? result.raw_votes ?? result.rawVotes ?? 0;
    setProjects(prev => {
      const updated = prev.map(p => p.id === projectId ? { ...p, weighted: w, raw: rv } : p);
      if (sortMode === "top") {
        updated.sort((a, b) => b.weighted - a.weighted);
      }
      return updated;
    });
  };

  const regularProjects = featuredEnabled ? projects.filter(p => !p.featured) : projects;
  const empty = emptyState ?? DEFAULT_EMPTY;

  return (
    <>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <h1 className="responsive-h1 hero-title" style={{
          fontSize: isMobile ? 28 : isTablet ? 36 : 44, fontWeight: 400,
          fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10,
        }}>
          {headerTitle}
        </h1>
        <p style={{ fontSize: T.bodyLg, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
          {headerSubtitle}
        </p>
      </div>

      {/* Sort Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {([
          { key: "trending" as const, label: "Trending" },
          { key: "new" as const, label: "New" },
          { key: "top" as const, label: "Top" },
        ]).map(tab => {
          const active = sortMode === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSortMode(tab.key)}
              style={{
                padding: isMobile ? "6px 14px" : "6px 18px",
                borderRadius: 20,
                border: active ? "none" : `1px solid ${C.border}`,
                background: active ? C.accent : "transparent",
                color: active ? C.accentFg : C.textSec,
                fontSize: T.bodySm, fontWeight: 550, fontFamily: "var(--sans)",
                cursor: "pointer", transition: "all 0.2s",
                ...(isMobile ? { flex: 1 } : {}),
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && projects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)} skeleton-card`} style={{
              padding: "16px 0",
              borderBottom: `1px solid ${C.borderLight}`,
            }}>
              <div className="desktop-tablet-only-block">
                <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "90%" }} />
              </div>
              <div className="desktop-only-flex" style={{ alignItems: "center", gap: 8 }}>
                <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 13, width: 80 }} />
              </div>
              <div className="mobile-only" style={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 13, width: "90%" }} />
                </div>
                <div className="skeleton" style={{ width: 48, height: 42, borderRadius: 10, flexShrink: 0 }} />
              </div>
              <div className="mobile-only" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 13, width: 80 }} />
                </div>
                <div className="skeleton" style={{ height: 13, width: 70 }} />
              </div>
              <div className="desktop-tablet-only">
                <div className="skeleton" style={{ width: 60, height: 34, borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="fade-up stagger-2 list-item-hover" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "64px 24px", textAlign: "center",
        }}>
          {empty.icon && <div style={{ fontSize: 40, marginBottom: 16 }}>{empty.icon}</div>}
          <div style={{
            fontSize: T.title, fontWeight: 500, color: C.text,
            fontFamily: "var(--serif)", marginBottom: 8,
          }}>
            {empty.title}
          </div>
          <div style={{
            fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
            fontWeight: 400, maxWidth: 360, lineHeight: 1.5,
          }}>
            {empty.description}
          </div>
        </div>
      ) : (
        <>
          {/* Host picks */}
          {featuredEnabled && projects.filter(p => p.featured).map(fp => (
            <div key={fp.id} className="fade-up stagger-2 list-item-hover" style={{
              padding: "20px 24px", marginBottom: 24,
              background: C.surface, border: `1px solid ${C.goldBorder}`,
              borderRadius: 14, cursor: "pointer",
            }} onClick={() => navigate(`/projects/${fp.slug || fp.id}`)}>
              <div style={{
                fontSize: T.badge, fontWeight: 720, color: C.gold,
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: 12, fontFamily: "var(--sans)",
              }}>
                {"✦"} Host pick this week
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: T.subtitle, fontWeight: 500, color: C.text, fontFamily: "var(--serif)", marginBottom: 2 }}>
                    {fp.name}
                  </div>
                  <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                    {fp.tagline}
                  </div>
                  {fp.accolade && (
                    <div style={{ marginTop: 8 }}>
                      <AccoladeBadge accolade={fp.accolade} />
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: T.heading, fontWeight: 400, color: C.text, fontFamily: "var(--serif)",
                }}>
                  {fp.weighted.toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {/* Project list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {regularProjects.map((p, i) => (
              <div
                key={p.id}
                className={`fade-up stagger-${Math.min(i + 3, 6)} list-item-hover project-card`}
                onClick={() => navigate(`/projects/${p.slug || p.id}`)}
                style={{
                  paddingTop: 16, paddingBottom: 16, cursor: "pointer",
                  borderBottom: `1px solid ${C.borderLight}`,
                  position: "relative", zIndex: regularProjects.length - i,
                }}
              >
                {/* Desktop/tablet: icon + product name + tagline */}
                <div className="desktop-tablet-only-block" style={{ minWidth: 0, alignItems: "center", gap: 12 }}>
                  <ProjectIcon title={p.name} description={p.tagline} index={i} size={44} iconId={p.icon} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: T.bodyLg, fontWeight: 560, color: C.text,
                      fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                    }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
                      fontWeight: 400, lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {p.tagline}
                    </div>
                    <ProjectMetaRow project={p} />
                  </div>
                </div>

                {/* Mobile: icon + name + vote top row */}
                <div className="mobile-only" style={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <ProjectIcon title={p.name} description={p.tagline} index={i} size={44} iconId={p.icon} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: T.bodyLg, fontWeight: 560, color: C.text,
                        fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                      }}>
                        {p.name}
                      </div>
                      <div className="tagline-text" style={{
                        fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
                        fontWeight: 400, lineHeight: 1.3,
                      }}>
                        {p.tagline}
                      </div>
                      <ProjectMetaRow project={p} />
                    </div>
                  </div>
                  <div
                    data-vote-id={p.id}
                    onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                    className={voteAnimId === p.id ? "vote-pop-active" : ""}
                    style={{
                      flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      padding: "8px 12px", borderRadius: 10,
                      minWidth: 48,
                      border: votedIds.includes(p.id) ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                      background: votedIds.includes(p.id) ? C.accent : C.surface,
                      color: votedIds.includes(p.id) ? C.accentFg : C.text,
                      fontFamily: "var(--sans)",
                      cursor: "pointer",
                      transition: "border 0.25s, background 0.25s, color 0.25s",
                      position: "relative", overflow: "visible",
                    }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                      <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.label }}>{p.weighted.toLocaleString()}</span>
                  </div>
                </div>

                {/* Mobile: builder info horizontal */}
                <div className="mobile-only" style={{
                  alignItems: "center", justifyContent: "space-between", width: "100%",
                  background: `linear-gradient(135deg, ${C.borderLight}88, ${C.borderLight}44)`,
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 8,
                  padding: "6px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 4,
                      background: p.builder.companyColor || C.accent,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: T.micro, fontWeight: 800, color: "#fff",
                      fontFamily: "var(--sans)", flexShrink: 0,
                      overflow: "hidden", position: "relative",
                    }}>
                      {(p.builder.company || "")[0]}
                      {p.builder.company && <img src={getCompanyLogoUrl(p.builder.company, p.builder.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                    </span>
                    <span style={{ fontSize: T.bodySm, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>
                      {p.builder.company}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: T.bodySm, fontWeight: 400, color: C.textMute, fontFamily: "var(--sans)" }}>
                      {p.builder.name}
                    </span>
                    <div style={{ width: 5, height: 5, borderRadius: 5, background: C.text, flexShrink: 0 }} />
                  </div>
                </div>

                {/* Desktop/tablet: cycling builder */}
                <div className="desktop-only">
                  {(() => {
                    const allBuilders = [
                      { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent, companyLogo: p.builder.companyLogo },
                      ...(p.creators || []).filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent, companyLogo: c.companyLogo })),
                      ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent, companyLogo: c.companyLogo })),
                    ];
                    return <BuilderCycler builders={allBuilders} />;
                  })()}
                </div>

                {/* Desktop/tablet: votes */}
                <div className="desktop-tablet-only">
                  <div
                    data-vote-id={p.id}
                    onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                    className={voteAnimId === p.id ? "vote-pop-active" : ""}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 10,
                      minWidth: 72,
                      border: votedIds.includes(p.id) ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                      background: votedIds.includes(p.id) ? C.accent : C.surface,
                      fontSize: T.body, fontWeight: 650,
                      color: votedIds.includes(p.id) ? C.accentFg : C.text,
                      fontFamily: "var(--sans)",
                      cursor: "pointer",
                      transition: "border 0.25s, background 0.25s, color 0.25s",
                      position: "relative", overflow: "visible",
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                      <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.body }}>{p.weighted.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <div ref={sentinelRef} style={{ padding: "24px 0", display: "flex", justifyContent: "center" }}>
                {loadingMore && (
                  <div style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)" }}>Loading more projects…</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
