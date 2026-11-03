import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams, useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  C,
  T,
  STACK_META,
  type BuilderProfile,
  normalizeUser,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import RichTextEditor from "@/components/RichTextEditor";
import ProjectListView from "@/components/ProjectListView";
import SearchBox from "@/components/SearchBox";
import CollectionCard from "@/components/CollectionCard";
import SkillsPanel from "@/components/SkillsPanel";
import {
  type SortKey, SITE_URL, BUILD_SPRINT, COLLECTIONS,
  fetchProjects, fetchCollectionStats, usefulCategories, listParams,
} from "@/lib/collections";
import { itemListLd, pageMeta } from "@/lib/seo";
import { normalizeProject } from "@/types";

const HOME_SORTS: SortKey[] = ["best", "trending", "new"];

export async function loader({ request }: LoaderFunctionArgs) {
  const { sort, category, q } = listParams(request.url, HOME_SORTS);
  const [list, stats, skills] = await Promise.all([
    fetchProjects({ sort, category: category || undefined, limit: 20 }),
    fetchCollectionStats(),
    fetchProjects({ has_skill: true, sort: "installs", limit: 3 }),
  ]);
  return { list, stats, skills: skills.projects, sort, category, q };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  ...pageMeta({
    title: "Built at GrowthX — what the GrowthX community shipped",
    description: "The best products and AI skills built by GrowthX members, from Build Sprint, buildathons and side projects. Try them, upvote them, see who built them.",
    path: "/",
  }),
  ...(data ? [{ "script:ld+json": itemListLd("Best projects built at GrowthX", "/", data.list.projects) }] : []),
];
import { descriptionCharCount } from "@/lib/editor-utils";
import MediaUpload from "@/components/MediaUpload";

