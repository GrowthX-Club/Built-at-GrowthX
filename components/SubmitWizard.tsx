import { useRef, useState, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import { createPortal } from "react-dom";
import {
  C,
  T,
  STACK_META,
  type BuilderProfile,
  type Project,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useResponsive } from "@/hooks/useMediaQuery";
import RichTextEditor from "@/components/RichTextEditor";
import MediaUpload from "@/components/MediaUpload";
import { descriptionCharCount } from "@/lib/editor-utils";

export interface TeamEntry {
  _id: string;
  name: string;
  avatar?: string;
  company?: string;
  companyColor?: string;
  role: "creator" | "collaborator";
}

export interface WizardMediaFile {
  url: string;
  type: "image";
  uploading?: boolean;
  progress?: string;
}

export interface WizardData {
  name: string;
  tagline: string;
  description: string;
  buildProcess: string;
  stack: string[];
  stackInput: string;
  team: TeamEntry[];
  teamInput: string;
  url: string;
  mediaFiles: WizardMediaFile[];
}

const EMPTY_DATA: WizardData = {
  name: "",
  tagline: "",
  description: "",
  buildProcess: "",
  stack: [],
  stackInput: "",
  team: [],
  teamInput: "",
  url: "",
  mediaFiles: [],
};

function generateCompanyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
  return colors[Math.abs(hash) % colors.length];
}

function useDocumentClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
) {
  const handlerRef = useRef(onOutside);
  handlerRef.current = onOutside;
  useSyncExternalStore(
    (_onStoreChange) => {
      if (typeof document === "undefined") return () => {};
      const listener = (e: MouseEvent) => {
        const node = ref.current;
        if (node && !node.contains(e.target as Node)) handlerRef.current();
      };
      document.addEventListener("mousedown", listener);
      return () => document.removeEventListener("mousedown", listener);
    },
    () => 0,
    () => 0,
  );
}

interface SubmitWizardProps {
  open: boolean;
  mode: "create" | "edit";
  projectId?: string | number;
  initialData?: Partial<WizardData>;
  user: BuilderProfile | null;
  onClose: () => void;
  onCreated?: () => void;
  onSaved?: (patch: Partial<Project> & { id?: string | number }) => void;
}

