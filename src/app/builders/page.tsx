"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  T,
  ROLES,
  type BuilderProfile,
  type Project,
  normalizeMember,
  normalizeUser,
  normalizeProject,
  getCompanyLogoUrl,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import BuiltLogo from "@/components/BuiltLogo";

// ---- Inline Components ----

function Av({ initials, size = 32, role, src }: { initials: string; size?: number; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img
        src={src}
        alt={initials}
        style={{
          width: size, height: size, borderRadius: size,
          border: `1px solid ${C.borderLight}`, flexShrink: 0,
          objectFit: "cover",
        }}
      />
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

function Badge({ role }: { role: string }) {
  const r = ROLES[role];
  if (!r) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: T.badge, fontWeight: 650, letterSpacing: "0.04em",
      padding: "2px 6px", borderRadius: 4,
      color: r.color, background: r.bg,
      fontFamily: "var(--sans)", textTransform: "uppercase", lineHeight: 1,
    }}>
      {r.label}
    </span>
  );
}

function CompanyTag({ company, companyColor }: { company?: string; companyColor?: string }) {
  if (!company) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: T.caption, fontWeight: 550, color: C.textSec,
      fontFamily: "var(--sans)",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 4,
        background: companyColor || C.textMute, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: T.micro, fontWeight: 800, color: "#fff",
        overflow: "hidden", position: "relative",
      }}>
        {company[0]}
        <img src={getCompanyLogoUrl(company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      </span>
      {company}
    </span>
  );
}

// ---- Nav Tabs ----

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

// ---- Page ----

