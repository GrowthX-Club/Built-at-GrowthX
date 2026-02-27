"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  T,
  ROLES,
  type BuilderProfile,
  normalizeUser,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import BuiltLogo from "@/components/BuiltLogo";

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

const NAV_TABS = [
  { href: "/projects", label: "Projects" },
  { href: "/builders", label: "Builders" },
];

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLoginDialog } = useLoginDialog();
  const { override } = useNavOverride();
  const { isMobile, isTablet } = useResponsive();

  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => { setPortalMounted(true); }, []);

  const reloadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => { reloadUser(); }, [reloadUser]);

  useEffect(() => {
    const handler = () => reloadUser();
    window.addEventListener("bx:login-success", handler);
    return () => window.removeEventListener("bx:login-success", handler);
  }, [reloadUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateUnderline = useCallback(() => {
    const checkActive = (href: string) => {
      if (href === "/projects") return pathname === "/" || pathname === "/projects";
      return pathname === href;
    };
    const activeTab = NAV_TABS.find(t => checkActive(t.href));
    if (activeTab) {
      const el = tabsRef.current[activeTab.href];
      if (el) {
        setUnderlineStyle({ left: el.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [pathname]);

  useLayoutEffect(() => {
    updateUnderline();
  }, [updateUnderline]);

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

  const isTabActive = (href: string) => {
    if (href === "/projects") return pathname === "/" || pathname === "/projects";
    return pathname === href;
  };

  return (
    <>
      <nav className="responsive-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(248,247,244,0.45)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 16px" : "0",
      }}>
        <div style={{
          ...(isMobile
            ? { maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }
            : {}),
        }}>
          {isMobile ? (
            <>
              {override ? (
                <button onClick={() => router.push(override.backHref)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : (
                <button onClick={() => setMobileMenuOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
              )}
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
                        <button onClick={() => { setShowProfileMenu(false); router.push("/settings"); }} style={{ width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: C.text, fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: T.body }}>{"\u2699\uFE0F"}</span> Settings
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
              <div style={{ position: "absolute", right: 96, top: 0, height: 65, display: "flex", alignItems: "center", gap: 14, zIndex: 1 }}>
                <button className="submit-btn" style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  fontSize: T.bodySm, fontWeight: 550, color: C.textSec,
                  cursor: "pointer", fontFamily: "var(--sans)",
                  transition: "color 0.25s, border-color 0.25s, box-shadow 0.25s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseMove={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
                }}
                onClick={() => router.push("/?submit=1")}
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
                        <button onClick={() => { setShowProfileMenu(false); router.push("/settings"); }} style={{
                          width: "100%", padding: "12px 16px", border: "none", background: "none",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 500, color: C.text,
                          fontFamily: "var(--sans)", textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <span style={{ fontSize: T.body }}>{"\u2699\uFE0F"}</span> Settings
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
              {/* Tabs or override (back + title) — inside content-aligned container */}
              <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px", height: 65, display: "flex", alignItems: "center", position: "relative" }}>
                {override ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                    <button
                      onClick={() => router.push(override.backHref)}
                      style={{
                        border: "none", background: "none", cursor: "pointer",
                        fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
                        fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                        padding: 0, transition: "color 0.12s", flexShrink: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = C.text}
                      onMouseLeave={e => e.currentTarget.style.color = C.textSec}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      Back
                    </button>
                    <span style={{
                      fontSize: T.body, fontWeight: 550, color: C.text, fontFamily: "var(--sans)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      flex: 1, textAlign: "center",
                    }}>
                      {override.title}
                    </span>
                    {/* Spacer to balance the back button for centering */}
                    <div style={{ width: 60, flexShrink: 0 }} />
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 0 }}>
                      {NAV_TABS.map(t => {
                        const active = isTabActive(t.href);
                        return (
                          <button key={t.href} ref={el => { tabsRef.current[t.href] = el; }} onClick={() => { router.push(t.href); window.scrollTo(0, 0); }} style={{
                            padding: isTablet ? "18px 12px" : "18px 18px", border: "none", background: "none", cursor: "pointer",
                            fontSize: T.body,
                            color: active ? C.text : C.textMute,
                            fontFamily: "var(--sans)",
                            transition: "color 0.25s ease",
                            letterSpacing: "0.005em",
                            position: "relative",
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.textSec; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textMute; }}
                          >
                            <span style={{ fontWeight: 600, visibility: "hidden" }}>{t.label}</span>
                            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: active ? 600 : 400 }}>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{
                      position: "absolute", bottom: 0, height: 2,
                      background: C.text, borderRadius: 1,
                      left: underlineStyle.left, width: underlineStyle.width,
                      transition: "left 0.3s ease, width 0.3s ease",
                    }} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Spacer to offset fixed nav height */}
      <div className="nav-spacer" />

      {/* Mobile side drawer — portaled to body */}
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
              {NAV_TABS.map(t => {
                const active = isTabActive(t.href);
                return (
                  <button key={t.href} onClick={() => { setMobileMenuOpen(false); router.push(t.href); window.scrollTo(0, 0); }} style={{
                    padding: "12px 14px", border: "none", background: active ? C.accentSoft : "none",
                    borderRadius: 10, cursor: "pointer", fontSize: T.body, fontWeight: active ? 600 : 450,
                    color: active ? C.text : C.textSec, fontFamily: "var(--sans)", textAlign: "left",
                  }}>{t.label}</button>
                );
              })}
              <div style={{ height: 1, background: C.borderLight, margin: "8px 6px" }} />
              <button onClick={() => { setMobileMenuOpen(false); router.push("/?submit=1"); }} style={{
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
    </>
  );
}
