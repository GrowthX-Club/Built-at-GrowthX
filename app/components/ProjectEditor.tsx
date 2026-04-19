import {
  useState,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router";
import {
  C,
  T,
  STACK_META,
  TRACK_LABELS,
  type Project,
  type TrackKey,
  type TrackData,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import MediaUpload from "@/components/MediaUpload";
import type { MediaFile } from "@/components/MediaUpload";
import RichTextEditor from "@/components/RichTextEditor";
import OCTrackPickStep from "./OCTrackPickStep";
import OCTrackDataStep from "./OCTrackDataStep";

/**
 * ProjectEditor — full-page, all-sections-inline edit form for an existing
 * project. Used on /my-projects/:id/edit. Replaces the old SubmitWizard
 * modal path. Unlike OCSubmitForm this is not step-gated: every section
 * is rendered at once inside one scrollable column with a sticky side-nav.
 *
 * Never uses useEffect — see `useEventSubscription` + lazy init + one-shot
 * ref-guard patterns below.
 */

const OPEN_CODE_STACK = "Open Code";
const VALID_TRACKS: TrackKey[] = ["virality", "revenue", "maas"];

const STACK_SUGGESTIONS = [
  "Next.js", "React", "Python", "Node.js", "TypeScript",
  "Claude API", "OpenAI", "Supabase", "Firebase", "MongoDB",
  "PostgreSQL", "Tailwind CSS", "Flutter", "FastAPI", "Vercel",
  "AWS", "Docker", "Stripe", "Prisma", "Go",
];

function isGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[^\s]+/i.test(url.trim());
}

function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
  return colors[Math.abs(hash) % colors.length];
}

type TeamRole = "creator" | "collaborator";
interface TeamMember {
  _id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  company?: string;
  companyColor?: string;
  role: TeamRole;
}

type BuildMode = "solo" | "team";

/**
 * Shape this component owns internally — mirrors OCSubmitForm's SubmitData.
 * Exported so the route can hand us initial state.
 */
export interface SubmitData {
  buildMode: BuildMode;
  name: string;
  teamName: string;
  sameAsProject: boolean;
  tagline: string;
  description: string;
  stack: string[];
  stackInput: string;
  team: TeamMember[];
  teamInput: string;
  githubUrl: string;
  githubPublicConfirmed: boolean;
  demoUrl: string;
  videoUrl: string;
  mediaFiles: MediaFile[];
  primaryTrack: TrackKey;
  secondaryTracks: TrackKey[];
  trackData: TrackData;
}

/**
 * Map a Project record (backend shape normalized by `normalizeProject`) to
 * the SubmitData shape used by this editor. Pulls primaryTrack /
 * secondaryTracks / trackData off via an `any` cast because they're not on
 * the canonical `Project` interface yet — the mock API persists them and
 * the real backend stores them as well, but they haven't been lifted into
 * the type.
 */
