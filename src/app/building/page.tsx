"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  ROLES,
  type BuildingProject,
  type BuilderProfile,
  normalizeBuildingProject,
  normalizeUser,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";

// ---- Inline Components ----

function Av({ initials, size = 32, role }: { initials: string; size?: number; role?: string }) {
  const r = role ? ROLES[role] : undefined;
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

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    idea: { color: "#D97706", bg: "#FEF3C7", label: "Idea" },
    prototyping: { color: "#2563EB", bg: "#DBEAFE", label: "Prototyping" },
    beta: { color: "#059669", bg: "#D1FAE5", label: "Beta" },
  };
  const s = map[status] || map.idea;
  return (
    <span style={{
      fontSize: 10, fontWeight: 650, padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {s.label}
    </span>
  );
}

// ---- Nav Tabs ----

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

// ---- Page ----

export default function BuildingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [building, setBuilding] = useState<BuildingProject[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bxApi("/building").then((r) => r.json()).then((d) => {
      const raw = d.buildings || d.building || [];
      setBuilding(raw.map((p: Record<string, unknown>) => normalizeBuildingProject(p)));
    });
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignIn = () => { router.push("/login"); };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
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
              Built
            </span>
            <div style={{ display: "flex", gap: 0 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => router.push(t.href)} style={{
                  padding: "18px 18px", border: "none", background: "none", cursor: "pointer",
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
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            onClick={() => router.push("/")}
            >
              Submit project
            </button>
            {user ? (
              <div ref={profileMenuRef} style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <Av initials={user.avatar} size={32} role={user.role} />
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
                      cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.text,
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
                      cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#B91C1C",
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
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        {/* <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            What&apos;s being built right now
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Projects in progress. Follow a build, watch the journey, or offer your skills where they&apos;re needed.
          </p>
        </div> */}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {building.map((p, i) => (
            <div key={p.id} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
              padding: "24px 28px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 14,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18, fontWeight: 500, color: C.text, fontFamily: "var(--serif)" }}>{p.name}</span>
                    <StatusDot status={p.status} />
                  </div>
                  <p style={{ fontSize: 14.5, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, margin: 0 }}>
                    {p.tagline}
                  </p>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8, background: C.accentSoft,
                  fontSize: 13, fontWeight: 600, color: C.textSec, fontFamily: "var(--sans)", flexShrink: 0,
                }}>
                  {"\uD83D\uDC40"} {p.watchers}
                </div>
              </div>

              {/* Build log */}
              <div style={{
                padding: "14px 18px", borderRadius: 10,
                background: C.bg, border: `1px solid ${C.borderLight}`,
                marginBottom: 16,
              }}>
                <p style={{
                  fontSize: 13.5, lineHeight: 1.55, color: C.text,
                  fontFamily: "var(--mono)", margin: 0,
                }}>
                  {p.log}
                </p>
                <span style={{ fontSize: 11, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6, display: "block" }}>
                  {p.logDate}
                </span>
              </div>

              {p.help && (
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: C.blueSoft, border: "1px solid #BFDBFE", marginBottom: 16,
                }}>
                  <span style={{ fontSize: 13, color: C.blue, fontFamily: "var(--sans)", fontWeight: 500 }}>
                    {"\uD83E\uDD1D"} {p.help}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Av initials={p.builder.avatar} size={24} />
                  <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>{p.builder.name}</span>
                  <span style={{ color: C.textMute, fontSize: 8 }}>{"\u25CF"}</span>
                  <span style={{ fontSize: 12, color: C.textMute }}>{p.builder.city}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{
                    padding: "8px 20px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.surface,
                    cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                    color: C.text, fontFamily: "var(--sans)",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    Follow build
                  </button>
                  {p.help && (
                    <button style={{
                      padding: "8px 20px", borderRadius: 10,
                      border: "none", background: C.accent,
                      cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                      color: "#fff", fontFamily: "var(--sans)",
                      transition: "opacity 0.12s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      Offer help
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