export default function SubmitWizard({
  open,
  mode,
  projectId,
  initialData,
  user,
  onClose,
  onCreated,
  onSaved,
}: SubmitWizardProps) {
  const { isMobile } = useResponsive();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => ({ ...EMPTY_DATA, ...initialData }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [teamResults, setTeamResults] = useState<
    { _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]
  >([]);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [searchingTeam, setSearchingTeam] = useState(false);
  const teamSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  useDocumentClickOutside(teamDropdownRef, () => setShowTeamDropdown(false));

  // Reset when dialog reopens with new initial data (edit another row, etc.)
  const lastOpenRef = useRef(open);
  const lastKeyRef = useRef<string | number | undefined>(projectId);
  if (open && (!lastOpenRef.current || lastKeyRef.current !== projectId)) {
    lastOpenRef.current = true;
    lastKeyRef.current = projectId;
    // Initialize fresh on every open
    setStep(0);
    setError("");
    setData({ ...EMPTY_DATA, ...initialData });
  } else if (!open && lastOpenRef.current) {
    lastOpenRef.current = false;
  }

  if (!open) return null;

  const searchTeam = (query: string) => {
    if (teamSearchTimer.current) clearTimeout(teamSearchTimer.current);
    if (query.length < 2) {
      setTeamResults([]);
      setShowTeamDropdown(false);
      setSearchingTeam(false);
      return;
    }
    setSearchingTeam(true);
    teamSearchTimer.current = setTimeout(() => {
      bxApi(`/users/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          const users = (d.users || [])
            .map((u: Record<string, unknown>) => ({
              _id: (u._id ?? "") as string,
              name: (u.name ?? "") as string,
              avatar: (u.initials ?? u.avatar ?? "?") as string,
              avatarUrl: (u.avatar_url ?? undefined) as string | undefined,
              company: (u.company ?? "") as string,
              role: (u.role ?? "") as string,
            }))
            .filter((u: { _id: string }) => !user?._id || u._id !== user._id);
          setTeamResults(users);
          setShowTeamDropdown(true);
        })
        .finally(() => setSearchingTeam(false));
    }, 250);
  };

  const pickTeamMember = (u: { _id: string; name: string; avatar: string; company: string }) => {
    if (data.team.some((c) => c._id === u._id)) return;
    setData((d) => ({
      ...d,
      team: [
        ...d.team,
        {
          _id: u._id,
          name: u.name,
          avatar: u.avatar,
          company: u.company || undefined,
          companyColor: u.company ? generateCompanyColor(u.company) : undefined,
          role: "collaborator",
        },
      ],
      teamInput: "",
    }));
    setTeamResults([]);
    setShowTeamDropdown(false);
  };

  const validateAndAdvance = () => {
    setError("");
    if (step === 0) {
      if (!data.name.trim()) return setError("Project name is required.");
      if (!data.tagline.trim()) return setError("Tagline is required.");
      if (data.url.trim() && !/^https?:\/\/.+/.test(data.url.trim())) {
        return setError("Please enter a valid URL starting with http:// or https://");
      }
      setStep(1);
    } else if (step === 1) {
      if (descriptionCharCount(data.description) === 0) {
        return setError("Description is required. Tell us what you built.");
      }
      if (descriptionCharCount(data.description) > 1500) {
        return setError("Description must be 1500 characters or less.");
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      if (data.stack.length === 0) return setError("Add at least one tech stack item.");
      void performSave(false);
    }
  };

  const performSave = async (asDraft: boolean) => {
    setError("");
    if (mode === "create" && !asDraft) {
      if (!data.url.trim()) {
        setStep(0);
        return setError("Product URL is required. Save as draft if you don't have one yet.");
      }
      if (!/^https?:\/\/.+/.test(data.url.trim())) {
        setStep(0);
        return setError("Please enter a valid URL starting with http:// or https://");
      }
    }
    if (!data.name.trim()) { setStep(0); return setError("Project name is required."); }
    if (!data.tagline.trim()) { setStep(0); return setError("Tagline is required."); }
    if (data.stack.length === 0) { setStep(3); return setError("Add at least one tech stack item."); }

    setSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        tagline: data.tagline.trim(),
        description: data.description,
        buildProcess: data.buildProcess,
        category: "AI",
        stack: data.stack,
        url: data.url.trim() || undefined,
        media: data.mediaFiles.filter((m) => !m.uploading).map((m) => m.url),
        creators: data.team.filter((c) => c.role === "creator").map((c) => c._id).filter(Boolean),
        collabs: data.team.filter((c) => c.role === "collaborator").map((c) => c._id).filter(Boolean),
        ...(mode === "create" ? { isDraft: asDraft } : {}),
      };
      const res =
        mode === "create"
          ? await bxApi("/projects", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await bxApi(`/projects/${projectId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      if (res.ok) {
        if (mode === "create") onCreated?.();
        else
          onSaved?.({
            id: projectId,
            name: payload.name,
            tagline: payload.tagline,
            description: payload.description,
            buildProcess: payload.buildProcess,
            stack: payload.stack,
            url: payload.url,
          });
        onClose();
        return;
      }
      const body = await res.json().catch(() => null);
      const msg = body?.message || body?.error;
      if (res.status === 401) setError("Your session has expired. Please log in again.");
      else if (res.status === 400 && msg) setError(msg);
      else setError(msg || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ["The basics", "The story", "Build process", "Tech and team"];
  const finalLabel = mode === "create" ? "Submit" : "Save changes";
  const finalLabelSubmitting = mode === "create" ? "Submitting\u2026" : "Saving\u2026";

  const body = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(24,23,16,0.4)", backdropFilter: "blur(6px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      <div
        className={isMobile ? "responsive-modal-full" : "responsive-modal"}
        style={{
          position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 540,
          background: C.surface, borderRadius: isMobile ? 0 : 20,
          border: isMobile ? "none" : `1px solid ${C.border}`,
          boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          overflow: isMobile ? "auto" : "hidden",
          animation: "fadeUp 0.25s ease-out",
          ...(isMobile ? { height: "100%", maxHeight: "100vh" } : {}),
        }}
      >
        <style>{`
          .sw-input { width: 100%; border: 1px solid ${C.border}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.surface}; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
          .sw-input:focus { border-color: ${C.accent}; }
          .sw-input::placeholder { color: ${C.textSec}; }
        `}</style>

        <div style={{ height: 3, background: C.borderLight }}>
          <div style={{
            height: 3, background: C.accent,
            width: `${((step + 1) / 4) * 100}%`,
            transition: "width 0.3s ease",
            borderRadius: 3,
          }} />
        </div>

        <div style={{ padding: "20px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setStep((s) => Math.max(0, s - 1)); }}
                aria-label="Back"
                style={{
                  width: 32, height: 32, borderRadius: 32, flexShrink: 0,
                  border: `1px solid ${C.border}`, background: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: C.textSec, transition: "all 0.12s",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: T.caption, fontWeight: 600, color: C.textMute,
                fontFamily: "var(--sans)", letterSpacing: "0.04em",
                textTransform: "uppercase", marginBottom: 4,
              }}>
                {mode === "edit" ? `Edit · ${stepLabels[step]}` : stepLabels[step]}
              </div>
              <div style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 400 }}>
                Step {step + 1} of 4
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              width: 32, height: 32, borderRadius: 32, flexShrink: 0,
              border: `1px solid ${C.border}`, background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: T.bodyLg, color: C.textSec,
              transition: "all 0.12s",
            }}
          >{"\u00D7"}</button>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, lineHeight: 1.55 }}>
                {mode === "edit" ? "Update the basics of your project." : "Tell us about your project. What did you ship?"}
              </div>
              <div>
                <label style={{ display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 8 }}>
                  Project name <span style={{ color: C.textMute, fontWeight: 400 }}>*</span>
                </label>
                <input
                  className="sw-input"
                  placeholder="e.g. Pagesync, Mailcraft, Budgetly"
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                  autoFocus
                  style={{ fontSize: T.bodyLg, fontWeight: 500, fontFamily: "var(--serif)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 8 }}>
                  Tagline <span style={{ color: C.textMute, fontWeight: 400 }}>*</span>
                </label>
                <input
                  className="sw-input"
                  placeholder="One line that explains what it does"
                  value={data.tagline}
                  onChange={(e) => setData((d) => ({ ...d, tagline: e.target.value }))}
                  maxLength={100}
                  style={{ borderColor: data.tagline.length >= 100 ? C.error : undefined }}
                />
                <div style={{
                  fontSize: T.caption, marginTop: 6, textAlign: "right", fontFamily: "var(--sans)",
                  color: data.tagline.length >= 90 ? (data.tagline.length >= 100 ? C.error : C.gold) : C.textMute,
                  fontWeight: data.tagline.length >= 100 ? 600 : 400,
                }}>
                  {data.tagline.length}/100{data.tagline.length >= 100 && " — limit reached"}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 8 }}>
                  Product URL {mode === "create" ? <span style={{ color: C.textMute, fontWeight: 400 }}>*</span> : null}
                </label>
                <input
                  className="sw-input"
                  placeholder="https://yourproject.com"
                  value={data.url}
                  onChange={(e) => setData((d) => ({ ...d, url: e.target.value }))}
                />
              </div>
              <MediaUpload
                value={data.mediaFiles}
                onChange={(files) => setData((d) => ({ ...d, mediaFiles: typeof files === "function" ? files(d.mediaFiles) : files }))}
              />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, lineHeight: 1.55, marginBottom: 20 }}>
                Write like you&apos;re telling a friend what you built and why. The best submissions answer three things:
              </div>
              <div style={{ marginBottom: 20, paddingLeft: 2 }}>
                {[
                  { q: "The problem", hint: "What were you trying to solve?" },
                  { q: "The build", hint: "What did you make?" },
                  { q: "The outcome", hint: "What happened when people used it?" },
                ].map((prompt, pi) => (
                  <div key={pi} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: pi < 2 ? 8 : 0 }}>
                    <span style={{ fontSize: T.label, fontWeight: 650, color: C.textMute, fontFamily: "var(--mono)", minWidth: 16 }}>{pi + 1}.</span>
                    <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                      <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                    </span>
                  </div>
                ))}
              </div>
              <RichTextEditor
                value={data.description}
                onChange={(json) => setData((d) => ({ ...d, description: json }))}
                maxChars={1500}
              />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, lineHeight: 1.55, marginBottom: 20 }}>
                Walk us through how you actually built this. Think of it as the behind-the-scenes for fellow builders.
              </div>
              <div style={{ marginBottom: 20, paddingLeft: 2 }}>
                {[
                  { q: "Tools & tech choices", hint: "e.g. \"Went with Next.js + Supabase because I needed auth fast\"" },
                  { q: "Biggest challenge", hint: "e.g. \"Spent 2 days debugging OAuth — turned out it was a cookie domain issue\"" },
                  { q: "What you'd do differently", hint: "e.g. \"Would skip building a custom CMS and just use Notion API\"" },
                ].map((prompt, pi) => (
                  <div key={pi} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: pi < 2 ? 8 : 0 }}>
                    <span style={{ fontSize: T.label, fontWeight: 650, color: C.textMute, fontFamily: "var(--mono)", minWidth: 16 }}>{pi + 1}.</span>
                    <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                      <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                    </span>
                  </div>
                ))}
              </div>
              <RichTextEditor
                value={data.buildProcess}
                onChange={(json) => setData((d) => ({ ...d, buildProcess: json }))}
                maxChars={1500}
              />
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 10 }}>
                  Tech stack
                </div>

                {data.stack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {data.stack.map((s, si) => {
                      const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: C.accentFg };
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
                                style={{ position: "absolute", top: 0, left: 0, width: 20, height: 20, borderRadius: 5, objectFit: "contain", background: "#fff" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                          </span>
                          {s}
                          <span
                            onClick={(ev) => { ev.stopPropagation(); setData((d) => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) })); }}
                            style={{ cursor: "pointer", fontSize: T.bodySm, color: C.textMute, lineHeight: 1, marginLeft: 2, transition: "color 0.1s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = C.textMute; }}
                          >{"\u00D7"}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {(() => {
                  const suggestions = [
                    "Next.js", "React", "Python", "Node.js", "TypeScript",
                    "Claude API", "OpenAI", "OpenClaw", "Supabase", "Firebase", "MongoDB",
                    "PostgreSQL", "Tailwind CSS", "Flutter", "FastAPI", "Vercel",
                    "AWS", "Docker", "Stripe", "Prisma", "Go",
                  ];
                  const available = suggestions.filter((s) => !data.stack.includes(s));
                  if (available.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
                        Popular — tap to add
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {available.map((s) => {
                          const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: C.accentFg };
                          const logoUrl = getStackLogoUrl(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setData((d) => ({ ...d, stack: [...d.stack, s] }))}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "4px 10px 4px 5px", borderRadius: 20,
                                background: C.surface, border: `1px solid ${C.border}`,
                                fontSize: T.label, color: C.textSec, fontWeight: 450,
                                fontFamily: "var(--sans)", cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
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
                                    style={{ position: "absolute", top: 0, left: 0, width: 18, height: 18, borderRadius: 4, objectFit: "contain", background: "#fff" }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="sw-input"
                    placeholder="Or type a custom one..."
                    value={data.stackInput}
                    onChange={(e) => setData((d) => ({ ...d, stackInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && data.stackInput.trim()) {
                        e.preventDefault();
                        const val = data.stackInput.trim();
                        if (!data.stack.includes(val)) {
                          setData((d) => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                        } else {
                          setData((d) => ({ ...d, stackInput: "" }));
                        }
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  {data.stackInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const val = data.stackInput.trim();
                        if (val && !data.stack.includes(val)) {
                          setData((d) => ({ ...d, stack: [...d.stack, val], stackInput: "" }));
                        } else {
                          setData((d) => ({ ...d, stackInput: "" }));
                        }
                      }}
                      style={{
                        padding: "0 14px", borderRadius: 8,
                        border: "none", background: C.accent,
                        fontSize: T.label, fontWeight: 600, color: C.accentFg,
                        cursor: "pointer", fontFamily: "var(--sans)",
                        whiteSpace: "nowrap", transition: "opacity 0.12s",
                      }}
                    >Add</button>
                  )}
                </div>
                <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 5, fontFamily: "var(--sans)" }}>
                  Press enter or click Add
                </div>
              </div>

              <div style={{ height: 1, background: C.borderLight }} />

              <div ref={teamDropdownRef}>
                <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
                  Team members (optional)
                </div>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input
                    className="sw-input"
                    placeholder="Search by name..."
                    value={data.teamInput}
                    onChange={(e) => { const v = e.target.value; setData((d) => ({ ...d, teamInput: v })); searchTeam(v); }}
                    onFocus={() => { if (teamResults.length > 0) setShowTeamDropdown(true); }}
                  />
                  {searchingTeam && (
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                      Searching...
                    </span>
                  )}
                  {!searchingTeam && data.teamInput.trim().length >= 2 && teamResults.length === 0 && (
                    <div style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6 }}>
                      No members found for &ldquo;{data.teamInput.trim()}&rdquo;
                    </div>
                  )}
                  {showTeamDropdown && teamResults.length > 0 && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100,
                      maxHeight: 200, overflowY: "auto",
                    }}>
                      {teamResults.map((u) => {
                        const already = data.team.some((c) => c._id === u._id);
                        return (
                          <button
                            key={u._id}
                            onClick={() => pickTeamMember(u)}
                            disabled={already}
                            style={{
                              width: "100%", padding: "10px 14px", border: "none", background: "none",
                              cursor: already ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10,
                              textAlign: "left", transition: "background 0.1s", opacity: already ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = C.accentSoft; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            <div style={{
                              width: 28, height: 28, borderRadius: 28,
                              background: C.accentSoft, color: C.textSec,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: T.badge, fontWeight: 650, fontFamily: "var(--sans)",
                              border: `1px solid ${C.border}`, flexShrink: 0,
                            }}>
                              {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.team.map((c, ci) => (
                      <span key={ci} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 10px 5px 8px", borderRadius: 8,
                        background: C.accentSoft, border: `1px solid ${C.border}`,
                        fontSize: T.bodySm, color: C.text, fontWeight: 480,
                        fontFamily: "var(--sans)",
                      }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 18,
                          background: C.borderLight, color: C.textSec,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: T.micro, fontWeight: 650, flexShrink: 0,
                        }}>
                          {(c.avatar && c.avatar.length <= 3) ? c.avatar : c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        {c.name}
                        <span
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setData((d) => ({
                              ...d,
                              team: d.team.map((t, idx) => idx === ci ? { ...t, role: t.role === "creator" ? "collaborator" : "creator" } : t),
                            }));
                          }}
                          style={{
                            fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                            padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                            fontFamily: "var(--sans)", userSelect: "none",
                            background: c.role === "creator" ? C.creatorBg : C.borderLight,
                            color: c.role === "creator" ? C.creator : C.textMute,
                            transition: "all 0.15s",
                          }}
                        >
                          {c.role === "creator" ? "Creator" : "Collaborator"}
                        </span>
                        <span
                          onClick={(ev) => { ev.stopPropagation(); setData((d) => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) })); }}
                          style={{ cursor: "pointer", fontSize: T.body, color: C.textMute, lineHeight: 1, marginTop: -1 }}
                        >{"\u00D7"}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: T.caption, color: C.textMute, marginTop: 6, fontFamily: "var(--sans)" }}>
                  Search for GrowthX members — tap role to toggle Creator / Collaborator
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: "10px 14px", borderRadius: 10,
              background: C.errorSoft, border: `1px solid ${C.errorBorder}`,
              fontSize: T.bodySm, color: C.errorText, fontFamily: "var(--sans)",
              fontWeight: 450, lineHeight: 1.45,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", marginTop: error ? 16 : 28 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={validateAndAdvance}
                disabled={submitting}
                style={{
                  padding: "9px 24px", borderRadius: 10, border: "none",
                  background: submitting ? C.borderLight : C.accent,
                  fontSize: T.bodySm, fontWeight: 600,
                  color: submitting ? C.textMute : C.accentFg,
                  cursor: submitting ? "default" : "pointer",
                  fontFamily: "var(--sans)", transition: "all 0.15s",
                  opacity: submitting ? 0.7 : 1, minWidth: 160,
                }}
              >
                {submitting ? finalLabelSubmitting : step === 3 ? finalLabel : "Continue"}
              </button>

              {mode === "create" && step === 3 && !submitting && (
                <button
                  type="button"
                  onClick={() => void performSave(true)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: T.bodySm, fontWeight: 450, color: C.textMute,
                    cursor: "pointer", fontFamily: "var(--sans)",
                  }}
                >
                  or save as draft
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return body;
  return createPortal(body, document.body);
}
