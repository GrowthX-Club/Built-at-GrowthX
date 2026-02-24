"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  C,
  ROLES,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";

// ---- UI Components ----

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

function BuilderCycler({ builders }: { builders: { name: string; company: string; companyColor: string }[] }) {
  const [active, setActive] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [hovered, setHovered] = useState(false);
  const single = builders.length === 1;

  useEffect(() => {
    if (single || hovered) return;
    const t = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setActive(a => (a + 1) % builders.length);
        setSliding(false);
      }, 250);
    }, 3000);
    return () => clearInterval(t);
  }, [builders.length, single, hovered]);

  const b = builders[active];

  return (
    <div
      style={{ position: "relative", textAlign: "left", minWidth: 120, overflow: "visible" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Active builder */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          minWidth: 0, overflow: "hidden", height: 34,
        }}>
          <div
            key={active}
            style={{
              animation: sliding ? "slideOut 0.25s ease-in forwards" : "slideUp 0.25s ease-out forwards",
            }}
          >
            {/* Company line */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, fontFamily: "var(--sans)", marginBottom: 2,
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: 4,
                background: b.companyColor || C.accent,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 7, fontWeight: 800, color: "#fff",
                fontFamily: "var(--sans)", flexShrink: 0,
                overflow: "hidden", position: "relative",
              }}>
                {b.company[0]}
                {b.company && <img src={getCompanyLogoUrl(b.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              </span>
              <span style={{ fontWeight: 600, color: C.text }}>{b.company}</span>
            </div>
            {/* Name line */}
            <div style={{
              fontSize: 11.5, fontWeight: 400, color: C.textMute,
              fontFamily: "var(--sans)", lineHeight: 1.2,
            }}>
              {b.name}
            </div>
          </div>
        </div>

        {/* Dots */}
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

      {/* Tooltip on hover */}
      {!single && hovered && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          zIndex: 9999, minWidth: 170,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {builders.map((tb, ti) => (
            <div key={ti}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 12.5, fontFamily: "var(--sans)", marginBottom: 1,
              }}>
                <span style={{
                  width: 13, height: 13, borderRadius: 3,
                  background: tb.companyColor || C.accent,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 6.5, fontWeight: 800, color: "#fff",
                  fontFamily: "var(--sans)", flexShrink: 0,
                  overflow: "hidden", position: "relative",
                }}>
                  {tb.company[0]}
                  {tb.company && <img src={getCompanyLogoUrl(tb.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                </span>
                <span style={{ fontWeight: 600, color: C.text }}>{tb.company}</span>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 400, color: C.textMute,
                fontFamily: "var(--sans)", paddingLeft: 18,
              }}>
                {tb.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main ----
export default function HomePage() {
  const router = useRouter();
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [submitData, setSubmitData] = useState({
    name: "", tagline: "", description: "",
    stack: [] as string[], stackInput: "",
    collabs: [] as { _id: string; name: string; avatar?: string; company?: string; companyColor?: string }[], collabInput: "",
    url: "",
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [votedIds, setVotedIds] = useState<(string | number)[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [collabResults, setCollabResults] = useState<{ _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const collabSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(() => {
    bxApi("/projects")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
        setProjects(list);
        setVotedIds(d.votedProjectIds || d.votedIds || d.voted_ids || []);
      });
  }, []);

  const loadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)));
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

  const searchCollabs = (query: string) => {
    if (collabSearchTimer.current) clearTimeout(collabSearchTimer.current);
    if (query.length < 2) { setCollabResults([]); setShowCollabDropdown(false); return; }
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
          }));
          setCollabResults(users);
          setShowCollabDropdown(true);
        });
    }, 250);
  };

  const pickCollab = (u: { _id: string; name: string; avatar: string; company: string }) => {
    if (submitData.collabs.some(c => c.name === u.name)) return;
    const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
    let hash = 0;
    for (let i = 0; i < (u.company || "").length; i++) hash = (u.company || "").charCodeAt(i) + ((hash << 5) - hash);
    const cc = u.company ? colors[Math.abs(hash) % colors.length] : undefined;
    setSubmitData(d => ({
      ...d,
      collabs: [...d.collabs, { _id: u._id, name: u.name, avatar: u.avatar, company: u.company, companyColor: cc }],
      collabInput: "",
    }));
    setCollabResults([]);
    setShowCollabDropdown(false);
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" });
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
        collabs: submitData.collabs.map(c => c._id),
      }),
    });
    if (res.ok) {
      setShowSubmit(false);
      loadProjects();
    }
  };

  const tabs = [
    { id: "built", label: "Projects", href: "/projects" },
    { id: "builders", label: "Builders", href: "/builders" },
  ];

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
            <span style={{
              fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
              color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
            }}>
              Built
            </span>
            <div style={{ display: "flex", gap: 0 }}>
              {tabs.map((t, i) => (
                <button key={t.id} onClick={() => router.push(t.href)} style={{
                  padding: "18px 18px", border: "none", background: "none", cursor: "pointer",
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
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            onClick={() => {
              if (!user) { handleSignIn(); return; }
              setShowSubmit(true);
              setSubmitStep(0);
              setSubmitData({ name: "", tagline: "", description: "", stack: [], stackInput: "", collabs: [], collabInput: "", url: "" });
            }}
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
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 44, fontWeight: 400, color: C.text,
            fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10,
          }}>
            What the community shipped
          </h1>
          <p style={{ fontSize: 16, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560 }}>
            Products built by the GrowthX community. Ranked by the people who build.
          </p>
        </div>

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
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                alignItems: "center",
                gap: 48,
                transition: "opacity 0.12s",
                position: "relative", zIndex: projects.length - i,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {/* Left: product name + tagline */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 15.5, fontWeight: 560, color: C.text,
                  fontFamily: "var(--sans)", lineHeight: 1.2, marginBottom: 3,
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontSize: 13, color: C.textMute, fontFamily: "var(--sans)",
                  fontWeight: 400, lineHeight: 1.3,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.tagline}
                </div>
              </div>

              {/* Center: cycling builder */}
              {(() => {
                const allBuilders = [
                  { name: p.builder.name, company: p.builder.company || "", companyColor: p.builder.companyColor || C.accent },
                  ...p.collabs.filter(c => c.name && c.company).map(c => ({ name: c.name, company: c.company || "", companyColor: c.companyColor || C.accent })),
                ];
                return <BuilderCycler builders={allBuilders} />;
              })()}

              {/* Right: votes */}
              <div
                onClick={(e) => { e.stopPropagation(); handleVote(p.id); }}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 10,
                  border: votedIds.includes(p.id) ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`,
                  background: votedIds.includes(p.id) ? C.goldSoft : C.surface,
                  fontSize: 15, fontWeight: 650,
                  color: votedIds.includes(p.id) ? C.gold : C.text,
                  fontFamily: "var(--sans)",
                  cursor: "pointer",
                }}>
                <span style={{ fontSize: 15, opacity: 0.5 }}>{"\u25B3"}</span>
                {p.weighted.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </main>

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
          <div style={{
            position: "relative", width: "100%", maxWidth: 540,
            background: C.surface, borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden",
            animation: "fadeUp 0.25s ease-out",
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
                    />
                    <div style={{ fontSize: 11, color: C.textMute, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)" }}>
                      {submitData.tagline.length}/100
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
                    fontWeight: 400, lineHeight: 1.55, marginBottom: 16,
                  }}>
                    Write like you&apos;re telling a friend what you built and why. The best submissions answer three things:
                  </div>

                  <div style={{
                    display: "flex", flexDirection: "column", gap: 3, marginBottom: 16,
                  }}>
                    {[
                      { q: "What problem did you hit?", ex: 'e.g. "We were losing 40% of inbound leads because our response time was 6+ hours."' },
                      { q: "What did you build to fix it?", ex: 'e.g. "An AI agent that qualifies and responds to leads in under 90 seconds."' },
                      { q: "What happened when people used it?", ex: 'e.g. "12 beta users. 3x conversion on day one. Two asked to pay before we had pricing."' },
                    ].map((prompt, pi) => (
                      <div key={pi} style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: submitData.description ? "transparent" : C.bg,
                        transition: "all 0.2s",
                      }}>
                        <div style={{
                          fontSize: 13, fontWeight: 530, color: C.text,
                          fontFamily: "var(--sans)", marginBottom: 2,
                        }}>
                          {pi + 1}. {prompt.q}
                        </div>
                        <div style={{
                          fontSize: 12, color: C.textMute, fontFamily: "var(--sans)",
                          fontWeight: 400, fontStyle: "italic",
                        }}>
                          {prompt.ex}
                        </div>
                      </div>
                    ))}
                  </div>

                  <textarea
                    className="submit-textarea"
                    placeholder="Write your story here. No word salad. Just the problem, what you built, and what happened."
                    value={submitData.description}
                    onChange={e => setSubmitData(d => ({ ...d, description: e.target.value }))}
                    style={{ minHeight: 140 }}
                    autoFocus
                  />
                  <div style={{ fontSize: 11, color: C.textMute, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)" }}>
                    {submitData.description.length}/500
                  </div>
                </div>
              )}

              {/* Step 2: Tech stack + collaborators */}
              {submitStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
                      Tech stack
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        className="submit-input"
                        placeholder="e.g. Next.js, Supabase, Claude API"
                        value={submitData.stackInput}
                        onChange={e => setSubmitData(d => ({ ...d, stackInput: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === "Enter" && submitData.stackInput.trim()) {
                            setSubmitData(d => ({
                              ...d,
                              stack: [...d.stack, d.stackInput.trim()],
                              stackInput: "",
                            }));
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    {submitData.stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {submitData.stack.map((s, si) => (
                          <span key={si} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "5px 10px 5px 12px", borderRadius: 8,
                            background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                            fontSize: 12.5, color: C.text, fontWeight: 480,
                            fontFamily: "var(--sans)",
                          }}>
                            {s}
                            <span
                              onClick={ev => { ev.stopPropagation(); setSubmitData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) })); }}
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
                      Press enter to add
                    </div>
                  </div>

                  <div style={{ height: 1, background: C.borderLight }} />

                  <div ref={collabDropdownRef}>
                    <div style={{ fontSize: 12, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
                      Collaborators (optional)
                    </div>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <input
                        className="submit-input"
                        placeholder="Search by name..."
                        value={submitData.collabInput}
                        onChange={e => { const v = e.target.value; setSubmitData(d => ({ ...d, collabInput: v })); searchCollabs(v); }}
                        onFocus={() => { if (collabResults.length > 0) setShowCollabDropdown(true); }}
                      />
                      {showCollabDropdown && collabResults.length > 0 && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
                          maxHeight: 200, overflowY: "auto",
                        }}>
                          {collabResults.map(u => {
                            const already = submitData.collabs.some(c => c.name === u.name);
                            return (
                              <button key={u._id} onClick={() => pickCollab(u)} disabled={already} style={{
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
                    {submitData.collabs.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {submitData.collabs.map((c, ci) => (
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
                              onClick={ev => { ev.stopPropagation(); setSubmitData(d => ({ ...d, collabs: d.collabs.filter((_, idx) => idx !== ci) })); }}
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
                      Search for GrowthX members to add as collaborators
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginTop: 28,
              }}>
                {submitStep > 0 ? (
                  <button onClick={() => setSubmitStep(s => s - 1)} style={{
                    padding: "9px 20px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: "transparent",
                    fontSize: 13, fontWeight: 500, color: C.textSec,
                    cursor: "pointer", fontFamily: "var(--sans)",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >Back</button>
                ) : <div />}

                <button
                  onClick={() => {
                    if (submitStep < 2) setSubmitStep(s => s + 1);
                    else handleSubmitProject();
                  }}
                  disabled={submitStep === 0 && !submitData.name.trim()}
                  style={{
                    padding: "9px 24px", borderRadius: 10,
                    border: "none",
                    background: (submitStep === 0 && !submitData.name.trim()) ? C.borderLight : C.accent,
                    fontSize: 13, fontWeight: 600,
                    color: (submitStep === 0 && !submitData.name.trim()) ? C.textMute : "#fff",
                    cursor: (submitStep === 0 && !submitData.name.trim()) ? "default" : "pointer",
                    fontFamily: "var(--sans)",
                    transition: "all 0.15s",
                  }}
                >
                  {submitStep === 2 ? "Submit" : "Continue"}
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
