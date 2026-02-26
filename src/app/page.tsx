"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  C,
  ROLES,
  STACK_META,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
  getStackLogoUrl,
} from "@/types";
import { bxApi, clearToken } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";

// ---- UI Components ----

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

function BuilderItem({ b }: { b: { name: string; company: string; companyColor: string } }) {
  return (
    <div style={{ height: 36, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: C.text,
        fontFamily: "var(--sans)", marginBottom: 2, lineHeight: 1.2,
      }}>
        {b.name}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 11.5, fontFamily: "var(--sans)",
      }}>
        <span style={{
          width: 12, height: 12, borderRadius: 3,
          background: b.companyColor || C.accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 6, fontWeight: 800, color: "#fff",
          fontFamily: "var(--sans)", flexShrink: 0,
          overflow: "hidden", position: "relative",
        }}>
          {b.company[0]}
          {b.company && <img src={getCompanyLogoUrl(b.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </span>
        <span style={{ fontWeight: 400, color: C.textMute }}>{b.company}</span>
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
  const [showMembersOnly, setShowMembersOnly] = useState(false);
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
  const [userLoading, setUserLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);
  const [voteAnimId, setVoteAnimId] = useState<string | number | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => { setPortalMounted(true); }, []);
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
        setVotedIds(d.votedProjectIds || d.votedIds || d.voted_ids || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    loadProjects();
    loadUser();
  }, [loadProjects, loadUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (collabDropdownRef.current && !collabDropdownRef.current.contains(e.target as Node)) setShowCollabDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchParams.get("submit") === "1" && user) {
      router.replace("/", { scroll: false });
      if (!user.isMembershipActive) {
        setShowMembersOnly(true);
        return;
      }
      setShowSubmit(true);
      setSubmitStep(0);
      setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", team: [], teamInput: "", url: "" });
      setSubmitError("");
    }
  }, [searchParams, user, router]);

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

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setVotedIds([]);
    setShowProfileMenu(false);
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
      setTimeout(() => setVoteAnimId(null), 800);
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
          description: submitData.description.trim(),
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

  const tabs = [
    { id: "built", label: "Projects", href: "/projects" },
    { id: "builders", label: "Builders", href: "/builders" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      {/* Nav */}
      <nav className="responsive-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(248,247,244,0.9)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 16px" : "0 32px",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          {isMobile ? (
            <>
              {/* Mobile nav: Hamburger | Logo | Avatar/Sign-in */}
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span style={{
                fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
                color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
              }}>
                Built <span style={{ fontSize: 13, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => {
                    if (!user) { handleSignIn(); return; }
                    if (!user.isMembershipActive) { setShowMembersOnly(true); return; }
                    setShowSubmit(true);
                    setSubmitStep(0);
                    setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", team: [], teamInput: "", url: "" });
                    setSubmitError("");
                  }}
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
                    <button onClick={() => setShowProfileMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
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
                    padding: "8px 14px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.surface,
                    fontSize: 12.5, fontWeight: 550, color: C.textSec,
                    cursor: "pointer", fontFamily: "var(--sans)",
                    transition: "all 0.12s",
                  }}>
                    Sign in
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Tablet / Desktop nav */}
              <div style={{ display: "flex", alignItems: "center", gap: isTablet ? 24 : 40 }}>
                <span style={{
                  fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
                  color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
                }}>
                  Built <span style={{ fontSize: 13, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
                </span>
                <div style={{ display: "flex", gap: 0 }}>
                  {tabs.map((t, i) => (
                    <button key={t.id} onClick={() => router.push(t.href)} style={{
                      padding: isTablet ? "18px 12px" : "18px 18px", border: "none", background: "none", cursor: "pointer",
                      fontSize: 13.5, fontWeight: i === 0 ? 600 : 400,
                      color: i === 0 ? C.text : C.textMute,
                      fontFamily: "var(--sans)",
                      borderBottom: i === 0 ? `2px solid ${C.text}` : "2px solid transparent",
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
                onClick={() => {
                  if (!user) { handleSignIn(); return; }
                  if (!user.isMembershipActive) { setShowMembersOnly(true); return; }
                  setShowSubmit(true);
                  setSubmitStep(0);
                  setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", team: [], teamInput: "", url: "" });
                  setSubmitError("");
                }}
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
            </>
          )}
        </div>
      </nav>

      {/* Mobile side drawer — portaled to body so it overlays everything */}
      {portalMounted && createPortal(
        <>
          {/* Backdrop */}
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
          {/* Drawer */}
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
            {/* Drawer header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px", height: 60, borderBottom: `1px solid ${C.borderLight}`,
            }}>
              <span style={{
                fontSize: 20, fontWeight: 400, fontFamily: "var(--serif)",
                color: C.text, letterSpacing: "-0.02em",
              }}>
                Built <span style={{ fontSize: 12, fontFamily: "var(--sans)", fontWeight: 400, color: C.textMute }}>at</span> GrowthX
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Drawer links */}
            <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {tabs.map((t, i) => (
                <button key={t.id} onClick={() => { setMobileMenuOpen(false); router.push(t.href); }} style={{
                  padding: "12px 14px", border: "none", background: i === 0 ? C.accentSoft : "none",
                  borderRadius: 10, cursor: "pointer",
                  fontSize: 15, fontWeight: i === 0 ? 600 : 450,
                  color: i === 0 ? C.text : C.textSec,
                  fontFamily: "var(--sans)", textAlign: "left",
                  transition: "all 0.15s",
                }}>
                  {t.label}
                </button>
              ))}
              <div style={{ height: 1, background: C.borderLight, margin: "8px 6px" }} />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/?submit=1");
                }}
                style={{
                  padding: "12px 14px", border: "none", background: "none", borderRadius: 10,
                  cursor: "pointer", fontSize: 15, fontWeight: 500, color: C.textSec,
                  fontFamily: "var(--sans)", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Submit your project
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "20px 16px 80px" : "32px 32px 100px" }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{
            fontSize: isMobile ? 28 : isTablet ? 36 : 44, fontWeight: 400, color: C.text,
            fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10,
          }}>
            What the community shipped
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Products built by the GrowthX community. Ranked by the people who build.
          </p>
        </div>

        {loading && projects.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "16px 0",
                borderBottom: `1px solid ${C.borderLight}`,
                ...(isMobile ? {
                  display: "flex", flexDirection: "column" as const, gap: 8,
                } : {
                  display: "grid",
                  gridTemplateColumns: isTablet ? "1fr auto auto" : "1fr 1fr auto",
                  alignItems: "center",
                  gap: isTablet ? 16 : 48,
                }),
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
                {isMobile ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 13, width: 80 }} />
                    </div>
                    <div className="skeleton" style={{ width: 60, height: 34, borderRadius: 10 }} />
                  </div>
                ) : (
                  <div className="skeleton" style={{ width: 60, height: 34, borderRadius: 10 }} />
                )}
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="fade-up stagger-2" style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <div style={{
              fontSize: 20, fontWeight: 500, color: C.text,
              fontFamily: "var(--serif)", marginBottom: 8,
            }}>
              No projects yet
            </div>
            <div style={{
              fontSize: 15, color: C.textSec, fontFamily: "var(--sans)",
              fontWeight: 400, maxWidth: 360, lineHeight: 1.5,
            }}>
              Be the first to submit your project and show the GrowthX community what you&apos;ve built.
            </div>
          </div>
        ) : (
          <>
            {/* Host picks */}
            {projects.filter(p => p.featured).map(fp => (
              <div key={fp.id} className="fade-up stagger-2" style={{
                padding: "20px 24px", marginBottom: 24,
                background: C.surface, border: `1px solid ${C.goldBorder}`,
                borderRadius: 14, cursor: "pointer",
              }} onClick={() => router.push(`/projects/${fp.id}`)}>
                <div style={{
                  fontSize: 10, fontWeight: 720, color: C.gold,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: 12, fontFamily: "var(--sans)",
                }}>
                  {"\u2726"} Host pick this week
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 500, color: C.text, fontFamily: "var(--serif)", marginBottom: 2 }}>
                      {fp.name}
                    </div>
                    <div style={{ fontSize: 14, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                      {fp.tagline}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 400, color: C.text, fontFamily: "var(--serif)",
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
                  className={`fade-up stagger-${Math.min(i + 3, 6)}`}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  style={{
                    padding: "16px 0", cursor: "pointer",
                    borderBottom: `1px solid ${C.borderLight}`,
                    ...(isMobile ? {
                      display: "flex", flexDirection: "column" as const, gap: 8,
                    } : {
                      display: "grid",
                      gridTemplateColumns: isTablet ? "1fr auto auto" : "1fr 1fr auto",
                      alignItems: "center",
                      gap: isTablet ? 16 : 48,
                    }),
                    position: "relative", zIndex: projects.length - i,
                  }}
                >
                  {/* Left: product name + tagline */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 15.5, fontWeight: 560, color: C.text,
                      fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                    }}>
                      {p.name}
                    </div>
                    <div className={isMobile ? "line-clamp-2" : undefined} style={{
                      fontSize: 13, color: C.textMute, fontFamily: "var(--sans)",
                      fontWeight: 400, lineHeight: 1.3,
                      ...(isMobile ? {} : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
                    }}>
                      {p.tagline}
                    </div>
                  </div>

                  {isMobile ? (
                    /* Mobile: builder + vote on same row */
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
                          flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          padding: "8px 12px", borderRadius: 10,
                          minWidth: 48,
                          border: votedIds.includes(p.id) ? `1.5px solid ${C.brand}` : `1px solid ${C.border}`,
                          background: votedIds.includes(p.id) ? C.brandSoft : C.surface,
                          color: votedIds.includes(p.id) ? C.brand : C.text,
                          fontFamily: "var(--sans)",
                          cursor: "pointer",
                          transition: "border 0.25s, background 0.25s, color 0.25s",
                          position: "relative", overflow: "visible",
                        }}>
                        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                            <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                          <span
                            className={`vote-ghost${voteAnimId === p.id ? " active" : ""}`}
                            style={{ color: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
                              <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                        <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: 12 }}>{p.weighted.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Center: cycling builder */}
                      {(() => {
                        const allBuilders = [
                          { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent },
                          ...(p.creators || []).filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                          ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                        ];
                        return <BuilderCycler builders={allBuilders} />;
                      })()}

                      {/* Right: votes */}
                      <div
                        onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                                                style={{
                          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 10,
                          minWidth: 72,
                          border: votedIds.includes(p.id) ? `1.5px solid ${C.brand}` : `1px solid ${C.border}`,
                          background: votedIds.includes(p.id) ? C.brandSoft : C.surface,
                          fontSize: 15, fontWeight: 650,
                          color: votedIds.includes(p.id) ? C.brand : C.text,
                          fontFamily: "var(--sans)",
                          cursor: "pointer",
                          transition: "border 0.25s, background 0.25s, color 0.25s",
                          position: "relative", overflow: "visible",
                        }}>
                        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                            <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={votedIds.includes(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={votedIds.includes(p.id) ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                          <span
                            className={`vote-ghost${voteAnimId === p.id ? " active" : ""}`}
                            style={{ color: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
                              <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </span>
                        <span style={{ lineHeight: 1, fontFamily: "var(--mono)", fontWeight: 600, fontSize: 14 }}>{p.weighted.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ---- MEMBERS ONLY ---- */}
      {showMembersOnly && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div
            onClick={() => setShowMembersOnly(false)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
              animation: "fadeIn 0.2s ease",
            }}
          />
          <div className="responsive-modal" style={{
            position: "relative", width: "100%", maxWidth: 420,
            background: C.surface, borderRadius: isMobile ? 16 : 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            padding: isMobile ? "32px 20px" : "40px 32px", textAlign: "center",
            animation: "fadeUp 0.25s ease-out",
            ...(isMobile ? { margin: "0 16px" } : {}),
          }}>
            <button
              onClick={() => setShowMembersOnly(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: 32,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 18, color: C.textMute,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
            >
              {"\u00D7"}
            </button>
            <div style={{
              width: 56, height: 56, borderRadius: 56, margin: "0 auto 20px",
              background: C.goldSoft, border: `1px solid ${C.goldBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              {"\u2726"}
            </div>
            <h3 style={{
              fontSize: 20, fontWeight: 500, color: C.text,
              fontFamily: "var(--serif)", marginBottom: 10, lineHeight: 1.3,
            }}>
              Reserved for GrowthX members
            </h3>
            <p style={{
              fontSize: 14, color: C.textSec, fontFamily: "var(--sans)",
              fontWeight: 400, lineHeight: 1.6, marginBottom: 28, maxWidth: 320, margin: "0 auto 28px",
            }}>
              Submitting projects is exclusively available to members with an active GrowthX membership.
            </p>
            <a
              href="https://growthx.club"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "12px 28px", borderRadius: 10,
                border: "none", background: C.accent, color: "#fff",
                fontSize: 14, fontWeight: 600, fontFamily: "var(--sans)",
                textDecoration: "none", transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Learn about GrowthX
            </a>
          </div>
        </div>
      )}

      {/* ---- SUBMIT FLOW ---- */}
      {showSubmit && (
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
              .submit-input { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: 14.5px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; }
              .submit-input:focus { border-color: ${C.accent}; }
              .submit-input::placeholder { color: ${C.textMute}; }
              .submit-input-lg { font-size: 22px; font-weight: 500; font-family: var(--serif); border: none; padding: 0; background: transparent; }
              .submit-input-lg:focus { border: none; }
              .submit-textarea { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: 14px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; resize: vertical; min-height: 100px; line-height: 1.5; }
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
                  fontSize: 11, fontWeight: 600, color: C.textMute,
                  fontFamily: "var(--sans)", letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 4,
                }}>
                  {["The basics", "The story", "Tech and team"][submitStep]}
                </div>
                <div style={{
                  fontSize: 13, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 400,
                }}>
                  Step {submitStep + 1} of 3
                </div>
              </div>
              <button onClick={() => setShowSubmit(false)} style={{
                width: 32, height: 32, borderRadius: 32,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16, color: C.textMute,
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
                      fontSize: 11, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)",
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
                    fontSize: 14, color: C.textSec, fontFamily: "var(--sans)",
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
                          fontSize: 12, fontWeight: 650, color: C.textMute,
                          fontFamily: "var(--mono)", minWidth: 16,
                        }}>
                          {pi + 1}.
                        </span>
                        <span style={{ fontSize: 13.5, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                          <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <textarea
                    className="submit-textarea"
                    placeholder={"e.g. We were losing 40% of inbound leads because our response time was 6+ hours. So I built an AI agent that qualifies and responds in under 90 seconds. 12 beta users, 3x conversion on day one."}
                    value={submitData.description}
                    onChange={e => {
                      const val = e.target.value;
                      if (val.length <= 500) setSubmitData(d => ({ ...d, description: val }));
                    }}
                    maxLength={500}
                    style={{
                      minHeight: 140,
                      borderColor: submitData.description.length >= 500 ? "#DC2626" : undefined,
                    }}
                    autoFocus
                  />
                  <div style={{
                    fontSize: 11, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)",
                    color: submitData.description.length >= 480 ? (submitData.description.length >= 500 ? "#DC2626" : "#B45309") : C.textMute,
                    fontWeight: submitData.description.length >= 500 ? 600 : 400,
                  }}>
                    {submitData.description.length}/500{submitData.description.length >= 500 && " — limit reached"}
                  </div>
                </div>
              )}

              {/* Step 2: Tech stack + collaborators */}
              {submitStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 10 }}>
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
                              fontSize: 12.5, color: C.text, fontWeight: 500,
                              fontFamily: "var(--sans)",
                            }}>
                              <span style={{
                                width: 20, height: 20, borderRadius: 5,
                                background: meta.bg, color: meta.color,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: 8.5, fontWeight: 750, fontFamily: "var(--sans)",
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
                                  cursor: "pointer", fontSize: 13, color: C.textMute,
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
                          <div style={{ fontSize: 11, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
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
                                    fontSize: 12, color: C.textSec, fontWeight: 450,
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
                                    fontSize: 7.5, fontWeight: 750, fontFamily: "var(--sans)",
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
                            fontSize: 12, fontWeight: 600, color: "#fff",
                            cursor: "pointer", fontFamily: "var(--sans)",
                            whiteSpace: "nowrap", transition: "opacity 0.12s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                        >Add</button>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMute, marginTop: 5, fontFamily: "var(--sans)" }}>
                      Press enter or click Add
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.borderLight }} />

                  <div ref={collabDropdownRef}>
                    <div style={{ fontSize: 12, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
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
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.textMute }}>
                          Searching...
                        </span>
                      )}
                      {!searchingCollabs && submitData.teamInput.trim().length >= 2 && collabResults.length === 0 && (
                        <div style={{ fontSize: 12, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6 }}>
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
                                  fontSize: 10, fontWeight: 650, fontFamily: "var(--sans)",
                                  border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                }}>
                                  {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>{u.name}</div>
                                  {(u.role || u.company) && (
                                    <div style={{ fontSize: 11, color: C.textMute, fontFamily: "var(--sans)" }}>
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
                            fontSize: 12.5, color: C.text, fontWeight: 480,
                            fontFamily: "var(--sans)",
                          }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: 18,
                              background: C.borderLight, color: C.textSec,
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              fontSize: 7, fontWeight: 650, flexShrink: 0,
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
                                fontSize: 9.5, fontWeight: 650, letterSpacing: "0.03em",
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
                                cursor: "pointer", fontSize: 14, color: C.textMute,
                                lineHeight: 1, marginTop: -1,
                              }}
                            >{"\u00D7"}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: C.textMute, marginTop: 6, fontFamily: "var(--sans)" }}>
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
                  fontSize: 13, color: "#B91C1C", fontFamily: "var(--sans)",
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
                    fontSize: 13, fontWeight: 500, color: C.textSec,
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
                      if (!submitData.description.trim()) { setSubmitError("Description is required. Tell us what you built."); return; }
                      if (submitData.description.length > 500) { setSubmitError("Description must be 500 characters or less."); return; }
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
                    fontSize: 13, fontWeight: 600,
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
        </div>
      )}

      {/* Sign-in handled via redirect to GrowthX login */}
    </div>
  );
}