export function projectToSubmitData(p: Project): SubmitData {
  const raw = p as unknown as Record<string, unknown>;

  const creators: TeamMember[] = (p.creators || []).map((c) => ({
    _id: c._id || "",
    name: c.name,
    avatar: c.avatar,
    avatarUrl: c.avatarUrl,
    company: c.company,
    companyColor: c.companyColor || (c.company ? generateColor(c.company) : undefined),
    role: "creator" as const,
  }));
  const collabs: TeamMember[] = (p.collabs || []).map((c) => ({
    _id: c._id || "",
    name: c.name,
    avatar: c.avatar,
    avatarUrl: c.avatarUrl,
    company: c.company,
    companyColor: c.companyColor || (c.company ? generateColor(c.company) : undefined),
    role: "collaborator" as const,
  }));
  const team = [...creators, ...collabs];

  const mediaFiles: MediaFile[] = (p.media || [])
    .filter((m) => m.type !== "loom")
    .map((m) => ({ url: m.url, type: "image" as const }));

  // primaryTrack / secondaryTracks / trackData are persisted by the mock
  // API + real backend but aren't on the frontend Project type yet.
  const rawPrimary = raw.primaryTrack;
  const primaryTrack: TrackKey = (typeof rawPrimary === "string" && VALID_TRACKS.includes(rawPrimary as TrackKey))
    ? (rawPrimary as TrackKey)
    : "virality";
  const rawSecondaries = Array.isArray(raw.secondaryTracks) ? raw.secondaryTracks : [];
  const secondaryTracks: TrackKey[] = (rawSecondaries as unknown[])
    .filter((t): t is TrackKey => typeof t === "string" && VALID_TRACKS.includes(t as TrackKey) && t !== primaryTrack)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 2);
  const trackData: TrackData = (raw.trackData && typeof raw.trackData === "object")
    ? (raw.trackData as TrackData)
    : {};

  const githubUrl = (raw.githubUrl as string) || "";
  const demoUrl = (raw.demoUrl as string) || "";
  const videoUrl = (raw.videoUrl as string) || "";

  // If we only have `url`, try to classify it.
  const topUrl = (raw.url as string) || "";
  const inferredGithub = !githubUrl && isGithubUrl(topUrl) ? topUrl : githubUrl;
  const inferredDemo = !demoUrl && topUrl && !isGithubUrl(topUrl) && !/youtu/.test(topUrl) ? topUrl : demoUrl;
  const inferredVideo = !videoUrl && topUrl && /youtu/.test(topUrl) ? topUrl : videoUrl;

  const stack = Array.isArray(p.stack) && p.stack.length > 0
    ? (p.stack.includes(OPEN_CODE_STACK) ? p.stack : [OPEN_CODE_STACK, ...p.stack])
    : [OPEN_CODE_STACK];

  return {
    buildMode: team.length > 0 ? "team" : "solo",
    name: p.name || "",
    teamName: "",
    sameAsProject: true,
    tagline: p.tagline || "",
    description: p.description || "",
    stack,
    stackInput: "",
    team,
    teamInput: "",
    githubUrl: inferredGithub,
    githubPublicConfirmed: Boolean(inferredGithub),
    demoUrl: inferredDemo,
    videoUrl: inferredVideo,
    mediaFiles,
    primaryTrack,
    secondaryTracks,
    trackData,
  };
}

/**
 * Subscribe to a document/window event without useEffect — same pattern
 * as OCSubmitForm.
 */
function useEventSubscription(
  target: "window" | "document",
  event: string,
  handler: (e: Event) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useSyncExternalStore(
    (_onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const node = target === "window" ? window : document;
      const listener = (e: Event) => handlerRef.current(e);
      node.addEventListener(event, listener);
      return () => node.removeEventListener(event, listener);
    },
    () => 0,
    () => 0,
  );
}

type SectionId =
  | "section-basics"
  | "section-story"
  | "section-ship-it"
  | "section-tracks"
  | "section-track-data";

interface SectionDef {
  id: SectionId;
  label: string;
  isComplete: (d: SubmitData) => boolean;
}

const SECTIONS: SectionDef[] = [
  {
    id: "section-basics",
    label: "Basics",
    isComplete: (d) => d.name.trim().length > 0 && d.tagline.trim().length > 0,
  },
  {
    id: "section-story",
    label: "Story",
    isComplete: (d) => d.description.trim().length > 0,
  },
  {
    id: "section-ship-it",
    label: "Ship it",
    isComplete: (d) => d.githubUrl.trim().length > 0 && d.stack.length > 0,
  },
  {
    id: "section-tracks",
    label: "Tracks",
    isComplete: (d) => VALID_TRACKS.includes(d.primaryTrack),
  },
  {
    id: "section-track-data",
    label: "Track data",
    isComplete: (d) => {
      const td = d.trackData ?? {};
      if (d.primaryTrack === "virality") return Boolean(td.virality && Object.keys(td.virality).length > 0);
      if (d.primaryTrack === "revenue") return Boolean(td.revenue && Object.keys(td.revenue).length > 0);
      return Boolean(td.maas && Object.keys(td.maas).length > 0);
    },
  },
];

