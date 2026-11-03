"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  C,
  T,
  ROLES,
  type BuilderProfile,
  normalizeUser,
  cdnImage,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import { useTheme } from "@/context/ThemeContext";
import BuiltLogo from "@/components/BuiltLogo";
import { Link } from "react-router";

function Av({ initials, size = 32, role, src }: { initials: string; size?: number; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img
        src={cdnImage(src, 96)}
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
  { href: "/", label: "Projects" },
  { href: "/build-sprint", label: "Build Sprint" },
  { href: "/events", label: "Events" },
  { href: "/skills", label: "Skills" },
  { href: "/builders", label: "Builders" },
];

// Which tab a page belongs to (event pages sit under Events, Build Sprint has its own tab).
function tabFor(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/" || p === "/projects") return "/";
  if (p.startsWith("/build-sprint")) return "/build-sprint";
  if (p.startsWith("/events") || p === "/opencode" || p === "/sarvam") return "/events";
  if (p === "/skills") return "/skills";
  if (p === "/builders") return "/builders";
  return "";
}

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLoginDialog } = useLoginDialog();
  const { override, voteState, showVoteInNav } = useNavOverride();
  const { isMobile, isTablet } = useResponsive();
  const { theme, triggerFlip, isAnimating } = useTheme();

  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPortalMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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


  const handleSignIn = () => {
    openLoginDialog(() => {
      bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    });
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => { });
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
  };

  const isTabActive = (href: string) => tabFor(pathname) === href;

  const moon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
  const sun = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
  const menuItem = (onClick: () => void, label: string, danger = false) => (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 16, fontWeight: 500,
      color: danger ? C.errorText : C.text, textAlign: "left", transition: "background 0.1s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? C.errorSoft : C.accentSoft; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >{label}</button>
  );

  // Product Hunt's header: logo, text tabs, then the lights switch, Submit and the account on the right.
  // Phones: menu (or back on a project page), logo, the lights switch, Submit, account.
  return (
    <>
      <nav className={`nav-bar${scrolled ? " is-scrolled" : ""}`}>
        <div className="nav-inner">
          {isMobile || isTablet ? (
            override ? (
              <button className="nav-icon-btn" style={{ border: "none" }} onClick={() => router.push(override.backHref)} aria-label="Back">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            ) : (
              <button className="nav-icon-btn" style={{ border: "none" }} onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu" aria-expanded={mobileMenuOpen}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            )
          ) : null}
          <BuiltLogo height={isMobile ? 34 : 38} onClick={() => router.push("/")} />
          <div className="nav-tabs">
            {NAV_TABS.map(t => {
              const active = isTabActive(t.href);
              return (
                <Link key={t.href} to={t.href} prefetch="intent" className={`nav-tab${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => window.scrollTo(0, 0)}>
                  {t.label}
                </Link>
              );
            })}
          </div>
          <div className="nav-right" style={isMobile || isTablet ? { marginLeft: "auto", gap: 8 } : undefined}>
            {voteState && !isMobile && showVoteInNav && (
              <button onClick={voteState.onVote} aria-pressed={voteState.hasVoted} className={`nav-pill${voteState.hasVoted ? " is-dark" : ""}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" fill={voteState.hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voteState.hasVoted ? 0 : 2} strokeLinejoin="round" />
                </svg>
                {voteState.count.toLocaleString()}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button
                className="nav-icon-btn"
                onClick={triggerFlip}
                disabled={isAnimating}
                aria-label={theme === "light" ? "Turn off the lights" : "Turn on the lights"}
                onMouseEnter={() => setShowThemeTooltip(true)}
                onMouseLeave={() => setShowThemeTooltip(false)}
              >
                {theme === "light" ? moon : sun}
              </button>
              {showThemeTooltip && !isAnimating && !isMobile && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "8px 14px",
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 100, fontSize: 14, fontWeight: 500, color: C.text,
                }}>
                  {theme === "light" ? "Turn off the lights" : "Turn on the lights"}
                </div>
              )}
            </div>
            <button className="nav-pill" onClick={() => router.push("/?submit=1")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
              Submit
            </button>
            {userLoading ? (
              <div style={{ width: 40, height: 40, borderRadius: 40 }} className="skeleton" />
            ) : user ? (
              <div ref={profileMenuRef} style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(v => !v)} aria-label="Your account" aria-expanded={showProfileMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <Av initials={user.avatar} size={40} role={user.role} src={user.avatarUrl} />
                </button>
                {showProfileMenu && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 180, overflow: "hidden", zIndex: 100,
                  }}>
                    {menuItem(() => { setShowProfileMenu(false); router.push("/my-projects"); }, "My projects")}
                    <div style={{ height: 1, background: C.borderLight }} />
                    {menuItem(() => { setShowProfileMenu(false); router.push("/settings"); }, "Settings")}
                    <div style={{ height: 1, background: C.borderLight }} />
                    {menuItem(() => { setShowProfileMenu(false); handleSignOut(); }, "Sign out", true)}
                  </div>
                )}
              </div>
            ) : (
              <button className="nav-pill is-dark" onClick={handleSignIn}>Sign in</button>
            )}
          </div>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {NAV_TABS.map(t => {
                const active = isTabActive(t.href);
                return (
                  <Link key={t.href} to={t.href} aria-current={active ? "page" : undefined} onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }} style={{
                    padding: "12px 14px", background: active ? C.accentSoft : "none",
                    borderRadius: 10, fontSize: T.body, fontWeight: active ? 600 : 400, textDecoration: "none",
                    color: active ? C.text : C.textSec, fontFamily: "var(--sans)", textAlign: "left",
                  }}>{t.label}</Link>
                );
              })}
              <div style={{ height: 1, background: C.border, margin: "12px 14px" }} />
              <button
                onClick={triggerFlip}
                disabled={isAnimating}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                style={{
                  padding: "12px 14px", border: "none", background: "none", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, fontSize: T.body, color: C.textSec,
                  fontFamily: "var(--sans)", textAlign: "left",
                }}
              >
                {theme === "light" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                )}
                {theme === "light" ? "Turn off the lights" : "Turn on the lights"}
              </button>
            </div>
          </div>
        </>, document.body
      )}
    </>
  );
}
