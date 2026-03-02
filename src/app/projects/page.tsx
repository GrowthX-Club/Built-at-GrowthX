"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useResponsive } from "@/hooks/useMediaQuery";
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
import ProjectIcon from "@/components/ProjectIcon";
import { useLoginDialog } from "@/context/LoginDialogContext";

// ---- Inline Components ----

function BuilderItemP({ b, horizontal }: { b: { name: string; company: string; companyColor: string; companyLogo?: string }; horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: T.bodySm, fontFamily: "var(--sans)",
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4,
            background: b.companyColor || C.accent,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: T.micro, fontWeight: 800, color: "#fff",
            fontFamily: "var(--sans)", flexShrink: 0,
            overflow: "hidden", position: "relative",
          }}>
            {b.company[0]}
            {b.company && <img src={getCompanyLogoUrl(b.company, b.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          </span>
          <span style={{ fontWeight: 600, color: C.text }}>{b.company}</span>
        </div>
        <div style={{
          fontSize: T.label, fontWeight: 400, color: C.textMute,
          fontFamily: "var(--sans)", lineHeight: 1.2,
        }}>
          {b.name}
        </div>
      </div>
    );
  }
  return (
    <div style={{ height: 36, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: T.bodySm, fontFamily: "var(--sans)", marginBottom: 2,
      }}>
        <span style={{
          width: 14, height: 14, borderRadius: 4,
          background: b.companyColor || C.accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: T.micro, fontWeight: 800, color: "#fff",
          fontFamily: "var(--sans)", flexShrink: 0,
          overflow: "hidden", position: "relative",
        }}>
          {b.company[0]}
          {b.company && <img src={getCompanyLogoUrl(b.company, b.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </span>
        <span style={{ fontWeight: 600, color: C.text }}>{b.company}</span>
      </div>
      <div style={{
        fontSize: T.label, fontWeight: 400, color: C.textMute,
        fontFamily: "var(--sans)", lineHeight: 1.2,
      }}>
        {b.name}
      </div>
    </div>
  );
}

function BuilderCycler({ builders, horizontal }: { builders: { name: string; company: string; companyColor: string; companyLogo?: string }[]; horizontal?: boolean }) {
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
    <div style={{ textAlign: "left", minWidth: horizontal ? undefined : 120, width: horizontal ? "100%" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, overflow: "hidden", height: ITEM_H, flex: horizontal ? 1 : undefined }}>
          <div style={{
            display: "flex", flexDirection: "column",
            transform: sliding ? `translateY(-${ITEM_H}px)` : "translateY(0)",
            transition: sliding ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}>
            <BuilderItemP b={builders[active]} horizontal={horizontal} />
            <BuilderItemP b={builders[next]} horizontal={horizontal} />
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

// ---- Page ----

export default function ProjectsPage() {
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();
  const { isMobile, isTablet } = useResponsive();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);


  const loadProjects = useCallback(() => {
    bxApi("/projects?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p))
          .filter((p: Project) => p.enabled !== false);
        list.sort((a: Project, b: Project) => b.weighted - a.weighted);
        setProjects(list);
        setVotedIds(d.votedProjectIds || d.votedIds || d.voted_ids || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProjects();
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)));
  }, [loadProjects]);

  const handleSignIn = () => {
    openLoginDialog(() => {
      loadProjects();
      bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    });
  };

  const handleVote = async (projectId: string | number) => {
    if (!user) { handleSignIn(); return; }
    const res = await bxApi("/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) return;
    const result = await res.json();
    if (result.voted) {
      setVotedIds((ids) => [...ids, projectId]);
    } else {
      setVotedIds((ids) => ids.filter((id) => id !== projectId));
    }
    const w = result.weighted ?? result.weighted_votes ?? result.weightedVotes ?? 0;
    const rv = result.raw ?? result.raw_votes ?? result.rawVotes ?? 0;
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, weighted: w, raw: rv } : p));
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{
            fontSize: 44, fontWeight: 400, color: C.text,
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
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "16px 0",
                borderBottom: `1px solid ${C.borderLight}`,
                display: isMobile ? "flex" : "grid",
                flexDirection: isMobile ? "column" : undefined,
                gridTemplateColumns: isMobile ? undefined : "2fr 1fr 80px",
                alignItems: isMobile ? undefined : "center",
                gap: isMobile ? 8 : isTablet ? 16 : 24,
              }}>
                <div>
                  <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 13, width: "90%" }} />
                </div>
                {!isMobile && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 13, width: 80 }} />
                  </div>
                )}
                <div className="skeleton" style={{ width: 60, height: 34, borderRadius: 10 }} />
              </div>
            ))}
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
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  className={`fade-up stagger-${Math.min(i + 3, 6)} list-item-hover`}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{
                    paddingTop: 16, paddingBottom: 16, cursor: "pointer",
                    borderBottom: `1px solid ${C.borderLight}`,
                    display: isMobile ? "flex" : "grid",
                    flexDirection: isMobile ? "column" : undefined,
                    gridTemplateColumns: isMobile ? undefined : "2fr 1fr 80px",
                    alignItems: isMobile ? undefined : "center",
                    gap: isMobile ? 8 : isTablet ? 16 : 24,
                    position: "relative", zIndex: projects.length - i,
                  }}
                >
                  {/* Top: product name + tagline + upvote (mobile: row with square button) */}
                  {isMobile ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ProjectIcon title={p.name} description={p.tagline} index={i} size={44} iconId={p.icon} />
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{
                          fontSize: T.bodyLg, fontWeight: 560, color: C.text,
                          fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                        }}>
                          {p.name}
                        </div>
                        <div className="line-clamp-2" style={{
                          fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
                          fontWeight: 400, lineHeight: 1.3,
                        }}>
                          {p.tagline}
                        </div>
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                        style={{
                          flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          padding: "8px 12px", borderRadius: 10, minWidth: 48,
                          border: votedIds.includes(p.id) ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                          background: votedIds.includes(p.id) ? C.accent : C.surface,
                          color: votedIds.includes(p.id) ? C.accentFg : C.text,
                          fontFamily: "var(--sans)", cursor: "pointer",
                          transition: "border 0.25s, background 0.25s, color 0.25s",
                          position: "relative", overflow: "visible",
                        }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                          <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                        <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.label }}>{p.weighted.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
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
                  )}

                  {/* Center: cycling builder */}
                  {(() => {
                    const allBuilders = [
                      { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent, companyLogo: p.builder.companyLogo },
                      ...(p.creators || []).filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent, companyLogo: c.companyLogo })),
                      ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent, companyLogo: c.companyLogo })),
                    ];
                    return <BuilderCycler builders={allBuilders} horizontal={isMobile} />;
                  })()}

                  {/* Upvote — desktop only (mobile is inline above) */}
                  {!isMobile && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                      style={{
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 10, minWidth: 72,
                        border: votedIds.includes(p.id) ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: votedIds.includes(p.id) ? C.accent : C.surface,
                        fontSize: T.body, fontWeight: 650,
                        color: votedIds.includes(p.id) ? C.accentFg : C.text,
                        fontFamily: "var(--sans)", cursor: "pointer",
                        transition: "border 0.25s, background 0.25s, color 0.25s",
                        position: "relative", overflow: "visible",
                      }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                      </svg>
                      <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.body }}>{p.weighted.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
