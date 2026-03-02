"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  C,
  T,
  STACK_META,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import RichTextEditor from "@/components/RichTextEditor";
import { descriptionCharCount } from "@/lib/editor-utils";
import ProjectIcon from "@/components/ProjectIcon";
// ---- UI Components ----

function BuilderItem({ b }: { b: { name: string; company: string; companyColor: string; companyLogo?: string } }) {
  return (
    <div style={{ height: 36, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{
        fontSize: T.bodySm, fontWeight: 600, color: C.text,
        fontFamily: "var(--sans)", marginBottom: 2, lineHeight: 1.2,
      }}>
        {b.name}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: T.label, fontFamily: "var(--sans)",
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
        <span style={{ fontWeight: 400, color: C.textMute }}>{b.company}</span>
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
    <div style={{ textAlign: "left", minWidth: 120 }}>
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

// ---- Main ----
export default function HomePageWrapper() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginDialog } = useLoginDialog();
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitData, setSubmitData] = useState({
    name: "", tagline: "", description: "",
    stack: [] as string[], stackInput: "",
    team: [] as { _id: string; name: string; avatar?: string; company?: string; companyColor?: string; role: 'creator' | 'collaborator' }[], teamInput: "",
    url: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);
  const [voteAnimId, setVoteAnimId] = useState<string | number | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const [collabResults, setCollabResults] = useState<{ _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingCollabs, setSearchingCollabs] = useState(false);
  const collabSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(() => {
    bxApi("/projects")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p))
          .filter((p: Project) => p.enabled !== false);
        list.sort((a: Project, b: Project) => b.weighted - a.weighted);
        setProjects(list);
        setVisibleCount(12);
        setVotedIds(d.votedProjectIds || d.votedIds || d.voted_ids || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoaded(true));
  }, []);

  useEffect(() => {
    loadProjects();
    loadUser();
  }, [loadProjects, loadUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collabDropdownRef.current && !collabDropdownRef.current.contains(e.target as Node)) setShowCollabDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, projects.length]);

  useEffect(() => {
    if (searchParams.get("submit") !== "1" || !userLoaded) return;
    router.replace("/", { scroll: false });
    if (!user) {
      openLoginDialog(() => { loadUser(); });
      return;
    }
    setShowSubmit(true);
    setSubmitStep(0);
    setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", team: [], teamInput: "", url: "" });
    setSubmitError("");
  }, [searchParams, user, userLoaded, router, openLoginDialog, loadUser]);

  const searchCollabs = (query: string) => {
    if (collabSearchTimer.current) clearTimeout(collabSearchTimer.current);
    if (query.length < 2) { setCollabResults([]); setShowCollabDropdown(false); setSearchingCollabs(false); return; }
    setSearchingCollabs(true);
    collabSearchTimer.current = setTimeout(() => {
      bxApi(`/users/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          const users = (d.users || []).map((u: Record<string, unknown>) => ({
            _id: u._id as string,
            name: u.name as string,
            avatar: (u.initials ?? u.avatar ?? '?') as string,
            avatarUrl: (u.avatar_url ?? undefined) as string | undefined,
            company: (u.company ?? '') as string,
            role: (u.role ?? '') as string,
          })).filter((u: { _id: string }) => !user?._id || u._id !== user._id);
          setCollabResults(users);
          setShowCollabDropdown(true);
        })
        .finally(() => setSearchingCollabs(false));
    }, 250);
  };

  const pickTeamMember = (u: { _id: string; name: string; avatar: string; company: string }) => {
    if (submitData.team.some(c => c._id === u._id)) return;
    const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
    let hash = 0;
    for (let i = 0; i < (u.company || "").length; i++) hash = (u.company || "").charCodeAt(i) + ((hash << 5) - hash);
    const cc = u.company ? colors[Math.abs(hash) % colors.length] : undefined;
    setSubmitData(d => ({
      ...d,
      team: [...d.team, { _id: u._id, name: u.name, avatar: u.avatar, company: u.company, companyColor: cc, role: 'collaborator' }],
      teamInput: "",
    }));
    setCollabResults([]);
    setShowCollabDropdown(false);
  };

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
      // Spawn burst particles portaled to body
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
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, weighted: w, raw: rv } : p));
  };

  const handleSubmitProject = async () => {
    if (!user) {
      handleSignIn();
      return;
    }
    setSubmitError("");

    // Client-side validation
    if (!submitData.name.trim()) {
      setSubmitError("Project name is required.");
      setSubmitStep(0);
      return;
    }
    if (!submitData.tagline.trim()) {
      setSubmitError("Tagline is required.");
      setSubmitStep(0);
      return;
    }
    if (submitData.url?.trim() && !/^https?:\/\/.+/.test(submitData.url.trim())) {
      setSubmitError("Please enter a valid URL starting with http:// or https://");
      setSubmitStep(0);
      return;
    }
    if (submitData.stack.length === 0) {
      setSubmitError("Add at least one tech stack item.");
      setSubmitStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const res = await bxApi("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: submitData.name.trim(),
          tagline: submitData.tagline.trim(),
          description: submitData.description,
          category: "AI",
          stack: submitData.stack,
          url: submitData.url?.trim() || undefined,
          creators: submitData.team.filter(c => c.role === 'creator').map(c => c._id),
          collabs: submitData.team.filter(c => c.role === 'collaborator').map(c => c._id),
        }),
      });
      if (res.ok) {
        setShowSubmit(false);
        setSubmitStep(0);
        setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", team: [], teamInput: "", url: "" });
        setSubmitError("");
        loadProjects();
      } else {
        const data = await res.json().catch(() => null);
        const msg = data?.message || data?.error;
        if (res.status === 401) {
          setSubmitError("Your session has expired. Please log in again.");
        } else if (res.status === 400 && msg) {
          setSubmitError(msg);
        } else {
          setSubmitError(msg || "Something went wrong. Please try again.");
        }
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const regularProjects = projects.filter(p => !p.featured);
  const visibleProjects = regularProjects.slice(0, visibleCount);
  const hasMore = visibleCount < regularProjects.length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "32px 32px 100px" }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1 hero-title" style={{
            fontSize: isMobile ? 28 : isTablet ? 36 : 44, fontWeight: 400,
            fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10,
          }}>
            What the community shipped
          </h1>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Products built by the GrowthX community. Ranked by the people who build.
          </p>
        </div>

        {loading && projects.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)} skeleton-card`} style={{
                padding: "16px 0",
                borderBottom: `1px solid ${C.borderLight}`,
              }}>
                {/* Desktop/tablet: name+tagline */}
                <div className="desktop-tablet-only-block">
                  <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 13, width: "90%" }} />
                </div>
                <div className="desktop-only-flex" style={{ alignItems: "center", gap: 8 }}>
                  <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 13, width: 80 }} />
                </div>
                {/* Mobile skeleton: name + vote top row */}
                <div className="mobile-only" style={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 13, width: "90%" }} />
                  </div>
                  <div className="skeleton" style={{ width: 48, height: 42, borderRadius: 10, flexShrink: 0 }} />
                </div>
                {/* Mobile skeleton: builder info horizontal */}
                <div className="mobile-only" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 13, width: 80 }} />
                  </div>
                  <div className="skeleton" style={{ height: 13, width: 70 }} />
                </div>
                {/* Desktop/tablet skeleton: vote */}
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
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <div style={{
              fontSize: T.title, fontWeight: 500, color: C.text,
              fontFamily: "var(--serif)", marginBottom: 8,
            }}>
              No projects yet
            </div>
            <div style={{
              fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
              fontWeight: 400, maxWidth: 360, lineHeight: 1.5,
            }}>
              Be the first to submit your project and show the GrowthX community what you&apos;ve built.
            </div>
          </div>
        ) : (
          <>
            {/* Host picks */}
            {projects.filter(p => p.featured).map(fp => (
              <div key={fp.id} className="fade-up stagger-2 list-item-hover" style={{
                padding: "20px 24px", marginBottom: 24,
                background: C.surface, border: `1px solid ${C.goldBorder}`,
                borderRadius: 14, cursor: "pointer",
              }} onClick={() => router.push(`/projects/${fp.id}`)}>
                <div style={{
                  fontSize: T.badge, fontWeight: 720, color: C.gold,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: 12, fontFamily: "var(--sans)",
                }}>
                  {"\u2726"} Host pick this week
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: T.subtitle, fontWeight: 500, color: C.text, fontFamily: "var(--serif)", marginBottom: 2 }}>
                      {fp.name}
                    </div>
                    <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                      {fp.tagline}
                    </div>
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
              {visibleProjects.map((p, i) => (
                <div
                  key={p.id}
                  className={`fade-up stagger-${Math.min(i + 3, 6)} list-item-hover project-card`}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{
                    paddingTop: 16, paddingBottom: 16, cursor: "pointer",
                    borderBottom: `1px solid ${C.borderLight}`,
                    position: "relative", zIndex: visibleProjects.length - i,
                  }}
                >
                  {/* Desktop/tablet: icon + product name + tagline (hidden on mobile via CSS) */}
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
                <div ref={sentinelRef} style={{ height: 1, width: "100%" }} />
              )}
            </div>
          </>
        )}
      </main>

      {/* ---- SUBMIT FLOW ---- */}
      {showSubmit && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowSubmit(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
              animation: "fadeIn 0.2s ease",
            }}
          />

          {/* Panel */}
          <div className={isMobile ? "responsive-modal-full" : "responsive-modal"} style={{
            position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 540,
            background: C.surface, borderRadius: isMobile ? 0 : 20,
            border: isMobile ? "none" : `1px solid ${C.border}`,
            boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: isMobile ? "auto" : "hidden",
            animation: "fadeUp 0.25s ease-out",
            ...(isMobile ? { height: "100%", maxHeight: "100vh" } : {}),
          }}>
            <style>{`
              .submit-input { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; }
              .submit-input:focus { border-color: ${C.accent}; }
              .submit-input::placeholder { color: ${C.textMute}; }
              .submit-input-lg { font-size: ${T.logo}px; font-weight: 500; font-family: var(--serif); border: none; padding: 0; background: transparent; }
              .submit-input-lg:focus { border: none; }
              .submit-textarea { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; resize: vertical; min-height: 100px; line-height: 1.5; }
              .submit-textarea:focus { border-color: ${C.accent}; }
              .submit-textarea::placeholder { color: ${C.textMute}; }
            `}</style>

            {/* Progress bar */}
            <div style={{ height: 3, background: C.borderLight }}>
              <div style={{
                height: 3, background: C.accent,
                width: `${((submitStep + 1) / 3) * 100}%`,
                transition: "width 0.3s ease",
                borderRadius: 3,
              }} />
            </div>

            {/* Header */}
            <div style={{
              padding: "20px 28px 0", display: "flex",
              alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{
                  fontSize: T.caption, fontWeight: 600, color: C.textMute,
                  fontFamily: "var(--sans)", letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 4,
                }}>
                  {["The basics", "The story", "Tech and team"][submitStep]}
                </div>
                <div style={{
                  fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 400,
                }}>
                  Step {submitStep + 1} of 3
                </div>
              </div>
              <button onClick={() => setShowSubmit(false)} style={{
                width: 32, height: 32, borderRadius: 32,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
              >{"\u00D7"}</button>
            </div>

            {/* Step content */}
            <div style={{ padding: "24px 28px 28px" }}>

              {/* Step 0: Name, tagline, URL */}
              {submitStep === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <input
                      className="submit-input submit-input-lg"
                      placeholder="Project name"
                      value={submitData.name}
                      onChange={e => setSubmitData(d => ({ ...d, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div>
                    <input
                      className="submit-input"
                      placeholder="One-line tagline (what does it do?)"
                      value={submitData.tagline}
                      onChange={e => setSubmitData(d => ({ ...d, tagline: e.target.value }))}
                      maxLength={100}
                      style={{ borderColor: submitData.tagline.length >= 100 ? "#DC2626" : undefined }}
                    />
                    <div style={{
                      fontSize: T.caption, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)",
                      color: submitData.tagline.length >= 90 ? (submitData.tagline.length >= 100 ? "#DC2626" : "#B45309") : C.textMute,
                      fontWeight: submitData.tagline.length >= 100 ? 600 : 400,
                    }}>
                      {submitData.tagline.length}/100{submitData.tagline.length >= 100 && " — limit reached"}
                    </div>
                  </div>
                  <div>
                    <input
                      className="submit-input"
                      placeholder="Product URL (https://...)"
                      value={submitData.url}
                      onChange={e => setSubmitData(d => ({ ...d, url: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: The story */}
              {submitStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{
                    fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
                    fontWeight: 400, lineHeight: 1.55, marginBottom: 20,
                  }}>
                    Write like you&apos;re telling a friend what you built and why. The best submissions answer three things:
                  </div>

                  <div style={{ marginBottom: 20, paddingLeft: 2 }}>
                    {[
                      { q: "The problem", hint: "What were you trying to solve?" },
                      { q: "The build", hint: "What did you make?" },
                      { q: "The outcome", hint: "What happened when people used it?" },
                    ].map((prompt, pi) => (
                      <div key={pi} style={{
                        display: "flex", alignItems: "baseline", gap: 8,
                        marginBottom: pi < 2 ? 8 : 0,
                      }}>
                        <span style={{
                          fontSize: T.label, fontWeight: 650, color: C.textMute,
                          fontFamily: "var(--mono)", minWidth: 16,
                        }}>
                          {pi + 1}.
                        </span>
                        <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                          <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <RichTextEditor
                    value={submitData.description}
                    onChange={(json) => setSubmitData(d => ({ ...d, description: json }))}
                    maxChars={1500}
                  />
                </div>
              )}

              {/* Step 2: Tech stack + collaborators */}
              {submitStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 10 }}>
                      Tech stack
                    </div>

                    {/* Selected stack */}
                    {submitData.stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {submitData.stack.map((s, si) => {
                          const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: "#fff" };
                          const logoUrl = getStackLogoUrl(s);
                          return (
                            <span key={si} style={{
                              display: "inline-flex", alignItems: "center", gap: 7,
                              padding: "5px 10px 5px 6px", borderRadius: 20,
                              background: C.surface, border: `1.5px solid ${C.accent}`,
                              fontSize: T.bodySm, color: C.text, fontWeight: 500,
                              fontFamily: "var(--sans)",
                            }}>
                              <span style={{
                                width: 20, height: 20, borderRadius: 5,
                                background: meta.bg, color: meta.color,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: T.micro, fontWeight: 750, fontFamily: "var(--sans)",
                                flexShrink: 0, letterSpacing: "-0.02em",
                                position: "relative", overflow: "hidden",
                              }}>
                                {meta.icon}
                                {logoUrl && (
                                  <img
                                    src={logoUrl}
                                    alt={s}
                                    style={{
                                      position: "absolute", top: 0, left: 0,
                                      width: 20, height: 20, borderRadius: 5,
                                      objectFit: "contain", background: "#fff",
                                    }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                )}
                              </span>
                              {s}
                              <span
                                onClick={ev => { ev.stopPropagation(); setSubmitData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) })); }}
                                style={{
                                  cursor: "pointer", fontSize: T.bodySm, color: C.textMute,
                                  lineHeight: 1, marginLeft: 2,
                                  transition: "color 0.1s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                                onMouseLeave={e => { e.currentTarget.style.color = C.textMute; }}
                              >{"\u00D7"}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick-pick suggestions */}
                    {(() => {
                      const suggestions = [
                        "Next.js", "React", "Python", "Node.js", "TypeScript",
                        "Claude API", "OpenAI", "OpenClaw", "Supabase", "Firebase", "MongoDB",
                        "PostgreSQL", "Tailwind CSS", "Flutter", "FastAPI", "Vercel",
                        "AWS", "Docker", "Stripe", "Prisma", "Go",
                      ];
                      const available = suggestions.filter(s => !submitData.stack.includes(s));
                      if (available.length === 0) return null;
                      return (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
                            Popular — tap to add
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {available.map(s => {
                              const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: "#fff" };
                              const logoUrl = getStackLogoUrl(s);
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setSubmitData(d => ({ ...d, stack: [...d.stack, s] }))}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "4px 10px 4px 5px", borderRadius: 20,
                                    background: C.bg, border: `1px solid ${C.borderLight}`,
                                    fontSize: T.label, color: C.textSec, fontWeight: 450,
                                    fontFamily: "var(--sans)", cursor: "pointer",
                                    transition: "all 0.15s",
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surface; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textSec; e.currentTarget.style.background = C.bg; }}
                                >
                                  <span style={{
                                    width: 18, height: 18, borderRadius: 4,
                                    background: meta.bg, color: meta.color,
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    fontSize: T.micro, fontWeight: 750, fontFamily: "var(--sans)",
                                    flexShrink: 0, letterSpacing: "-0.02em",
                                    position: "relative", overflow: "hidden",
                                  }}>
                                    {meta.icon}
                                    {logoUrl && (
                                      <img
                                        src={logoUrl}
                                        alt={s}
                                        style={{
                                          position: "absolute", top: 0, left: 0,
                                          width: 18, height: 18, borderRadius: 4,
                                          objectFit: "contain", background: "#fff",
                                        }}
                                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                      />
                                    )}
                                  </span>
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Custom input */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="submit-input"
                        placeholder="Or type a custom one..."
                        value={submitData.stackInput}
                        onChange={e => setSubmitData(d => ({ ...d, stackInput: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === "Enter" && submitData.stackInput.trim()) {
                            const val = submitData.stackInput.trim();
                            if (!submitData.stack.includes(val)) {
                              setSubmitData(d => ({
                                ...d,
                                stack: [...d.stack, val],
                                stackInput: "",
                              }));
                            } else {
                              setSubmitData(d => ({ ...d, stackInput: "" }));
                            }
                          }
                        }}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      {submitData.stackInput.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const val = submitData.stackInput.trim();
                            if (val && !submitData.stack.includes(val)) {
                              setSubmitData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                            } else {
                              setSubmitData(d => ({ ...d, stackInput: "" }));
                            }
                          }}
                          style={{
                            padding: "0 14px", borderRadius: 8,
                            border: "none", background: C.accent,
                            fontSize: T.label, fontWeight: 600, color: "#fff",
                            cursor: "pointer", fontFamily: "var(--sans)",
                            whiteSpace: "nowrap", transition: "opacity 0.12s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                        >Add</button>
                      )}
                    </div>
                    <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 5, fontFamily: "var(--sans)" }}>
                      Press enter or click Add
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.borderLight }} />

                  <div ref={collabDropdownRef}>
                    <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
                      Team members (optional)
                    </div>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <input
                        className="submit-input"
                        placeholder="Search by name..."
                        value={submitData.teamInput}
                        onChange={e => { const v = e.target.value; setSubmitData(d => ({ ...d, teamInput: v })); searchCollabs(v); }}
                        onFocus={() => { if (collabResults.length > 0) setShowCollabDropdown(true); }}
                      />
                      {searchingCollabs && (
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                          Searching...
                        </span>
                      )}
                      {!searchingCollabs && submitData.teamInput.trim().length >= 2 && collabResults.length === 0 && (
                        <div style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6 }}>
                          No members found for &ldquo;{submitData.teamInput.trim()}&rdquo;
                        </div>
                      )}
                      {showCollabDropdown && collabResults.length > 0 && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
                          maxHeight: 200, overflowY: "auto",
                        }}>
                          {collabResults.map(u => {
                            const already = submitData.team.some(c => c._id === u._id);
                            return (
                              <button key={u._id} onClick={() => pickTeamMember(u)} disabled={already} style={{
                                width: "100%", padding: "10px 14px", border: "none", background: "none",
                                cursor: already ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10,
                                textAlign: "left", transition: "background 0.1s", opacity: already ? 0.4 : 1,
                              }}
                              onMouseEnter={e => { if (!already) e.currentTarget.style.background = C.accentSoft; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                              >
                                <div style={{
                                  width: 28, height: 28, borderRadius: 28,
                                  background: C.accentSoft, color: C.textSec,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: T.badge, fontWeight: 650, fontFamily: "var(--sans)",
                                  border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                }}>
                                  {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: T.bodySm, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>{u.name}</div>
                                  {(u.role || u.company) && (
                                    <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)" }}>
                                      {u.role}{u.role && u.company ? " \u00B7 " : ""}{u.company}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {submitData.team.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {submitData.team.map((c, ci) => (
                          <span key={ci} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "5px 10px 5px 8px", borderRadius: 8,
                            background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                            fontSize: T.bodySm, color: C.text, fontWeight: 480,
                            fontFamily: "var(--sans)",
                          }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: 18,
                              background: C.borderLight, color: C.textSec,
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              fontSize: T.micro, fontWeight: 650, flexShrink: 0,
                            }}>
                              {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                            </span>
                            {c.name}
                            <span
                              onClick={ev => {
                                ev.stopPropagation();
                                setSubmitData(d => ({
                                  ...d,
                                  team: d.team.map((t, idx) => idx === ci
                                    ? { ...t, role: t.role === 'creator' ? 'collaborator' : 'creator' }
                                    : t
                                  ),
                                }));
                              }}
                              style={{
                                fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                                padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                                fontFamily: "var(--sans)", userSelect: "none",
                                background: c.role === 'creator' ? "#D1FAE5" : C.borderLight,
                                color: c.role === 'creator' ? "#059669" : C.textMute,
                                transition: "all 0.15s",
                              }}
                            >
                              {c.role === 'creator' ? 'Creator' : 'Collaborator'}
                            </span>
                            <span
                              onClick={ev => { ev.stopPropagation(); setSubmitData(d => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) })); }}
                              style={{
                                cursor: "pointer", fontSize: T.body, color: C.textMute,
                                lineHeight: 1, marginTop: -1,
                              }}
                            >{"\u00D7"}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 6, fontFamily: "var(--sans)" }}>
                      Search for GrowthX members — tap role to toggle Creator / Collaborator
                    </div>
                  </div>
                </div>
              )}

              {/* Error message */}
              {submitError && (
                <div style={{
                  marginTop: 16, padding: "10px 14px", borderRadius: 10,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  fontSize: T.bodySm, color: "#B91C1C", fontFamily: "var(--sans)",
                  fontWeight: 450, lineHeight: 1.45,
                }}>
                  {submitError}
                </div>
              )}

              {/* Navigation */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginTop: submitError ? 16 : 28,
              }}>
                {submitStep > 0 ? (
                  <button onClick={() => { setSubmitError(""); setSubmitStep(s => s - 1); }} disabled={submitting} style={{
                    padding: "9px 20px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: "transparent",
                    fontSize: T.bodySm, fontWeight: 500, color: C.textSec,
                    cursor: submitting ? "default" : "pointer", fontFamily: "var(--sans)",
                    transition: "all 0.12s", opacity: submitting ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >Back</button>
                ) : <div />}

                <button
                  onClick={() => {
                    setSubmitError("");
                    if (submitStep === 0) {
                      if (!submitData.name.trim()) { setSubmitError("Project name is required."); return; }
                      if (!submitData.tagline.trim()) { setSubmitError("Tagline is required."); return; }
                      if (submitData.url?.trim() && !/^https?:\/\/.+/.test(submitData.url.trim())) { setSubmitError("Please enter a valid URL starting with http:// or https://"); return; }
                      setSubmitStep(1);
                    } else if (submitStep === 1) {
                      if (descriptionCharCount(submitData.description) === 0) { setSubmitError("Description is required. Tell us what you built."); return; }
                      if (descriptionCharCount(submitData.description) > 1500) { setSubmitError("Description must be 1500 characters or less."); return; }
                      setSubmitStep(2);
                    } else {
                      if (submitData.stack.length === 0) { setSubmitError("Add at least one tech stack item."); return; }
                      handleSubmitProject();
                    }
                  }}
                  disabled={(submitStep === 0 && !submitData.name.trim()) || submitting}
                  style={{
                    padding: "9px 24px", borderRadius: 10,
                    border: "none",
                    background: ((submitStep === 0 && !submitData.name.trim()) || submitting) ? C.borderLight : C.accent,
                    fontSize: T.bodySm, fontWeight: 600,
                    color: ((submitStep === 0 && !submitData.name.trim()) || submitting) ? C.textMute : "#fff",
                    cursor: ((submitStep === 0 && !submitData.name.trim()) || submitting) ? "default" : "pointer",
                    fontFamily: "var(--sans)",
                    transition: "all 0.15s",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Submitting\u2026" : submitStep === 2 ? "Submit" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Sign-in handled via redirect to GrowthX login */}
    </div>
  );
}
