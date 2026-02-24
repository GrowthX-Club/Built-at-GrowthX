"use client";

import { useState, useEffect, useRef } from "react";
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

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
  return colors[Math.abs(hash) % colors.length];
}

const labelStyle = {
  fontSize: 11, fontWeight: 650, color: C.textMute,
  textTransform: "uppercase" as const, letterSpacing: "0.06em",
  marginBottom: 6, display: "block", fontFamily: "var(--sans)",
};

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 10,
  border: `1px solid ${C.borderLight}`, fontSize: 14.5,
  color: C.text, fontFamily: "var(--sans)", background: C.bg, outline: "none",
};

// ---- Page ----

interface CollabEntry {
  _id: string;
  name: string;
  avatar?: string;
  company?: string;
  companyColor?: string;
}

interface UserResult {
  _id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  company: string;
  role: string;
}

interface EditState {
  name: string;
  tagline: string;
  description: string;
  url: string;
  stack: string[];
  stackInput: string;
  collabs: CollabEntry[];
  collabInput: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<EditState>({
    name: "", tagline: "", description: "", url: "",
    stack: [], stackInput: "", collabs: [], collabInput: "",
  });
  const [saving, setSaving] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const collabRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bxApi("/me").then(r => r.json()).then(d => {
      const u = normalizeUser(d.user);
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    bxApi("/my-projects").then(r => r.json()).then(d => {
      const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
      setProjects(list);
    }).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (collabRef.current && !collabRef.current.contains(e.target as Node)) setShowCollabDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchUsers = (query: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length < 2) { setUserResults([]); setShowCollabDropdown(false); return; }
    setSearchingUsers(true);
    searchTimer.current = setTimeout(() => {
      bxApi(`/users/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          const users = (d.users || []).map((u: Record<string, unknown>) => ({
            _id: (u._id ?? '') as string,
            name: (u.name ?? '') as string,
            avatar: (u.initials ?? u.avatar ?? '?') as string,
            avatarUrl: (u.avatar_url ?? undefined) as string | undefined,
            company: (u.company ?? '') as string,
            role: (u.role ?? '') as string,
          }));
          setUserResults(users);
          setShowCollabDropdown(true);
        })
        .finally(() => setSearchingUsers(false));
    }, 250);
  };

  const addCollab = (u: UserResult) => {
    if (editData.collabs.some(c => c.name === u.name)) return;
    setEditData(d => ({
      ...d,
      collabs: [...d.collabs, { _id: u._id, name: u.name, avatar: u.avatar, company: u.company, companyColor: u.company ? generateColor(u.company) : undefined }],
      collabInput: "",
    }));
    setUserResults([]);
    setShowCollabDropdown(false);
  };

  const handleSignOut = async () => {
    await bxApi("/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    setShowProfileMenu(false);
    router.push("/login");
  };

  const startEdit = (p: Project) => {
    const raw = p as unknown as Record<string, unknown>;
    setEditingId(p.id);
    setEditData({
      name: p.name,
      tagline: p.tagline,
      description: p.description || "",
      url: (raw.url as string) || "",
      stack: p.stack || [],
      stackInput: "",
      collabs: (p.collabs || []).map(c => ({ _id: c._id || '', name: c.name, avatar: c.avatar, company: c.company, companyColor: c.companyColor })),
      collabInput: "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: editData.name,
        tagline: editData.tagline,
        description: editData.description,
        url: editData.url,
        stack: editData.stack,
        collabs: editData.collabs.map(c => c._id).filter(Boolean),
      };
      const res = await bxApi(`/projects/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === editingId ? {
          ...p,
          name: editData.name,
          tagline: editData.tagline,
          description: editData.description,
          stack: editData.stack,
          collabs: editData.collabs.map(c => ({
            name: c.name,
            avatar: c.avatar || c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
            company: c.company,
            companyColor: c.companyColor,
          })),
        } : p));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user && !loading) return null;

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
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span
              onClick={() => router.push("/")}
              style={{
                fontSize: 22, fontWeight: 400, fontFamily: "var(--serif)",
                color: C.text, letterSpacing: "-0.02em", cursor: "pointer",
              }}
            >
              Built
            </span>
            <span style={{ color: C.textMute, fontSize: 13 }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>My Projects</span>
          </div>
          {user && (
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
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 36, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            My Projects
          </h1>
          <p style={{ fontSize: 15, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
            Manage and edit the projects you&apos;ve submitted.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMute, fontSize: 14 }}>Loading...</div>
        ) : projects.length === 0 ? (
          <div style={{
            padding: "48px 32px", textAlign: "center",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          }}>
            <p style={{ fontSize: 16, color: C.textSec, marginBottom: 16 }}>You haven&apos;t submitted any projects yet.</p>
            <button onClick={() => router.push("/")} style={{
              padding: "10px 24px", borderRadius: 10,
              border: "none", background: C.accent, color: "#fff",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
            }}>
              Submit your first project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projects.map((p, i) => (
              <div key={p.id} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "24px 28px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
              }}>
                {editingId === p.id ? (
                  /* ---- Edit mode ---- */
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Name */}
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input
                        value={editData.name}
                        onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                        style={{ ...inputStyle, fontSize: 22, fontWeight: 500, fontFamily: "var(--serif)" }}
                        autoFocus
                      />
                    </div>

                    {/* Tagline */}
                    <div>
                      <label style={labelStyle}>Tagline</label>
                      <input
                        value={editData.tagline}
                        onChange={e => setEditData(d => ({ ...d, tagline: e.target.value }))}
                        maxLength={100}
                        placeholder="One-line tagline (what does it do?)"
                        style={inputStyle}
                      />
                      <div style={{ fontSize: 11, color: C.textMute, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)" }}>
                        {editData.tagline.length}/100
                      </div>
                    </div>

                    {/* URL */}
                    <div>
                      <label style={labelStyle}>Product URL</label>
                      <input
                        value={editData.url}
                        onChange={e => setEditData(d => ({ ...d, url: e.target.value }))}
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ height: 1, background: C.borderLight }} />

                    {/* Description */}
                    <div>
                      <label style={labelStyle}>Description</label>
                      <div style={{
                        fontSize: 13, color: C.textSec, fontFamily: "var(--sans)",
                        fontWeight: 400, lineHeight: 1.55, marginBottom: 12,
                      }}>
                        Write like you&apos;re telling a friend what you built and why.
                      </div>
                      <textarea
                        value={editData.description}
                        onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                        placeholder="The problem, what you built, and what happened."
                        style={{
                          ...inputStyle, resize: "vertical" as const, minHeight: 120, lineHeight: 1.5,
                          padding: "12px 16px",
                        }}
                      />
                      <div style={{ fontSize: 11, color: C.textMute, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)" }}>
                        {editData.description.length}/500
                      </div>
                    </div>

                    <div style={{ height: 1, background: C.borderLight }} />

                    {/* Tech stack */}
                    <div>
                      <label style={labelStyle}>Tech stack</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          value={editData.stackInput}
                          onChange={e => setEditData(d => ({ ...d, stackInput: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter" && editData.stackInput.trim()) {
                              e.preventDefault();
                              setEditData(d => ({
                                ...d,
                                stack: [...d.stack, d.stackInput.trim()],
                                stackInput: "",
                              }));
                            }
                          }}
                          placeholder="e.g. Next.js, Supabase, Claude API"
                          style={inputStyle}
                        />
                      </div>
                      {editData.stack.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                          {editData.stack.map((s, si) => (
                            <span key={si} style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "5px 10px 5px 12px", borderRadius: 8,
                              background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                              fontSize: 12.5, color: C.text, fontWeight: 480,
                              fontFamily: "var(--sans)",
                            }}>
                              {s}
                              <span
                                onClick={() => setEditData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) }))}
                                style={{ cursor: "pointer", fontSize: 14, color: C.textMute, lineHeight: 1 }}
                              >{"\u00D7"}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.textMute, marginTop: 4, fontFamily: "var(--sans)" }}>
                        Press enter to add
                      </div>
                    </div>

                    {/* Collaborators */}
                    <div ref={collabRef}>
                      <label style={labelStyle}>Collaborators</label>
                      <div style={{ position: "relative" }}>
                        <input
                          value={editData.collabInput}
                          onChange={e => {
                            const v = e.target.value;
                            setEditData(d => ({ ...d, collabInput: v }));
                            searchUsers(v);
                          }}
                          onFocus={() => { if (userResults.length > 0) setShowCollabDropdown(true); }}
                          placeholder="Search by name..."
                          style={inputStyle}
                        />
                        {searchingUsers && (
                          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.textMute }}>
                            Searching...
                          </span>
                        )}

                        {/* Dropdown */}
                        {showCollabDropdown && userResults.length > 0 && (
                          <div style={{
                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
                            maxHeight: 240, overflowY: "auto",
                          }}>
                            {userResults.map(u => {
                              const already = editData.collabs.some(c => c.name === u.name);
                              return (
                                <button
                                  key={u._id}
                                  onClick={() => addCollab(u)}
                                  disabled={already}
                                  style={{
                                    width: "100%", padding: "10px 14px", border: "none",
                                    background: "none", cursor: already ? "default" : "pointer",
                                    display: "flex", alignItems: "center", gap: 10,
                                    textAlign: "left", transition: "background 0.1s",
                                    opacity: already ? 0.4 : 1,
                                  }}
                                  onMouseEnter={e => { if (!already) e.currentTarget.style.background = C.accentSoft; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                                >
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 32,
                                    background: C.accentSoft, color: C.textSec,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 650, fontFamily: "var(--sans)",
                                    border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                  }}>
                                    {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>
                                      {u.name}
                                      {already && <span style={{ fontSize: 11, fontWeight: 400, color: C.textMute, marginLeft: 6 }}>Added</span>}
                                    </div>
                                    {(u.role || u.company) && (
                                      <div style={{ fontSize: 11.5, color: C.textMute, fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4 }}>
                                        {u.role && <span>{u.role}</span>}
                                        {u.role && u.company && <span style={{ opacity: 0.4 }}>{"\u00B7"}</span>}
                                        {u.company && (
                                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                            <span style={{
                                              width: 12, height: 12, borderRadius: 3,
                                              background: generateColor(u.company),
                                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                                              fontSize: 6, fontWeight: 800, color: "#fff", flexShrink: 0,
                                              overflow: "hidden", position: "relative",
                                            }}>
                                              {u.company[0]}
                                              <img src={getCompanyLogoUrl(u.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                            </span>
                                            {u.company}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {editData.collabs.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          {editData.collabs.map((c, ci) => (
                            <span key={ci} style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              padding: "6px 10px 6px 8px", borderRadius: 10,
                              background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                              fontSize: 12.5, color: C.text, fontWeight: 480,
                              fontFamily: "var(--sans)",
                            }}>
                              <span style={{
                                width: 22, height: 22, borderRadius: 22,
                                background: C.borderLight, color: C.textSec,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: 9, fontWeight: 650, flexShrink: 0,
                              }}>
                                {(c.avatar && c.avatar.length <= 3) ? c.avatar : c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                              {c.name}
                              {c.company && (
                                <span style={{ fontSize: 11, color: C.textMute, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <span style={{
                                    width: 10, height: 10, borderRadius: 3,
                                    background: c.companyColor || generateColor(c.company),
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 5, fontWeight: 800, color: "#fff", flexShrink: 0,
                                    overflow: "hidden", position: "relative",
                                  }}>
                                    {c.company[0]}
                                    <img src={getCompanyLogoUrl(c.company)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                  </span>
                                  {c.company}
                                </span>
                              )}
                              <span
                                onClick={() => setEditData(d => ({ ...d, collabs: d.collabs.filter((_, idx) => idx !== ci) }))}
                                style={{ cursor: "pointer", fontSize: 14, color: C.textMute, lineHeight: 1 }}
                              >{"\u00D7"}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: C.textMute, marginTop: 6, fontFamily: "var(--sans)" }}>
                        Search for GrowthX members to add as collaborators
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                      <button onClick={cancelEdit} style={{
                        padding: "9px 22px", borderRadius: 10, border: `1px solid ${C.border}`,
                        background: "transparent", fontSize: 13, fontWeight: 500, color: C.textSec,
                        cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                      >Cancel</button>
                      <button onClick={saveEdit} disabled={saving || !editData.name.trim()} style={{
                        padding: "9px 24px", borderRadius: 10, border: "none",
                        background: (!editData.name.trim() || saving) ? C.borderLight : C.accent,
                        fontSize: 13, fontWeight: 600,
                        color: (!editData.name.trim() || saving) ? C.textMute : "#fff",
                        cursor: (!editData.name.trim() || saving) ? "default" : "pointer",
                        fontFamily: "var(--sans)", transition: "all 0.15s",
                      }}>{saving ? "Saving..." : "Save changes"}</button>
                    </div>
                  </div>
                ) : (
                  /* ---- View mode ---- */
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 17, fontWeight: 550, color: C.text,
                          fontFamily: "var(--sans)", marginBottom: 3, cursor: "pointer",
                        }} onClick={() => router.push(`/projects/${p.id}`)}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 14, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                          {p.tagline}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: C.textSec,
                          fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <span style={{ fontSize: 13, opacity: 0.5 }}>{"\u25B3"}</span>
                          {p.weighted.toLocaleString()}
                        </div>
                        <button onClick={() => startEdit(p)} style={{
                          padding: "7px 16px", borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface,
                          cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                          color: C.text, fontFamily: "var(--sans)",
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    {p.description && (
                      <p style={{ fontSize: 13, color: C.textMute, fontFamily: "var(--sans)", margin: "8px 0 0", lineHeight: 1.5 }}>
                        {p.description.length > 150 ? p.description.slice(0, 150) + "..." : p.description}
                      </p>
                    )}
                    {p.stack && p.stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                        {p.stack.map((s, si) => (
                          <span key={si} style={{
                            padding: "3px 8px", borderRadius: 6,
                            background: C.accentSoft, fontSize: 11, color: C.textSec,
                            fontWeight: 500, fontFamily: "var(--sans)",
                          }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
