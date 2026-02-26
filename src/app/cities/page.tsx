"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  ROLES,
  type CityData,
  type BuilderProfile,
  normalizeUser,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";

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

// ---- Nav Tabs ----

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

// ---- Page ----

export default function CitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLoginDialog } = useLoginDialog();
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);

  useEffect(() => {
    bxApi("/cities").then((r) => r.json()).then((d) => setCities(d.cities || [])).finally(() => setLoading(false));
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user))).finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      {/* Nav */}
      <nav className="responsive-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.9)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 32px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          {isMobile ? (
            <>
              <button onClick={() => setMobileMenuOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span onClick={() => router.push("/")} style={{ fontSize: 20, fontWeight: 400, fontFamily: "var(--serif)", color: C.text, letterSpacing: "-0.02em", cursor: "pointer" }}>
                Built <span style={{ fontSize: 12, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
              </span>
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
                        <button onClick={() => { setShowProfileMenu(false); router.push("/my-projects"); }} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.text, fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{"\u{1F4E6}"}</span> My Projects
                        </button>
                        <div style={{ height: 1, background: C.borderLight }} />
                        <button onClick={() => { setShowProfileMenu(false); handleSignOut(); }} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#B91C1C", fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{"\u{1F6AA}"}</span> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleSignIn} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, fontSize: 12, fontWeight: 550, color: C.textSec, cursor: "pointer", fontFamily: "var(--sans)" }}>
                    Sign in
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: isTablet ? 24 : 40 }}>
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
                      padding: isTablet ? "18px 12px" : "18px 18px", border: "none", background: "none", cursor: "pointer",
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
                  {isTablet ? "" : "Submit your project"}
                </button>
                {userLoading ? (
                  <div style={{ width: 32, height: 32, borderRadius: 32 }} className="skeleton" />
                ) : user ? (
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
            </>
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
              <span style={{ fontSize: 20, fontWeight: 400, fontFamily: "var(--serif)", color: C.text, letterSpacing: "-0.02em" }}>
                Built <span style={{ fontSize: 12, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
              </span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {NAV_TABS.map(t => (
                <button key={t.href} onClick={() => { setMobileMenuOpen(false); router.push(t.href); }} style={{
                  padding: "12px 14px", border: "none", background: pathname === t.href ? C.accentSoft : "none",
                  borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: pathname === t.href ? 600 : 450,
                  color: pathname === t.href ? C.text : C.textSec, fontFamily: "var(--sans)", textAlign: "left",
                }}>{t.label}</button>
              ))}
              <div style={{ height: 1, background: C.borderLight, margin: "8px 6px" }} />
              <button onClick={() => { setMobileMenuOpen(false); router.push("/"); }} style={{
                padding: "12px 14px", border: "none", background: "none", borderRadius: 10, cursor: "pointer",
                fontSize: 15, fontWeight: 500, color: C.textSec, fontFamily: "var(--sans)", textAlign: "left",
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
        {/* <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 44, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            Where India builds
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            {cities.length} {cities.length === 1 ? "city" : "cities"}. One leaderboard. Ranked by shipping velocity, weighted by project quality.
          </p>
        </div> */}

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loading && cities.length === 0 ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "18px 24px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
                marginBottom: 6, display: "flex", gap: 16, alignItems: "center",
              }}>
                <div className="skeleton" style={{ width: 28, height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 17, width: 100, marginBottom: 4 }} />
                  <div className="skeleton" style={{ height: 12, width: 60 }} />
                </div>
                <div style={{ display: "flex", gap: 32 }}>
                  <div style={{ textAlign: "right" }}>
                    <div className="skeleton" style={{ height: 22, width: 40, marginBottom: 4 }} />
                    <div className="skeleton" style={{ height: 11, width: 45 }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="skeleton" style={{ height: 22, width: 30, marginBottom: 4 }} />
                    <div className="skeleton" style={{ height: 11, width: 45 }} />
                  </div>
                </div>
              </div>
            ))
          ) : cities.length === 0 ? (
            <p style={{ fontSize: 14, color: C.textMute, padding: "40px 0", textAlign: "center" }}>
              No cities yet. Ship a project to put your city on the map.
            </p>
          ) : null}
          {cities.map((city, i) => (
            <div key={city.name} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
              padding: "18px 24px", background: C.surface,
              border: `1px solid ${C.border}`, borderRadius: 14,
              marginBottom: 6,
              display: "flex", gap: isMobile ? 10 : 16, alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{
                fontSize: 15, fontWeight: 700, color: i < 3 ? C.text : C.textMute,
                fontFamily: "var(--sans)", width: 28, textAlign: "center", flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{city.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 550, color: C.text, fontFamily: "var(--sans)", marginBottom: 2 }}>
                  {city.name}
                </div>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 500 }}>{city.trend}</div>
              </div>
              <div style={{ display: "flex", gap: isMobile ? 16 : 32, fontSize: 13, fontFamily: "var(--sans)" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1 }}>
                    {city.builders.toLocaleString()}
                  </div>
                  <div style={{ color: C.textMute, fontSize: 11, marginTop: 2 }}>builders</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1 }}>
                    {city.shipped}
                  </div>
                  <div style={{ color: C.textMute, fontSize: 11, marginTop: 2 }}>shipped</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
