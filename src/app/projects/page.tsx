"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useResponsive } from "@/hooks/useMediaQuery";
import {
  C,
  T,
  ROLES,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import BuiltLogo from "@/components/BuiltLogo";

// ---- Inline Components ----

function Av({ initials, size = 32, role, src }: { initials: string; size?: number; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img src={src} alt={initials} style={{
        width: size, height: size, borderRadius: size,
        border: `1px solid ${C.borderLight}`, flexShrink: 0, objectFit: "cover",
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: r?.bg || C.accentSoft,
      color: r?.color || C.textSec,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 650,
      fontFamily: "var(--sans)", letterSpacing: "0.01em",
      border: `1px solid ${C.borderLight}`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function BuilderItemP({ b }: { b: { name: string; company: string; companyColor: string } }) {
  return (
    <div style={{ height: 36, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
          {b.company && <img src={getCompanyLogoUrl(b.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
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

function BuilderCycler({ builders }: { builders: { name: string; company: string; companyColor: string }[] }) {
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
            <BuilderItemP b={builders[active]} />
            <BuilderItemP b={builders[next]} />
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

// ---- Nav Tabs ----

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

// ---- Page ----

export default function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLoginDialog } = useLoginDialog();
  const { isMobile, isTablet } = useResponsive();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(() => {
    bxApi("/projects")
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
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoading(false));
  }, [loadProjects]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignIn = () => {
    openLoginDialog(() => {
      loadProjects();
      bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    });
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setVotedIds([]);
    setShowProfileMenu(false);
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
      {/* Nav */}
      <nav className="responsive-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.9)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 16px" : "0",
      }}>
        <div style={{
          ...(isMobile
            ? { maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }
            : {}),
        }}>
          {isMobile ? (
            <>
              <button onClick={() => setMobileMenuOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <BuiltLogo height={36} onClick={() => router.push("/")} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => router.push("/?submit=1")}
                  style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.border}`, background: C.surface,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s", flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                {userLoading ? (
                  <div style={{ width: 32, height: 32, borderRadius: 32 }} className="skeleton" />
                ) : user ? (
                  <div ref={profileMenuRef} style={{ position: "relative" }}>
                    <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Av initials={user.avatar} size={32} role={user.role} src={user.avatarUrl} />
                    </button>
                    {showProfileMenu && (
                      <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 100 }}>
                        <button onClick={() => { setShowProfileMenu(false); router.push("/my-projects"); }} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: C.text, fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: T.body }}>{"\u{1F4E6}"}</span> My Projects
                        </button>
                        <div style={{ height: 1, background: C.borderLight }} />
                        <button onClick={() => { setShowProfileMenu(false); handleSignOut(); }} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: "#B91C1C", fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: T.body }}>{"\u{1F6AA}"}</span> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleSignIn} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: T.label, fontWeight: 550, color: C.textSec, cursor: "pointer", fontFamily: "var(--sans)" }}>
                    Sign in
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ position: "relative", height: 65 }}>
              {/* Logo — pinned 96px from left */}
              <div style={{ position: "absolute", left: 96, top: 0, height: 65, display: "flex", alignItems: "center" }}>
                <BuiltLogo height={40} onClick={() => router.push("/")} />
              </div>
              {/* Right items — pinned 96px from right */}
              <div style={{ position: "absolute", right: 96, top: 0, height: 65, display: "flex", alignItems: "center", gap: 14 }}>
                <button style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
                  cursor: "pointer", fontFamily: "var(--sans)",
                  transition: "all 0.12s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                onClick={() => router.push("/")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  {isTablet ? "" : "Submit your project"}
                </button>
                {userLoading ? (
                  <div style={{ width: 32, height: 32, borderRadius: 32 }} className="skeleton" />
                ) : user ? (
                  <div ref={profileMenuRef} style={{ position: "relative" }}>
                    <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <Av initials={user.avatar} size={32} role={user.role} src={user.avatarUrl} />
                      <span style={{ fontSize: T.label, color: C.textSec, fontWeight: 500, fontFamily: "var(--sans)" }}>{user.name.split(" ")[0]}</span>
                      <span style={{ fontSize: 9, color: C.textMute, transform: showProfileMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>{"\u25BC"}</span>
                    </button>
                    {showProfileMenu && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 100,
                      }}>
                        <button onClick={() => { setShowProfileMenu(false); router.push("/my-projects"); }} style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "none",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: C.text,
                          fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span style={{ fontSize: T.body }}>{"\u{1F4E6}"}</span> My Projects
                        </button>
                        <div style={{ height: 1, background: C.borderLight }} />
                        <button onClick={handleSignOut} style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "none",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: "#B91C1C",
                          fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span style={{ fontSize: T.body }}>{"\u{1F6AA}"}</span> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleSignIn} style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.surface,
                    fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
                    cursor: "pointer", fontFamily: "var(--sans)",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >
                    Sign in
                  </button>
                )}
              </div>
              {/* Tabs — inside content-aligned container */}
              <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px", height: 65, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {NAV_TABS.map(t => {
                    const active = pathname === t.href;
                    return (
                      <button key={t.href} onClick={() => router.push(t.href)} style={{
                        padding: isTablet ? "18px 12px" : "18px 18px", border: "none", background: "none", cursor: "pointer",
                        fontSize: T.body, fontWeight: active ? 600 : 400,
                        color: active ? C.text : C.textMute,
                        fontFamily: "var(--sans)",
                        borderBottom: active ? `2px solid ${C.text}` : "2px solid transparent",
                        transition: "color 0.25s ease, border-color 0.25s ease, font-weight 0.25s ease",
                        letterSpacing: "0.005em",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.textSec; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMute; }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {portalMounted && createPortal(
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{
            position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.35)",
            opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? "auto" : "none",
            transition: "opacity 0.25s ease", visibility: mobileMenuOpen ? "visible" : "hidden",
          }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 9999, background: C.bg,
            boxShadow: mobileMenuOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease",
            display: "flex", flexDirection: "column", visibility: mobileMenuOpen ? "visible" : "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60, borderBottom: `1px solid ${C.borderLight}` }}>
              <BuiltLogo height={36} />
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => { setMobileMenuOpen(false); router.push(t.href); }} style={{
                  padding: "12px 14px", border: "none", background: pathname === t.href ? C.accentSoft : "none",
                  borderRadius: 10, cursor: "pointer", fontSize: T.body, fontWeight: pathname === t.href ? 600 : 450,
                  color: pathname === t.href ? C.text : C.textSec, fontFamily: "var(--sans)", textAlign: "left",
                }}>{t.label}</button>
              ))}
              <div style={{ height: 1, background: C.borderLight, margin: "8px 6px" }} />
              <button onClick={() => { setMobileMenuOpen(false); router.push("/"); }} style={{
                padding: "12px 14px", border: "none", background: "none", borderRadius: 10, cursor: "pointer",
                fontSize: T.body, fontWeight: 500, color: C.textSec, fontFamily: "var(--sans)", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Submit your project
              </button>
            </div>
          </div>
        </>, document.body
      )}

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
                gridTemplateColumns: isMobile ? undefined : "1fr 1fr auto",
                alignItems: isMobile ? undefined : "center",
                gap: isMobile ? 8 : isTablet ? 16 : 48,
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
                    gridTemplateColumns: isMobile ? undefined : isTablet ? "1fr auto auto" : "1fr 1fr auto",
                    alignItems: isMobile ? undefined : "center",
                    gap: isMobile ? 8 : isTablet ? 16 : 48,
                    position: "relative", zIndex: projects.length - i,
                  }}
                >
                  {/* Left: product name + tagline */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: T.bodyLg, fontWeight: 560, color: C.text,
                      fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                    }}>
                      {p.name}
                    </div>
                    <div className={isMobile ? "line-clamp-2" : undefined} style={{
                      fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)",
                      fontWeight: 400, lineHeight: 1.3,
                      ...(!isMobile ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}),
                    }}>
                      {p.tagline}
                    </div>
                  </div>

                  {/* Center: cycling builder (hidden on mobile) */}
                  {!isMobile && (() => {
                    const allBuilders = [
                      { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent },
                      ...(p.creators || []).filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                      ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                    ];
                    return <BuilderCycler builders={allBuilders} />;
                  })()}

                  {/* Bottom row on mobile: builder + votes */}
                  {isMobile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {(() => {
                        const allBuilders = [
                          { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent },
                          ...(p.creators || []).filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                          ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                        ];
                        return <BuilderCycler builders={allBuilders} />;
                      })()}
                      <div
                        onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                        style={{
                          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 10, minWidth: 72,
                          border: votedIds.includes(p.id) ? `1.5px solid ${C.brand}` : `1px solid ${C.border}`,
                          background: votedIds.includes(p.id) ? C.brandSoft : C.surface,
                          fontSize: T.body, fontWeight: 650,
                          color: votedIds.includes(p.id) ? C.brand : C.text,
                          fontFamily: "var(--sans)", cursor: "pointer",
                          transition: "border 0.25s, background 0.25s, color 0.25s",
                        }}>
                        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                            <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.body, lineHeight: 1 }}>{p.weighted.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                      style={{
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 10, minWidth: 72,
                        border: votedIds.includes(p.id) ? `1.5px solid ${C.brand}` : `1px solid ${C.border}`,
                        background: votedIds.includes(p.id) ? C.brandSoft : C.surface,
                        fontSize: T.body, fontWeight: 650,
                        color: votedIds.includes(p.id) ? C.brand : C.text,
                        fontFamily: "var(--sans)", cursor: "pointer",
                        transition: "border 0.25s, background 0.25s, color 0.25s",
                      }}>
                      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                          <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: T.body, lineHeight: 1 }}>{p.weighted.toLocaleString()}</span>
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