// ---- Main ----
export default function HomePage() {
  const data = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(data.q);
  const searching = query.trim().length >= 2;
  const categories = usefulCategories(data.stats.categories);
  const skills = data.skills.map(normalizeProject);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openLoginDialog } = useLoginDialog();
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  // One Submit button everywhere: it first asks whether this is a project or a skill.
  const [submitKind, setSubmitKind] = useState<"choose" | "project">("choose");
  const [submitData, setSubmitData] = useState({
    name: "", tagline: "", description: "", buildProcess: "",
    stack: [] as string[], stackInput: "",
    team: [] as { _id: string; name: string; avatar?: string; company?: string; companyColor?: string; role: 'creator' | 'collaborator' }[], teamInput: "",
    url: "", isDraft: false, mediaFiles: [] as { url: string; type: "image" | "loom" | "youtube"; uploading?: boolean; progress?: string }[],
  });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const { isMobile } = useResponsive();
  const [collabResults, setCollabResults] = useState<{ _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingCollabs, setSearchingCollabs] = useState(false);
  const collabSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  const loadUser = useCallback(() => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .finally(() => setUserLoaded(true));
  }, []);

  const triggerListRefresh = useCallback(() => {
    setListRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collabDropdownRef.current && !collabDropdownRef.current.contains(e.target as Node)) setShowCollabDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchParams.get("submit") !== "1" || !userLoaded) return;
    navigate("/", { replace: true });
    if (!user) {
      openLoginDialog(() => { loadUser(); });
      return;
    }
    setShowSubmit(true);
    setSubmitKind("choose");
    setSubmitStep(0);
    setSubmitData({ name: "", tagline: "", description: "", buildProcess: "", stack: [], stackInput: "", team: [], teamInput: "", url: "", isDraft: false, mediaFiles: [] });
    setSubmitError("");
  }, [searchParams, user, userLoaded, navigate, openLoginDialog, loadUser]);

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
    openLoginDialog(() => { loadUser(); triggerListRefresh(); });
  };

  const handleSubmitProject = async (asDraft = false) => {
    if (!user) {
      handleSignIn();
      return;
    }
    setSubmitError("");

    const savingAsDraft = asDraft || submitData.isDraft;

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
    if (!savingAsDraft) {
      if (!submitData.url?.trim()) {
        setSubmitError("Product URL is required. Save as draft if you don't have one yet.");
        setSubmitStep(0);
        return;
      }
      if (!/^https?:\/\/.+/.test(submitData.url.trim())) {
        setSubmitError("Please enter a valid URL starting with http:// or https://");
        setSubmitStep(0);
        return;
      }
    } else if (submitData.url?.trim() && !/^https?:\/\/.+/.test(submitData.url.trim())) {
      setSubmitError("Please enter a valid URL starting with http:// or https://");
      setSubmitStep(0);
      return;
    }
    if (submitData.stack.length === 0) {
      setSubmitError("Add at least one tech stack item.");
      setSubmitStep(3);
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
          description: submitData.description,
          category: "AI",
          stack: submitData.stack,
          url: submitData.url?.trim() || undefined,
          media: submitData.mediaFiles.filter(m => !m.uploading).map(m => m.url),
          creators: submitData.team.filter(c => c.role === 'creator').map(c => c._id),
          collabs: submitData.team.filter(c => c.role === 'collaborator').map(c => c._id),
        }),
      });
      if (res.ok) {
        setShowSubmit(false);
        setSubmitStep(0);
        setSubmitData({ name: "", tagline: "", description: "", buildProcess: "", stack: [], stackInput: "", team: [], teamInput: "", url: "", isDraft: false, mediaFiles: [] });
        setSubmitError("");
        triggerListRefresh();
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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="page">
        <header className="page-head">
          <h1 className="page-title">What the community shipped</h1>
          <p className="page-sub">Products built by the GrowthX community. Ranked by the people who build.</p>
          <SearchBox value={query} onChange={setQuery} placeholder="Search projects, builders or tools" />
        </header>

        {!searching && (
          <section className="home-section" aria-labelledby="events-title">
            <div className="section-head">
              <h2 className="bx-section-title" id="events-title">Browse by event</h2>
              <Link to="/events" className="text-link">All events →</Link>
            </div>
            <div className="coll-grid">
              {COLLECTIONS.slice(0, 3).map(c => <CollectionCard key={c.slug} c={c} stats={data.stats} feature={c === BUILD_SPRINT} />)}
            </div>
          </section>
        )}

        <div className="home-cols" style={searching ? { gridTemplateColumns: "minmax(0, 1fr)", marginTop: 24 } : undefined}>
          <section aria-labelledby="projects-title">
            {!searching && (
              <div className="section-head">
                <h2 className="bx-section-title" id="projects-title">Projects</h2>
              </div>
            )}
            <ProjectListView
              initial={data.list}
              sorts={HOME_SORTS}
              sort={data.sort}
              categories={categories}
              category={data.category}
              query={query}
              onClearQuery={() => setQuery("")}
              refreshKey={listRefreshKey}
            />
          </section>
          {!searching && <aside><SkillsPanel skills={skills} /></aside>}
        </div>
      </main>

      {/* ---- SUBMIT FLOW ---- */}
      {showSubmit && createPortal(
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
              .submit-input { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; }
              .submit-input:focus { border-color: ${C.accent}; }
              .submit-input::placeholder { color: ${C.textMute}; }
              .submit-input-lg { font-size: ${T.logo}px; font-weight: 500; font-family: var(--serif); }
              .submit-textarea { width: 100%; border: 1px solid ${C.borderLight}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.bg}; outline: none; transition: border-color 0.15s; resize: vertical; min-height: 100px; line-height: 1.5; }
              .submit-textarea:focus { border-color: ${C.accent}; }
              .submit-textarea::placeholder { color: ${C.textMute}; }
            `}</style>

            {submitKind === "choose" && (
              <div style={{ padding: "24px 28px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: T.bodyLg, fontWeight: 600, color: C.text, fontFamily: "var(--sans)" }}>
                    What are you submitting?
                  </div>
                  <button onClick={() => setShowSubmit(false)} aria-label="Close" style={{
                    width: 32, height: 32, borderRadius: 32,
                    border: `1px solid ${C.borderLight}`, background: "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
                  >{"×"}</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                  {([
                    {
                      key: "project",
                      title: "A project",
                      body: "Something you built that people use: an app, a website or a tool. It gets its own page where members vote and comment.",
                      go: () => setSubmitKind("project"),
                    },
                    {
                      key: "skill",
                      title: "A skill",
                      body: "Instructions that teach an AI assistant a task, as a folder with a SKILL.md file. GrowthX checks it, then anyone can add it to Claude, ChatGPT, Claude Code or Codex.",
                      go: () => { setShowSubmit(false); navigate("/skills/new"); },
                    },
                  ] as const).map(o => (
                    <button key={o.key} onClick={o.go} style={{
                      display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left",
                      padding: "16px 18px", borderRadius: 14, border: `1px solid ${C.border}`,
                      background: C.surface, cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.surfaceWarm; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", marginBottom: 4 }}>{o.title}</div>
                        <div style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.55 }}>{o.body}</div>
                      </div>
                      <span style={{ fontSize: T.bodyLg, color: C.textMute }}>{"→"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitKind === "project" && (<>
            {/* Progress bar */}
            <div style={{ height: 3, background: C.borderLight }}>
              <div style={{
                height: 3, background: C.accent,
                width: `${((submitStep + 1) / 4) * 100}%`,
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
                  fontSize: T.caption, fontWeight: 600, color: C.textMute,
                  fontFamily: "var(--sans)", letterSpacing: "0.04em",
                  textTransform: "uppercase", marginBottom: 4,
                }}>
                  {["The basics", "The story", "Build process", "Tech and team"][submitStep]}
                </div>
                <div style={{
                  fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 400,
                }}>
                  Step {submitStep + 1} of 4
                </div>
              </div>
              <button onClick={() => setShowSubmit(false)} style={{
                width: 32, height: 32, borderRadius: 32,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.color = C.textMute; }}
              >{"×"}</button>
            </div>

            {/* Step content */}
            <div style={{ padding: "24px 28px 28px" }}>

              {/* Step 0: Name, tagline, URL */}
              {submitStep === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{
                    fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
                    fontWeight: 400, lineHeight: 1.55,
                  }}>
                    Tell us about your project. What did you ship?
                  </div>
                  <div>
                    <label style={{
                      display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text,
                      fontFamily: "var(--sans)", marginBottom: 8,
                    }}>
                      Project name <span style={{ color: C.textMute, fontWeight: 400 }}>*</span>
                    </label>
                    <input
                      className="submit-input"
                      placeholder="e.g. Pagesync, Mailcraft, Budgetly"
                      value={submitData.name}
                      onChange={e => setSubmitData(d => ({ ...d, name: e.target.value }))}
                      autoFocus
                      style={{ fontSize: T.bodyLg, fontWeight: 500, fontFamily: "var(--serif)" }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text,
                      fontFamily: "var(--sans)", marginBottom: 8,
                    }}>
                      Tagline <span style={{ color: C.textMute, fontWeight: 400 }}>*</span>
                    </label>
                    <input
                      className="submit-input"
                      placeholder="One line that explains what it does"
                      value={submitData.tagline}
                      onChange={e => setSubmitData(d => ({ ...d, tagline: e.target.value }))}
                      maxLength={100}
                      style={{ borderColor: submitData.tagline.length >= 100 ? C.error : undefined }}
                    />
                    <div style={{
                      fontSize: T.caption, marginTop: 6, textAlign: "right", fontFamily: "var(--sans)",
                      color: submitData.tagline.length >= 90 ? (submitData.tagline.length >= 100 ? C.error : C.gold) : C.textMute,
                      fontWeight: submitData.tagline.length >= 100 ? 600 : 400,
                    }}>
                      {submitData.tagline.length}/100{submitData.tagline.length >= 100 && " — limit reached"}
                    </div>
                  </div>
                  <div>
                    <label style={{
                      display: "block", fontSize: T.bodySm, fontWeight: 600, color: C.text,
                      fontFamily: "var(--sans)", marginBottom: 8,
                    }}>
                      Product URL <span style={{ color: C.textMute, fontWeight: 400 }}>*</span>
                    </label>
                    <input
                      className="submit-input"
                      placeholder="https://yourproject.com"
                      value={submitData.url}
                      onChange={e => setSubmitData(d => ({ ...d, url: e.target.value }))}
                    />
                  </div>
                  <MediaUpload
                    value={submitData.mediaFiles}
                    onChange={files => setSubmitData(d => ({ ...d, mediaFiles: typeof files === 'function' ? files(d.mediaFiles) : files }))}
                  />
                </div>
              )}

              {/* Step 1: The story */}
              {submitStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{
                    fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
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
                          fontSize: T.label, fontWeight: 650, color: C.textMute,
                          fontFamily: "var(--mono)", minWidth: 16,
                        }}>
                          {pi + 1}.
                        </span>
                        <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                          <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <RichTextEditor
                    value={submitData.description}
                    onChange={(json) => setSubmitData(d => ({ ...d, description: json }))}
                    maxChars={1500}
                  />
                </div>
              )}

              {/* Step 2: Build process */}
              {submitStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{
                    fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
                    fontWeight: 400, lineHeight: 1.55, marginBottom: 20,
                  }}>
                    Walk us through how you actually built this. Think of it as the behind-the-scenes for fellow builders.
                  </div>

                  <div style={{ marginBottom: 20, paddingLeft: 2 }}>
                    {[
                      { q: "Tools & tech choices", hint: "e.g. \"Went with Next.js + Supabase because I needed auth fast\"" },
                      { q: "Biggest challenge", hint: "e.g. \"Spent 2 days debugging OAuth — turned out it was a cookie domain issue\"" },
                      { q: "What you'd do differently", hint: "e.g. \"Would skip building a custom CMS and just use Notion API\"" },
                    ].map((prompt, pi) => (
                      <div key={pi} style={{
                        display: "flex", alignItems: "baseline", gap: 8,
                        marginBottom: pi < 2 ? 8 : 0,
                      }}>
                        <span style={{
                          fontSize: T.label, fontWeight: 650, color: C.textMute,
                          fontFamily: "var(--mono)", minWidth: 16,
                        }}>
                          {pi + 1}.
                        </span>
                        <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                          <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <RichTextEditor
                    value={submitData.buildProcess}
                    onChange={(json) => setSubmitData(d => ({ ...d, buildProcess: json }))}
                    maxChars={1500}
                  />
                </div>
              )}

              {/* Step 3: Tech stack + collaborators */}
              {submitStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 10 }}>
                      Tech stack
                    </div>

                    {/* Selected stack */}
                    {submitData.stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {submitData.stack.map((s, si) => {
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
                                  cursor: "pointer", fontSize: T.bodySm, color: C.textMute,
                                  lineHeight: 1, marginLeft: 2,
                                  transition: "color 0.1s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                                onMouseLeave={e => { e.currentTarget.style.color = C.textMute; }}
                              >{"×"}</span>
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
                          <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)", marginBottom: 7 }}>
                            Popular — tap to add
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {available.map(s => {
                              const meta = STACK_META[s] || { icon: s[0]?.toUpperCase() || "?", bg: C.accent, color: C.accentFg };
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
                            fontSize: T.label, fontWeight: 600, color: C.accentFg,
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

                  <div style={{ height: 1, background: C.borderLight }} />

                  <div ref={collabDropdownRef}>
                    <div style={{ fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 500, marginBottom: 8 }}>
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
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                          Searching...
                        </span>
                      )}
                      {!searchingCollabs && submitData.teamInput.trim().length >= 2 && collabResults.length === 0 && (
                        <div style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", marginTop: 6 }}>
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
                                  fontSize: T.badge, fontWeight: 650, fontFamily: "var(--sans)",
                                  border: `1px solid ${C.borderLight}`, flexShrink: 0,
                                }}>
                                  {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: T.bodySm, fontWeight: 550, color: C.text, fontFamily: "var(--sans)" }}>{u.name}</div>
                                  {(u.role || u.company) && (
                                    <div style={{ fontSize: T.caption, color: C.textMute, fontFamily: "var(--sans)" }}>
                                      {u.role}{u.role && u.company ? " · " : ""}{u.company}
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
                                fontSize: T.badge, fontWeight: 650, letterSpacing: "0.03em",
                                padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                                fontFamily: "var(--sans)", userSelect: "none",
                                background: c.role === 'creator' ? C.creatorBg : C.borderLight,
                                color: c.role === 'creator' ? C.creator : C.textMute,
                                transition: "all 0.15s",
                              }}
                            >
                              {c.role === 'creator' ? 'Creator' : 'Collaborator'}
                            </span>
                            <span
                              onClick={ev => { ev.stopPropagation(); setSubmitData(d => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) })); }}
                              style={{
                                cursor: "pointer", fontSize: T.body, color: C.textMute,
                                lineHeight: 1, marginTop: -1,
                              }}
                            >{"×"}</span>
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

              {/* Error message */}
              {submitError && (
                <div style={{
                  marginTop: 16, padding: "10px 14px", borderRadius: 10,
                  background: C.errorSoft, border: `1px solid ${C.errorBorder}`,
                  fontSize: T.bodySm, color: C.errorText, fontFamily: "var(--sans)",
                  fontWeight: 450, lineHeight: 1.45,
                }}>
                  {submitError}
                </div>
              )}

              {/* Navigation */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginTop: submitError ? 16 : 28,
              }}>
                {submitStep > 0 ? (
                  <button onClick={() => { setSubmitError(""); setSubmitStep(s => s - 1); }} disabled={submitting} style={{
                    padding: "9px 20px", borderRadius: 10,
                    border: `1px solid ${C.border}`, background: "transparent",
                    fontSize: T.bodySm, fontWeight: 500, color: C.textSec,
                    cursor: submitting ? "default" : "pointer", fontFamily: "var(--sans)",
                    transition: "all 0.12s", opacity: submitting ? 0.5 : 1,
                    marginTop: 2,
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >Back</button>
                ) : <div />}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <button
                    onClick={() => {
                      setSubmitError("");
                      if (submitStep === 0) {
                        if (!submitData.name.trim()) { setSubmitError("Project name is required."); return; }
                        if (!submitData.tagline.trim()) { setSubmitError("Tagline is required."); return; }
                        if (submitData.url?.trim() && !/^https?:\/\/.+/.test(submitData.url.trim())) { setSubmitError("Please enter a valid URL starting with http:// or https://"); return; }
                        setSubmitStep(1);
                      } else if (submitStep === 1) {
                        if (descriptionCharCount(submitData.description) === 0) { setSubmitError("Description is required. Tell us what you built."); return; }
                        if (descriptionCharCount(submitData.description) > 1500) { setSubmitError("Description must be 1500 characters or less."); return; }
                        setSubmitStep(2);
                      } else if (submitStep === 2) {
                        setSubmitStep(3);
                      } else {
                        if (submitData.stack.length === 0) { setSubmitError("Add at least one tech stack item."); return; }
                        handleSubmitProject();
                      }
                    }}
                    disabled={submitting}
                    style={{
                      padding: "9px 24px", borderRadius: 10,
                      border: "none",
                      background: submitting ? C.borderLight : C.accent,
                      fontSize: T.bodySm, fontWeight: 600,
                      color: submitting ? C.textMute : C.accentFg,
                      cursor: submitting ? "default" : "pointer",
                      fontFamily: "var(--sans)",
                      transition: "all 0.15s",
                      opacity: submitting ? 0.7 : 1,
                      minWidth: 160,
                    }}
                  >
                    {submitting ? "Submitting…" : submitStep === 3 ? "Submit" : "Continue"}
                  </button>

                  {submitStep === 3 && !submitting && (
                    <button
                      onClick={() => {
                        setSubmitError("");
                        if (submitData.stack.length === 0) { setSubmitError("Add at least one tech stack item."); return; }
                        handleSubmitProject(true);
                      }}
                      style={{
                        background: "none", border: "none", padding: 0,
                        fontSize: T.bodySm, fontWeight: 450, color: C.textMute,
                        cursor: "pointer", fontFamily: "var(--sans)",
                        transition: "color 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.textDecoration = "underline"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.textMute; e.currentTarget.style.textDecoration = "none"; }}
                    >
                      or save as draft
                    </button>
                  )}
                </div>
              </div>
            </div>
            </>)}
          </div>
        </div>, document.body
      )}

      {/* Sign-in handled via redirect to GrowthX login */}
    </div>
  );
}
