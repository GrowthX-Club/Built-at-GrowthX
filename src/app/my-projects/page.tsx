"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  C,
  T,
  STACK_META,
  type Project,
  type BuilderProfile,
  normalizeProject,
  normalizeUser,
  getCompanyLogoUrl,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { extractPlainText, descriptionCharCount } from "@/lib/editor-utils";
import RichTextEditor from "@/components/RichTextEditor";

// ---- Inline Components ----

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
  return colors[Math.abs(hash) % colors.length];
}

const labelStyle = {
  fontSize: T.caption, fontWeight: 650, color: C.textMute,
  textTransform: "uppercase" as const, letterSpacing: "0.06em",
  marginBottom: 6, display: "block", fontFamily: "var(--sans)",
};

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 10,
  border: `1px solid ${C.borderLight}`, fontSize: T.body,
  color: C.text, fontFamily: "var(--sans)", background: C.bg, outline: "none",
};

// ---- Page ----

interface CollabEntry {
  _id: string;
  name: string;
  avatar?: string;
  company?: string;
  companyColor?: string;
  role: 'creator' | 'collaborator';
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
  team: CollabEntry[];
  teamInput: string;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride } = useNavOverride();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<EditState>({
    name: "", tagline: "", description: "", url: "",
    stack: [], stackInput: "", team: [], teamInput: "",
  });
  const [saving, setSaving] = useState(false);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const collabRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMyData = useCallback(() => {
    bxApi("/me").then(r => r.json()).then(d => {
      const u = normalizeUser(d.user);
      if (!u) {
        openLoginDialog(() => { loadMyData(); });
        return;
      }
      setUser(u);
    });
    bxApi("/my-projects").then(r => r.json()).then(d => {
      const list = (d.projects || []).map((p: Record<string, unknown>) => normalizeProject(p));
      setProjects(list);
    }).finally(() => setLoading(false));
  }, [openLoginDialog]);

  useEffect(() => {
    loadMyData();
  }, [loadMyData]);

  useEffect(() => {
    setNavOverride({ title: "My Projects", backHref: "/" });
    return () => clearNavOverride();
  }, [setNavOverride, clearNavOverride]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
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
          setUserResults(user ? users.filter((u: UserResult) => u._id !== user._id) : users);
          setShowCollabDropdown(true);
        })
        .finally(() => setSearchingUsers(false));
    }, 250);
  };

  const addTeamMember = (u: UserResult) => {
    if (editData.team.some(c => c._id === u._id)) return;
    setEditData(d => ({
      ...d,
      team: [...d.team, { _id: u._id, name: u.name, avatar: u.avatar, company: u.company, companyColor: u.company ? generateColor(u.company) : undefined, role: 'collaborator' }],
      teamInput: "",
    }));
    setUserResults([]);
    setShowCollabDropdown(false);
  };

  const startEdit = (p: Project) => {
    const raw = p as unknown as Record<string, unknown>;
    setEditError("");
    setEditingId(p.id);
    setEditData({
      name: p.name,
      tagline: p.tagline,
      description: p.description || "",
      url: (raw.url as string) || "",
      stack: p.stack || [],
      stackInput: "",
      team: [
        ...(p.creators || []).map(c => ({ _id: c._id || '', name: c.name, avatar: c.avatar, company: c.company, companyColor: c.companyColor, role: 'creator' as const })),
        ...(p.collabs || []).map(c => ({ _id: c._id || '', name: c.name, avatar: c.avatar, company: c.company, companyColor: c.companyColor, role: 'collaborator' as const })),
      ],
      teamInput: "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const [togglingId, setTogglingId] = useState<string | number | null>(null);

  const toggleEnabled = async (p: Project) => {
    if (togglingId) return;
    const newEnabled = !p.enabled;
    setTogglingId(p.id);
    try {
      const res = await bxApi(`/projects/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (res.ok) {
        setProjects(prev => prev.map(proj => proj.id === p.id ? { ...proj, enabled: newEnabled } : proj));
      }
    } catch { /* ignore */ }
    setTogglingId(null);
  };

  const [editError, setEditError] = useState("");

  const saveEdit = async () => {
    if (!editingId || saving) return;
    setEditError("");
    if (!editData.name.trim()) { setEditError("Project name is required."); return; }
    if (!editData.tagline.trim()) { setEditError("Tagline is required."); return; }
    if (descriptionCharCount(editData.description) === 0) { setEditError("Description is required. Tell us what you built."); return; }
    if (editData.stack.length === 0) { setEditError("Add at least one tech stack item."); return; }
    setSaving(true);
    try {
      const payload = {
        name: editData.name,
        tagline: editData.tagline,
        description: editData.description,
        url: editData.url,
        stack: editData.stack,
        creators: editData.team.filter(c => c.role === 'creator').map(c => c._id).filter(Boolean),
        collabs: editData.team.filter(c => c.role === 'collaborator').map(c => c._id).filter(Boolean),
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
          creators: editData.team.filter(c => c.role === 'creator').map(c => ({
            name: c.name,
            avatar: c.avatar || c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
            company: c.company,
            companyColor: c.companyColor,
            role: 'creator' as const,
          })),
          collabs: editData.team.filter(c => c.role === 'collaborator').map(c => ({
            name: c.name,
            avatar: c.avatar || c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
            company: c.company,
            companyColor: c.companyColor,
            role: 'collaborator' as const,
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
    <main className="responsive-main" style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 100px", fontFamily: "var(--sans)" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10 }}>
            My Projects
          </h1>
          <p style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
            Manage and edit the projects you&apos;ve submitted.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`fade-up stagger-${Math.min(i + 1, 6)}`} style={{
                padding: "24px 28px", background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 14,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 17, width: "50%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 14, width: "80%" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="skeleton" style={{ height: 13, width: 40 }} />
                    <div className="skeleton" style={{ width: 50, height: 30, borderRadius: 8 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 13, width: "60%", marginTop: 8 }} />
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 20, width: 45, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            padding: "48px 32px", textAlign: "center",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          }}>
            <p style={{ fontSize: T.bodyLg, color: C.textSec, marginBottom: 16 }}>You haven&apos;t submitted any projects yet.</p>
            <button onClick={() => router.push("/?submit=1")} style={{
              padding: "10px 24px", borderRadius: 10,
              border: "none", background: C.accent, color: C.accentFg,
              fontSize: T.body, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
            }}>
              Submit your first project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projects.map((p, i) => (
              <div key={p.id} className={`fade-up stagger-${Math.min(i + 1, 6)} list-item-hover`} style={{
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
                        style={{ ...inputStyle, fontSize: T.logo, fontWeight: 500, fontFamily: "var(--serif)" }}
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
                        style={{ ...inputStyle, borderColor: editData.tagline.length >= 100 ? "#DC2626" : undefined }}
                      />
                      <div style={{
                        fontSize: T.caption, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)",
                        color: editData.tagline.length >= 90 ? (editData.tagline.length >= 100 ? "#DC2626" : "#B45309") : C.textMute,
                        fontWeight: editData.tagline.length >= 100 ? 600 : 400,
                      }}>
                        {editData.tagline.length}/100{editData.tagline.length >= 100 && " — limit reached"}
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
                        fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)",
                        fontWeight: 400, lineHeight: 1.55, marginBottom: 12,
                      }}>
                        Write like you&apos;re telling a friend what you built and why.
                      </div>
                      <RichTextEditor
                        value={editData.description}
                        onChange={(json) => setEditData(d => ({ ...d, description: json }))}
                        maxChars={1500}
                      />
                    </div>

                    <div style={{ height: 1, background: C.borderLight }} />

                    {/* Tech stack */}
                    <div>
                      <label style={labelStyle}>Tech stack</label>

                      {/* Selected stack */}
                      {editData.stack.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                          {editData.stack.map((s, si) => {
                            const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: "#fff" };
                            const logoUrl = getStackLogoUrl(s);
                            return (
                              <span key={si} style={{
                                display: "inline-flex", alignItems: "center", gap: 7,
                                padding: "5px 10px 5px 6px", borderRadius: 20,
                                background: C.surface, border: `1.5px solid ${C.accent}`,
                                fontSize: T.bodySm, color: C.text, fontWeight: 500,
                                fontFamily: "var(--sans)",
                              }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: 5,
                                  background: meta.bg, color: meta.color,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontSize: T.micro, fontWeight: 750, fontFamily: "var(--sans)",
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
                                  onClick={() => setEditData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) }))}
                                  style={{
                                    cursor: "pointer", fontSize: T.bodySm, color: C.textMute,
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
                        const available = suggestions.filter(s => !editData.stack.includes(s));
                        if (available.length === 0) return null;
                        return (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
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
                                    onClick={() => setEditData(d => ({ ...d, stack: [...d.stack, s] }))}
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 6,
                                      padding: "4px 10px 4px 5px", borderRadius: 20,
                                      background: C.bg, border: `1px solid ${C.borderLight}`,
                                      fontSize: T.label, color: C.textSec, fontWeight: 450,
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
                                      fontSize: T.micro, fontWeight: 750, fontFamily: "var(--sans)",
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
                          value={editData.stackInput}
                          onChange={e => setEditData(d => ({ ...d, stackInput: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter" && editData.stackInput.trim()) {
                              e.preventDefault();
                              const val = editData.stackInput.trim();
                              if (!editData.stack.includes(val)) {
                                setEditData(d => ({
                                  ...d,
                                  stack: [...d.stack, val],
                                  stackInput: "",
                                }));
                              } else {
                                setEditData(d => ({ ...d, stackInput: "" }));
                              }
                            }
                          }}
                          placeholder="Or type a custom one..."
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        {editData.stackInput.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const val = editData.stackInput.trim();
                              if (val && !editData.stack.includes(val)) {
                                setEditData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                              } else {
                                setEditData(d => ({ ...d, stackInput: "" }));
                              }
                            }}
                            style={{
                              padding: "0 14px", borderRadius: 8,
                              border: "none", background: C.accent,
                              fontSize: T.label, fontWeight: 600, color: "#fff",
                              cursor: "pointer", fontFamily: "var(--sans)",
                              whiteSpace: "nowrap", transition: "opacity 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                          >Add</button>
                        )}
                      </div>
                      <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 5, fontFamily: "var(--sans)" }}>
                        Press enter or click Add
                      </div>
                    </div>

                    {/* Team members */}
                    <div ref={collabRef}>
                      <label style={labelStyle}>Team members</label>
                      <div style={{ position: "relative" }}>
                        <input
                          value={editData.teamInput}
                          onChange={e => {
                            const v = e.target.value;
                            setEditData(d => ({ ...d, teamInput: v }));
                            searchUsers(v);
                          }}
                          onFocus={() => { if (userResults.length > 0) setShowCollabDropdown(true); }}
                          placeholder="Search by name..."
                          style={inputStyle}
                        />
                        {searchingUsers && (
                          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                            Searching...
                          </span>
                        )}
                        {!searchingUsers && editData.teamInput.trim().length >= 2 && userResults.length === 0 && (
                          <div style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6 }}>
                            No members found for &ldquo;{editData.teamInput.trim()}&rdquo;
                          </div>
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
                                const already = editData.team.some(c => c._id === u._id);
                                return (
                                  <button
                                    key={u._id}
                                    onClick={() => addTeamMember(u)}
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
                                      fontSize: T.label, fontWeight: 650, fontFamily: "var(--sans)",
                                      border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                    }}>
                                      {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: T.body, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>
                                        {u.name}
                                        {already && <span style={{ fontSize: T.caption, fontWeight: 400, color: C.textMute, marginLeft: 6 }}>Added</span>}
                                      </div>
                                      {(u.role || u.company) && (
                                        <div style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4 }}>
                                          {u.role && <span>{u.role}</span>}
                                          {u.role && u.company && <span style={{ opacity: 0.4 }}>{"\u00B7"}</span>}
                                          {u.company && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                              <span style={{
                                                width: 12, height: 12, borderRadius: 3,
                                                background: generateColor(u.company),
                                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                fontSize: T.micro, fontWeight: 800, color: "#fff", flexShrink: 0,
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

                      {editData.team.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          {editData.team.map((c, ci) => (
                            <span key={ci} style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              padding: "6px 10px 6px 8px", borderRadius: 10,
                              background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                              fontSize: T.bodySm, color: C.text, fontWeight: 480,
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
                              <span
                                onClick={() => {
                                  setEditData(d => ({
                                    ...d,
                                    team: d.team.map((t, idx) => idx === ci
                                      ? { ...t, role: t.role === 'creator' ? 'collaborator' : 'creator' }
                                      : t
                                    ),
                                  }));
                                }}
                                style={{
                                  fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
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
                                onClick={() => setEditData(d => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) }))}
                                style={{ cursor: "pointer", fontSize: T.body, color: C.textMute, lineHeight: 1 }}
                              >{"\u00D7"}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 6, fontFamily: "var(--sans)" }}>
                        Search for GrowthX members — tap role to toggle Creator / Collaborator
                      </div>
                    </div>

                    {/* Error message */}
                    {editError && (
                      <div style={{
                        padding: "10px 14px", borderRadius: 10,
                        background: "#FEF2F2", border: "1px solid #FECACA",
                        fontSize: T.bodySm, color: "#B91C1C", fontFamily: "var(--sans)",
                        fontWeight: 450, lineHeight: 1.45,
                      }}>
                        {editError}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                      <button onClick={() => { setEditError(""); cancelEdit(); }} style={{
                        padding: "9px 22px", borderRadius: 10, border: `1px solid ${C.border}`,
                        background: "transparent", fontSize: T.bodySm, fontWeight: 500, color: C.textSec,
                        cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                      >Cancel</button>
                      <button onClick={saveEdit} disabled={saving || !editData.name.trim()} style={{
                        padding: "9px 24px", borderRadius: 10, border: "none",
                        background: (!editData.name.trim() || saving) ? C.borderLight : C.accent,
                        fontSize: T.bodySm, fontWeight: 600,
                        color: (!editData.name.trim() || saving) ? C.textMute : "#fff",
                        cursor: (!editData.name.trim() || saving) ? "default" : "pointer",
                        fontFamily: "var(--sans)", transition: "all 0.15s",
                      }}>{saving ? "Saving..." : "Save changes"}</button>
                    </div>
                  </div>
                ) : (
                  /* ---- View mode ---- */
                  <div style={{ opacity: p.enabled ? 1 : 0.5, transition: "opacity 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <div style={{
                            fontSize: T.subtitle, fontWeight: 550, color: C.text,
                            fontFamily: "var(--sans)", cursor: "pointer",
                          }} onClick={() => router.push(`/projects/${p.id}`)}>
                            {p.name}
                          </div>
                          {!p.enabled && (
                            <span style={{
                              fontSize: T.badge, fontWeight: 600, color: C.textMute,
                              fontFamily: "var(--sans)", padding: "2px 6px",
                              borderRadius: 4, background: C.borderLight,
                              textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>Hidden</span>
                          )}
                        </div>
                        <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400 }}>
                          {p.tagline}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          fontSize: T.bodySm, fontWeight: 600, color: C.textSec,
                          fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <span style={{ fontSize: T.bodySm, opacity: 0.5 }}>{"\u25B3"}</span>
                          {p.weighted.toLocaleString()}
                        </div>
                        {/* Enable/Disable toggle */}
                        <button
                          onClick={() => toggleEnabled(p)}
                          disabled={togglingId === p.id}
                          title={p.enabled ? "Visible on homepage — click to hide" : "Hidden from homepage — click to show"}
                          style={{
                            position: "relative", width: 36, height: 20, borderRadius: 10,
                            border: "none", cursor: togglingId === p.id ? "default" : "pointer",
                            background: p.enabled ? C.green : C.borderLight,
                            transition: "background 0.2s", flexShrink: 0, padding: 0,
                            opacity: togglingId === p.id ? 0.6 : 1,
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 2, left: p.enabled ? 18 : 2,
                            width: 16, height: 16, borderRadius: 8,
                            background: "#fff", transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }} />
                        </button>
                        <button onClick={() => startEdit(p)} style={{
                          padding: "7px 16px", borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface,
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 600,
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
                    {p.description && (() => {
                      const plain = extractPlainText(p.description);
                      return plain ? (
                        <p style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", margin: "8px 0 0", lineHeight: 1.5 }}>
                          {plain.length > 150 ? plain.slice(0, 150) + "..." : plain}
                        </p>
                      ) : null;
                    })()}
                    {p.stack && p.stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                        {p.stack.map((s, si) => (
                          <span key={si} style={{
                            padding: "3px 8px", borderRadius: 6,
                            background: C.accentSoft, fontSize: T.caption, color: C.textSec,
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
  );
}
