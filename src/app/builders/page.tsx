"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
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
      fontSize: 9.5, fontWeight: 650, letterSpacing: "0.04em",
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
      fontSize: 10.5, fontWeight: 550, color: C.textSec,
      fontFamily: "var(--sans)",
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 4,
        background: companyColor || C.textMute, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 7, fontWeight: 800, color: "#fff",
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Dialog state
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderProfile | null>(null);
  const [builderProjects, setBuilderProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bxApi("/members").then((r) => r.json()).then((d) => {
      setBuilders((d.members || []).map((m: Record<string, unknown>) => normalizeMember(m)));
    }).finally(() => setLoading(false));
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
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
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.9)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 32px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <span
              onClick={() => router.push("/")}
              style={{
                fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
                color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
              }}
            >
              Built <span style={{ fontSize: 13, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
            </span>
            <div style={{ display: "flex", gap: 0 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => router.push(t.href)} style={{
                  padding: "18px 18px", border: "none", background: "none",
                  fontSize: 13.5, fontWeight: pathname === t.href ? 600 : 400,
                  color: pathname === t.href ? C.text : C.textMute,
                  fontFamily: "var(--sans)",
                  borderBottom: pathname === t.href ? `2px solid ${C.text}` : "2px solid transparent",
                  transition: "all 0.15s", letterSpacing: "0.005em",
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={{
              padding: "8px 18px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface,
              fontSize: 12.5, fontWeight: 550, color: C.textSec,
              cursor: "pointer", fontFamily: "var(--sans)",
              transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            onClick={() => router.push("/")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Submit your project
            </button>
            {user ? (
              <div ref={profileMenuRef} style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Av initials={user.avatar} size={32} role={user.role} src={user.avatarUrl} />
                  <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500, fontFamily: "var(--sans)" }}>{user.name.split(" ")[0]}</span>
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
                      fontSize: 13, fontWeight: 500, color: C.text,
                      fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 14 }}>{"\u{1F4E6}"}</span> My Projects
                    </button>
                    <div style={{ height: 1, background: C.borderLight }} />
                    <button onClick={handleSignOut} style={{
                      width: "100%", padding: "12px 16px", border: "none", background: "none",
                      fontSize: 13, fontWeight: 500, color: "#B91C1C",
                      fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <span style={{ fontSize: 14 }}>{"\u{1F6AA}"}</span> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleSignIn} style={{
                padding: "8px 18px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 12.5, fontWeight: 550, color: C.textSec,
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
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            The people who build
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
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
            <p style={{ fontSize: 14, color: C.textMute, padding: "40px 0", textAlign: "center" }}>
              No builders found.
            </p>
          ) : null}
          {builders.map((b, i) => (
            <div
              key={b._id || i}
              className={`fade-up stagger-${Math.min(i + 1, 6)}`}
              onClick={() => openBuilderDialog(b)}
              style={{
                padding: "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, cursor: "pointer",
                display: "flex", gap: 16, alignItems: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                fontSize: 14, fontWeight: 650, color: C.textMute,
                fontFamily: "var(--sans)", width: 28, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <Av initials={b.avatar} size={44} role={b.role} src={b.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{b.name}</span>
                  <Badge role={b.role} />
                  <CompanyTag company={b.company} companyColor={b.companyColor} />
                </div>
                {b.bio && (
                  <p style={{ fontSize: 13, color: C.textSec, fontFamily: "var(--sans)", margin: "0 0 4px", fontWeight: 400 }}>{b.bio}</p>
                )}
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.textMute, fontFamily: "var(--sans)" }}>
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
          <div ref={dialogRef} style={{
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
                    <span style={{ fontSize: 18, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>{selectedBuilder.name}</span>
                    <Badge role={selectedBuilder.role} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <CompanyTag company={selectedBuilder.company} companyColor={selectedBuilder.companyColor} />
                    {selectedBuilder.city && (
                      <span style={{ fontSize: 12, color: C.textMute, fontFamily: "var(--sans)" }}>{selectedBuilder.city}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuilder(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.borderLight}`, background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 16, color: C.textMute,
                    transition: "all 0.12s", flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
                >{"\u00D7"}</button>
              </div>
              {selectedBuilder.bio && (
                <p style={{ fontSize: 13, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, margin: "12px 0 0", lineHeight: 1.5 }}>
                  {selectedBuilder.bio}
                </p>
              )}
            </div>

            {/* Projects */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)",
              }}>
                Projects ({loadingProjects ? "..." : builderProjects.length})
              </div>

              {loadingProjects ? (
                <p style={{ fontSize: 13, color: C.textMute, textAlign: "center", padding: "24px 0" }}>Loading...</p>
              ) : builderProjects.length === 0 ? (
                <p style={{ fontSize: 13, color: C.textMute, textAlign: "center", padding: "24px 0" }}>No projects yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {builderProjects.map(p => (
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
                      <div style={{ fontSize: 14.5, fontWeight: 560, color: C.text, fontFamily: "var(--sans)", marginBottom: 3 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 13, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, marginBottom: 8 }}>
                        {p.tagline}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: C.textMute, fontFamily: "var(--sans)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, opacity: 0.5 }}>{"\u25B3"}</span>
                          {p.weighted.toLocaleString()}
                        </span>
                        {p.stack && p.stack.length > 0 && (
                          <span>{p.stack.slice(0, 3).join(", ")}{p.stack.length > 3 ? ` +${p.stack.length - 3}` : ""}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