interface ProjectEditorProps {
  projectId: string | number;
  initialData: SubmitData;
  onSaved?: (patch: Partial<Project> & { id?: string | number }) => void;
}

export default function ProjectEditor({ projectId, initialData, onSaved }: ProjectEditorProps) {
  const navigate = useNavigate();

  const [data, setData] = useState<SubmitData>(initialData);
  const [activeSection, setActiveSection] = useState<SectionId>("section-basics");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  // Team search state (duplicated from OCSubmitForm intentionally — Agent B
  // owns OCSubmitForm so we don't refactor).
  const [collabResults, setCollabResults] = useState<{ _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingCollabs, setSearchingCollabs] = useState(false);
  const collabSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  useEventSubscription("document", "mousedown", (e) => {
    const target = e.target as Node | null;
    if (
      collabDropdownRef.current &&
      target &&
      !collabDropdownRef.current.contains(target)
    ) {
      setShowCollabDropdown(false);
    }
  });

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
          }));
          setCollabResults(users);
          setShowCollabDropdown(true);
        })
        .finally(() => setSearchingCollabs(false));
    }, 250);
  };

  const pickTeamMember = (u: { _id: string; name: string; avatar: string; avatarUrl?: string; company: string }) => {
    if (data.team.some(c => c._id === u._id)) return;
    const cc = u.company ? generateColor(u.company) : undefined;
    setData(d => ({
      ...d,
      team: [...d.team, { _id: u._id, name: u.name, avatar: u.avatar, avatarUrl: u.avatarUrl, company: u.company, companyColor: cc, role: 'collaborator' }],
      teamInput: "",
    }));
    setCollabResults([]);
    setShowCollabDropdown(false);
  };

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const githubLooksValid = data.githubUrl.trim() && isGithubUrl(data.githubUrl);

  const setDataUpdater: Dispatch<SetStateAction<SubmitData>> = (update) => {
    setData((prev) => (typeof update === "function" ? (update as (p: SubmitData) => SubmitData)(prev) : update));
  };

  const handleSave = async () => {
    setSaveError("");
    setSaving(true);
    try {
      const trimmedName = data.name.trim();
      const primaryUrl = data.demoUrl.trim() || data.videoUrl.trim() || data.githubUrl.trim() || "";
      const res = await bxApi(`/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          tagline: data.tagline.trim(),
          description: data.description,
          url: primaryUrl,
          githubUrl: data.githubUrl.trim(),
          demoUrl: data.demoUrl.trim(),
          videoUrl: data.videoUrl.trim(),
          stack: data.stack,
          media: data.mediaFiles.filter(m => !m.uploading).map(m => m.url),
          creators: data.team.filter(t => t.role === 'creator').map(t => t._id).filter(Boolean),
          collabs: data.team.filter(t => t.role === 'collaborator').map(t => t._id).filter(Boolean),
          primaryTrack: data.primaryTrack,
          secondaryTracks: data.secondaryTracks,
          trackData: data.trackData,
        }),
      });
      if (res.ok) {
        onSaved?.({
          id: projectId,
          name: trimmedName,
          tagline: data.tagline.trim(),
          description: data.description,
          stack: data.stack,
        });
        navigate("/my-projects");
        return;
      }
      setSaveError("Save failed. Try again.");
    } catch {
      setSaveError("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <style>{`
        .pe-input { width: 100%; border: 1px solid ${C.border}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.surface}; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .pe-input:focus { border-color: ${C.accent}; }
        .pe-input::placeholder { color: ${C.textSec}; }
        .pe-label { display: block; font-size: ${T.bodySm}px; font-weight: 600; color: ${C.text}; font-family: var(--sans); margin-bottom: 8px; }
        .pe-label .req { color: ${C.textMute}; font-weight: 400; }
        .pe-hint { font-size: ${T.caption}px; color: ${C.textMute}; font-family: var(--sans); margin-top: 6px; line-height: 1.5; }
        .pe-section { scroll-margin-top: 80px; padding-top: 60px; }
        .pe-section:first-child { padding-top: 12px; }
        .pe-section-title { font-size: ${T.heading}px; font-weight: 500; color: ${C.text}; font-family: var(--serif); margin: 0 0 18px; letter-spacing: -0.01em; }
        @media (max-width: 900px) {
          .pe-grid { grid-template-columns: 1fr !important; }
          .pe-sidebar { position: static !important; max-height: none !important; margin-bottom: 16px !important; }
        }
      `}</style>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => navigate("/my-projects")}
              title="Back to my projects"
              aria-label="Back to my projects"
              style={{
                width: 34, height: 34, borderRadius: 34, flexShrink: 0,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.textMute, transition: "all 0.12s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: T.caption, fontWeight: 600, color: C.textMute,
                fontFamily: "var(--sans)", letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                Edit project
              </div>
              <div style={{
                fontSize: T.subtitle, fontWeight: 550, color: C.text,
                fontFamily: "var(--sans)", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520,
              }}>
                {data.name || "Untitled"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveError && (
              <span style={{ fontSize: T.caption, color: C.errorText, fontFamily: "var(--sans)" }}>
                {saveError}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 20px", borderRadius: 10,
                border: "none",
                background: saving ? C.borderLight : C.accent,
                color: saving ? C.textMute : C.accentFg,
                fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
                cursor: saving ? "default" : "pointer", minWidth: 120,
                transition: "all 0.12s",
              }}
            >
              {saving ? "Saving\u2026" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{
        maxWidth: 1080, margin: "0 auto", padding: "24px 24px 100px",
      }}>
        <div className="pe-grid" style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 40,
          alignItems: "flex-start",
        }}>
          {/* Sidebar */}
          <aside className="pe-sidebar" style={{
            position: "sticky",
            top: 80,
            maxHeight: "calc(100vh - 96px)",
            overflowY: "auto",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{
              fontSize: T.caption, fontWeight: 650, color: C.textMute,
              fontFamily: "var(--sans)", letterSpacing: "0.04em",
              textTransform: "uppercase", marginBottom: 10, paddingLeft: 12,
            }}>
              Sections
            </div>
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              const done = s.isComplete(data);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => scrollToSection(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 10,
                    border: `1px solid ${active ? C.accent : "transparent"}`,
                    background: active ? C.accentSoft : "transparent",
                    cursor: "pointer", textAlign: "left",
                    color: active ? C.text : C.textSec,
                    fontSize: T.bodySm, fontWeight: active ? 600 : 500,
                    fontFamily: "var(--sans)",
                    transition: "all 0.12s",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 8, height: 8, borderRadius: 8, flexShrink: 0,
                      background: done ? C.green : C.borderLight,
                      border: done ? "none" : `1px solid ${C.border}`,
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>{s.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Content column */}
          <div style={{ maxWidth: 720, width: "100%" }}>
            {/* SECTION: Basics */}
            <section id="section-basics" className="pe-section">
              <h2 className="pe-section-title">Basics</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label className="pe-label">How are you building this?</label>
                  <div role="radiogroup" aria-label="Build mode" style={{ display: "flex", gap: 12 }}>
                    {([
                      { key: "solo", title: "Solo", sub: "Just me shipping this." },
                      { key: "team", title: "With a team", sub: "I built this with others." },
                    ] as { key: BuildMode; title: string; sub: string }[]).map(opt => {
                      const selected = data.buildMode === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setData(d => ({
                            ...d,
                            buildMode: opt.key,
                            team: opt.key === "solo" ? [] : d.team,
                            teamInput: opt.key === "solo" ? "" : d.teamInput,
                            sameAsProject: opt.key === "solo" ? true : d.sameAsProject,
                            teamName: opt.key === "solo" ? "" : d.teamName,
                          }))}
                          style={{
                            flex: 1, padding: "14px 14px", borderRadius: 12,
                            border: `1.5px solid ${selected ? C.accent : C.border}`,
                            background: selected ? C.accentSoft : C.surface,
                            cursor: "pointer", textAlign: "left",
                            display: "flex", alignItems: "flex-start", gap: 10,
                            transition: "all 0.15s",
                            fontFamily: "var(--sans)",
                          }}
                        >
                          <span aria-hidden style={{
                            width: 16, height: 16, borderRadius: 16, flexShrink: 0,
                            border: `1.5px solid ${selected ? C.accent : C.border}`,
                            background: C.surface,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            marginTop: 2,
                          }}>
                            {selected && (
                              <span style={{ width: 8, height: 8, borderRadius: 8, background: C.accent }} />
                            )}
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: T.bodySm, fontWeight: 600, color: C.text }}>{opt.title}</span>
                            <span style={{ fontSize: T.caption, color: C.textMute, lineHeight: 1.4 }}>{opt.sub}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="pe-label">
                    Project name <span className="req">*</span>
                  </label>
                  <input
                    className="pe-input"
                    placeholder="e.g. Pagesync, Mailcraft, Budgetly"
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="pe-label">
                    Tagline <span className="req">*</span>
                  </label>
                  <input
                    className="pe-input"
                    placeholder="One line that explains what it does"
                    value={data.tagline}
                    onChange={e => setData(d => ({ ...d, tagline: e.target.value }))}
                    maxLength={100}
                  />
                  <div style={{
                    display: "flex", justifyContent: "flex-end",
                    marginTop: 6, fontFamily: "var(--sans)", fontSize: T.caption,
                  }}>
                    <span style={{
                      color: data.tagline.length >= 90 ? (data.tagline.length >= 100 ? C.error : C.gold) : C.textMute,
                      fontWeight: data.tagline.length >= 100 ? 600 : 400,
                    }}>
                      {data.tagline.length}/100
                    </span>
                  </div>
                </div>

                {data.buildMode === "team" && (
                  <div ref={collabDropdownRef}>
                    <label className="pe-label">Team members</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="pe-input"
                        placeholder="Search GrowthX members by name…"
                        value={data.teamInput}
                        onChange={e => { const v = e.target.value; setData(d => ({ ...d, teamInput: v })); searchCollabs(v); }}
                        onFocus={() => { if (collabResults.length > 0) setShowCollabDropdown(true); }}
                      />
                      {searchingCollabs && (
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                          Searching…
                        </span>
                      )}
                      {showCollabDropdown && collabResults.length > 0 && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
                          maxHeight: 240, overflowY: "auto",
                        }}>
                          {collabResults.map(u => {
                            const already = data.team.some(c => c._id === u._id);
                            return (
                              <button
                                key={u._id}
                                type="button"
                                onClick={() => pickTeamMember(u)}
                                disabled={already}
                                style={{
                                  width: "100%", padding: "10px 14px", border: "none", background: "none",
                                  cursor: already ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10,
                                  textAlign: "left", opacity: already ? 0.4 : 1,
                                }}
                              >
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 28, border: `1px solid ${C.borderLight}`, flexShrink: 0, objectFit: "cover" }} />
                                ) : (
                                  <div style={{
                                    width: 28, height: 28, borderRadius: 28,
                                    background: C.accentSoft, color: C.textSec,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: T.badge, fontWeight: 650, fontFamily: "var(--sans)",
                                    border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                  }}>
                                    {u.avatar && u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: T.bodySm, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>{u.name}</div>
                                  {(u.role || u.company) && (
                                    <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)" }}>
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
                    {data.team.length > 0 && (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                          {data.team.map((c, ci) => (
                            <span key={ci} style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "5px 10px 5px 8px", borderRadius: 8,
                              background: C.accentSoft, border: `1px solid ${C.borderLight}`,
                              fontSize: T.bodySm, color: C.text, fontWeight: 480,
                              fontFamily: "var(--sans)",
                            }}>
                              <span style={{
                                width: 18, height: 18, borderRadius: 18,
                                background: C.borderLight, color: C.textSec,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: T.micro, fontWeight: 650, flexShrink: 0,
                              }}>
                                {c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </span>
                              {c.name}
                              <span
                                onClick={() => setData(d => ({
                                  ...d,
                                  team: d.team.map((t, idx) => idx === ci ? { ...t, role: t.role === 'creator' ? 'collaborator' : 'creator' } : t),
                                }))}
                                style={{
                                  fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                                  padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                                  fontFamily: "var(--sans)", userSelect: "none",
                                  background: c.role === 'creator' ? C.creatorBg : C.borderLight,
                                  color: c.role === 'creator' ? C.creator : C.textMute,
                                }}
                              >
                                {c.role === 'creator' ? 'Creator' : 'Collaborator'}
                              </span>
                              <span
                                onClick={() => setData(d => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) }))}
                                style={{ cursor: "pointer", fontSize: T.body, color: C.textMute, lineHeight: 1, marginTop: -1 }}
                              >{"\u00D7"}</span>
                            </span>
                          ))}
                        </div>
                        <div className="pe-hint">
                          Tap the role chip on any member to toggle Creator / Collaborator.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION: Story */}
            <section id="section-story" className="pe-section">
              <h2 className="pe-section-title">Story</h2>
              <div style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55, marginBottom: 14 }}>
                What did you build, why, and what happened when people used it?
              </div>
              <RichTextEditor
                value={data.description}
                onChange={(json) => setData(d => ({ ...d, description: json }))}
                maxChars={1500}
              />
            </section>

            {/* SECTION: Ship it */}
            <section id="section-ship-it" className="pe-section">
              <h2 className="pe-section-title">Ship it</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label className="pe-label">GitHub URL</label>
                  <input
                    className="pe-input"
                    placeholder="https://github.com/your-org/your-repo"
                    value={data.githubUrl}
                    onChange={e => setData(d => ({ ...d, githubUrl: e.target.value }))}
                  />
                  {data.githubUrl.trim() && !isGithubUrl(data.githubUrl) ? (
                    <div className="pe-hint" style={{ color: C.error }}>
                      That doesn&rsquo;t look like a GitHub URL.
                    </div>
                  ) : (
                    <div className="pe-hint">Public repo required.</div>
                  )}
                  {githubLooksValid && (
                    <label style={{
                      display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10,
                      padding: "10px 12px", border: `1px solid ${C.borderLight}`, borderRadius: 10,
                      background: C.surfaceWarm, fontSize: T.bodySm, color: C.text,
                      fontFamily: "var(--sans)", lineHeight: 1.45, cursor: "pointer",
                    }}>
                      <input
                        type="checkbox"
                        checked={data.githubPublicConfirmed}
                        onChange={e => setData(d => ({ ...d, githubPublicConfirmed: e.target.checked }))}
                        style={{ marginTop: 3, flexShrink: 0 }}
                      />
                      <span>I confirm this repository is public.</span>
                    </label>
                  )}
                </div>

                <div>
                  <label className="pe-label">
                    Demo / live URL <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    className="pe-input"
                    placeholder="https://your-app.com"
                    value={data.demoUrl}
                    onChange={e => setData(d => ({ ...d, demoUrl: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="pe-label">
                    Video URL <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    className="pe-input"
                    placeholder="https://youtube.com/watch?v=…"
                    value={data.videoUrl}
                    onChange={e => setData(d => ({ ...d, videoUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: C.borderLight, margin: "24px 0" }} />

              <MediaUpload
                label="Screenshots"
                value={data.mediaFiles}
                onChange={files => setData(d => ({ ...d, mediaFiles: typeof files === 'function' ? files(d.mediaFiles) : files }))}
              />

              <div style={{ height: 1, background: C.borderLight, margin: "24px 0" }} />

              <div>
                <label className="pe-label">Tech stack</label>
                {data.stack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {data.stack.map((s, si) => {
                      const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: C.accentFg };
                      const logoUrl = getStackLogoUrl(s);
                      const locked = s === OPEN_CODE_STACK;
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
                                style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderRadius: 5, objectFit: "contain", background: "#fff" }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                          </span>
                          {s}
                          {locked ? (
                            <span aria-hidden title="Required for Open Code Buildathon" style={{ fontSize: T.micro, color: C.textMute, marginLeft: 2 }}>
                              {"\u{1F512}"}
                            </span>
                          ) : (
                            <span
                              onClick={ev => { ev.stopPropagation(); setData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) })); }}
                              style={{ cursor: "pointer", fontSize: T.bodySm, color: C.textMute, lineHeight: 1, marginLeft: 2 }}
                            >{"\u00D7"}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {(() => {
                  const available = STACK_SUGGESTIONS.filter(s => !data.stack.includes(s));
                  if (available.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
                        Popular — tap to add
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {available.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setData(d => ({ ...d, stack: [...d.stack, s] }))}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "4px 10px 4px 8px", borderRadius: 20,
                              background: C.bg, border: `1px solid ${C.borderLight}`,
                              fontSize: T.label, color: C.textSec, fontWeight: 450,
                              fontFamily: "var(--sans)", cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="pe-input"
                    placeholder="Or type a custom one…"
                    value={data.stackInput}
                    onChange={e => setData(d => ({ ...d, stackInput: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === "Enter" && data.stackInput.trim()) {
                        e.preventDefault();
                        const val = data.stackInput.trim();
                        if (!data.stack.includes(val)) setData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                        else setData(d => ({ ...d, stackInput: "" }));
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  {data.stackInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const val = data.stackInput.trim();
                        if (val && !data.stack.includes(val)) setData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                        else setData(d => ({ ...d, stackInput: "" }));
                      }}
                      style={{
                        padding: "0 14px", borderRadius: 8, border: "none", background: C.accent,
                        fontSize: T.label, fontWeight: 600, color: C.accentFg,
                        cursor: "pointer", fontFamily: "var(--sans)", whiteSpace: "nowrap",
                      }}
                    >Add</button>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION: Tracks */}
            <section id="section-tracks" className="pe-section">
              <h2 className="pe-section-title">Tracks</h2>
              <OCTrackPickStep
                primary={data.primaryTrack}
                secondaries={data.secondaryTracks}
                onChange={(next) => setDataUpdater((d) => ({
                  ...d,
                  primaryTrack: next.primary,
                  secondaryTracks: next.secondaries,
                }))}
              />
            </section>

            {/* SECTION: Track data */}
            <section id="section-track-data" className="pe-section">
              <h2 className="pe-section-title">
                Track data
                <span style={{
                  marginLeft: 8, fontFamily: "var(--sans)",
                  fontSize: T.caption, color: C.textMute, fontWeight: 500,
                  letterSpacing: 0, verticalAlign: "middle",
                }}>
                  ({TRACK_LABELS[data.primaryTrack]}{data.secondaryTracks.length > 0 ? ` + ${data.secondaryTracks.map(t => TRACK_LABELS[t]).join(", ")}` : ""})
                </span>
              </h2>
              <OCTrackDataStep
                primary={data.primaryTrack}
                secondaries={data.secondaryTracks}
                trackData={data.trackData}
                onChange={(next) => setData((d) => ({ ...d, trackData: next }))}
              />
            </section>

            {/* Sticky-bottom save row — redundant with top bar but helpful after a
                long scroll. */}
            <div style={{
              display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12,
              marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.borderLight}`,
            }}>
              {saveError && (
                <span style={{ fontSize: T.bodySm, color: C.errorText, fontFamily: "var(--sans)" }}>
                  {saveError}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  border: "none",
                  background: saving ? C.borderLight : C.accent,
                  color: saving ? C.textMute : C.accentFg,
                  fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
                  cursor: saving ? "default" : "pointer", minWidth: 140,
                }}
              >
                {saving ? "Saving\u2026" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