export default function BuildersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLoginDialog } = useLoginDialog();
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);

  // Dialog state
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderProfile | null>(null);
  const [builderProjects, setBuilderProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bxApi("/members").then((r) => r.json()).then((d) => {
      setBuilders((d.members || []).map((m: Record<string, unknown>) => normalizeMember(m)));
    }).finally(() => setLoading(false));
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user))).finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) setSelectedBuilder(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignIn = () => {
    openLoginDialog(() => {
      bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    });
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
  };

  const openBuilderDialog = (b: BuilderProfile) => {
    setSelectedBuilder(b);
    setBuilderProjects([]);
    setLoadingProjects(true);
    bxApi("/projects")
      .then(r => r.json())
      .then(d => {
        const all = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        const matched = all.filter((p: Project) => {
          if (p.builder?.name === b.name) return true;
          if ((p.creators || []).some(c => c.name === b.name)) return true;
          if (p.collabs?.some(c => c.name === b.name)) return true;
          return false;
        });
        setBuilderProjects(matched);
      })
      .finally(() => setLoadingProjects(false));
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
                      <div style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 100,
                      }}>
                        <button onClick={() => { setShowProfileMenu(false); router.push("/my-projects"); }} style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "none",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: C.text,
                          fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{ fontSize: T.body }}>{"\u{1F4E6}"}</span> My Projects
                        </button>
                        <div style={{ height: 1, background: C.borderLight }} />
                        <button onClick={() => { setShowProfileMenu(false); handleSignOut(); }} style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "none",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: "#B91C1C",
                          fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                        }}>
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
                    <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
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
                          fontSize: T.bodySm, fontWeight: 500, color: C.text,
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
                          fontSize: T.bodySm, fontWeight: 500, color: "#B91C1C",
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
                    fontFamily: "var(--sans)",
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

      {/* Mobile side drawer — portaled to body */}
      {portalMounted && createPortal(
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(0,0,0,0.35)",
              opacity: mobileMenuOpen ? 1 : 0,
              pointerEvents: mobileMenuOpen ? "auto" : "none",
              transition: "opacity 0.25s ease",
              visibility: mobileMenuOpen ? "visible" : "hidden",
            }}
          />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0,
            width: 280, zIndex: 9999,
            background: C.bg,
            boxShadow: mobileMenuOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s ease",
            display: "flex", flexDirection: "column",
            visibility: mobileMenuOpen ? "visible" : "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px", height: 60, borderBottom: `1px solid ${C.borderLight}`,
            }}>
              <BuiltLogo height={36} />
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => { setMobileMenuOpen(false); router.push(t.href); }} style={{
                  padding: "12px 14px", border: "none", background: pathname === t.href ? C.accentSoft : "none",
                  borderRadius: 10, cursor: "pointer", fontSize: T.body,
                  fontWeight: pathname === t.href ? 600 : 450,
                  color: pathname === t.href ? C.text : C.textSec,
                  fontFamily: "var(--sans)", textAlign: "left",
                }}>
                  {t.label}
                </button>
              ))}
              <div style={{ height: 1, background: C.borderLight, margin: "8px 6px" }} />
              <button onClick={() => { setMobileMenuOpen(false); router.push("/"); }} style={{
                padding: "12px 14px", border: "none", background: "none", borderRadius: 10,
                cursor: "pointer", fontSize: T.body, fontWeight: 500, color: C.textSec,
                fontFamily: "var(--sans)", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Submit your project
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            The people who build
          </h1>
          <p style={{ fontSize: T.bodyLg, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Reputation is earned by shipping. Ranked by cumulative score across projects, buildathons, and collaborations.
          </p>
        </div>

        {/* Builder list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loading && builders.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, display: "flex", gap: 16, alignItems: "center",
              }}>
                <div className="skeleton" style={{ width: 28, height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 44 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div className="skeleton" style={{ height: 15, width: 120 }} />
                    <div className="skeleton" style={{ height: 14, width: 50, borderRadius: 4 }} />
                  </div>
                  <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 6 }} />
                  <div style={{ display: "flex", gap: 16 }}>
                    <div className="skeleton" style={{ height: 12, width: 60 }} />
                    <div className="skeleton" style={{ height: 12, width: 50 }} />
                  </div>
                </div>
              </div>
            ))
          ) : builders.length === 0 ? (
            <p style={{ fontSize: T.body, color: C.textMute, padding: "40px 0", textAlign: "center" }}>
              No builders found.
            </p>
          ) : null}
          {builders.map((b, i) => (
            <div
              key={b._id || i}
              className={`fade-up stagger-${Math.min(i + 1, 6)} list-item-hover`}
              onClick={() => openBuilderDialog(b)}
              style={{
                padding: isMobile ? "14px 16px" : "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, cursor: "pointer",
                display: "flex", gap: isMobile ? 12 : 16, alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                fontSize: T.body, fontWeight: 650, color: C.textMute,
                fontFamily: "var(--sans)", width: 28, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <Av initials={b.avatar} size={isMobile ? 36 : 44} role={b.role} src={b.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{b.name}</span>
                  <Badge role={b.role} />
                  <CompanyTag company={b.company} companyColor={b.companyColor} />
                </div>
                {b.bio && (
                  <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", margin: "0 0 4px", fontWeight: 400 }}>{b.bio}</p>
                )}
                <div style={{ display: "flex", gap: 16, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                  {b.city && <span>{b.city}</span>}
                  <span>{b.shipped} shipped</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Builder projects dialog */}
      {selectedBuilder && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div
            onClick={() => setSelectedBuilder(null)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
              animation: "fadeIn 0.2s ease",
            }}
          />
          <div ref={dialogRef} className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 520,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden", maxHeight: "80vh", display: "flex", flexDirection: "column",
            animation: "fadeUp 0.25s ease-out",
          }}>
            {/* Header */}
            <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Av initials={selectedBuilder.avatar} size={52} role={selectedBuilder.role} src={selectedBuilder.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: T.subtitle, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{selectedBuilder.name}</span>
                    <Badge role={selectedBuilder.role} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <CompanyTag company={selectedBuilder.company} companyColor={selectedBuilder.companyColor} />
                    {selectedBuilder.city && (
                      <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>{selectedBuilder.city}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilder(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.borderLight}`, background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
                    transition: "all 0.12s", flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
                >{"\u00D7"}</button>
              </div>
              {selectedBuilder.bio && (
                <p style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, margin: "12px 0 0", lineHeight: 1.5 }}>
                  {selectedBuilder.bio}
                </p>
              )}
            </div>

            {/* Projects */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              <div style={{
                fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)",
              }}>
                Projects ({loadingProjects ? "..." : builderProjects.length})
              </div>

              {loadingProjects ? (
                <p style={{ fontSize: T.bodySm, color: C.textMute, textAlign: "center", padding: "24px 0" }}>Loading...</p>
              ) : builderProjects.length === 0 ? (
                <p style={{ fontSize: T.bodySm, color: C.textMute, textAlign: "center", padding: "24px 0" }}>No projects yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {builderProjects.map(p => {
                    const isCreator = p.builder?.name === selectedBuilder.name || (p.creators || []).some(c => c.name === selectedBuilder.name);
                    return (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedBuilder(null); router.push(`/projects/${p.id}`); }}
                        style={{
                          padding: "14px 18px", background: C.bg,
                          border: `1px solid ${C.borderLight}`, borderRadius: 12,
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.transform = "none"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <div style={{ fontSize: T.body, fontWeight: 560, color: C.text, fontFamily: "var(--sans)" }}>
                            {p.name}
                          </div>
                          <span style={{
                            fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                            padding: "2px 7px", borderRadius: 4,
                            fontFamily: "var(--sans)",
                            background: isCreator ? "#D1FAE5" : C.accentSoft,
                            color: isCreator ? "#059669" : C.textMute,
                          }}>
                            {isCreator ? "Creator" : "Collaborator"}
                          </span>
                        </div>
                        <div style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, marginBottom: 8 }}>
                          {p.tagline}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: T.label, opacity: 0.5 }}>{"\u25B3"}</span>
                            {p.weighted.toLocaleString()}
                          </span>
                          {p.stack && p.stack.length > 0 && (
                            <span>{p.stack.slice(0, 3).join(", ")}{p.stack.length > 3 ? ` +${p.stack.length - 3}` : ""}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
