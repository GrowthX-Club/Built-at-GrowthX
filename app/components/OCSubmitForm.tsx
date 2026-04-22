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
  type BuilderProfile,
  type TrackKey,
  type TrackData,
  type FormError,
  type MaasTrackData,
  normalizeUser,
  getStackLogoUrl,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import MediaUpload from "@/components/MediaUpload";
import type { MediaFile } from "@/components/MediaUpload";
import RichTextEditor from "@/components/RichTextEditor";
import { descriptionCharCount } from "@/lib/editor-utils";
import OCTrackPickStep from "./OCTrackPickStep";
import OCTrackDataStep from "./OCTrackDataStep";

/**
 * /oc/submit — 5-step wizard for OpenCode Buildathon:
 *   Step 0  Basics       name + team + tagline
 *   Step 1  The story    description (RichTextEditor)
 *   Step 2  Ship it      GitHub/demo/video URLs + screenshots + stack
 *   Step 3  Pick track   primary + optional secondary track
 *   Step 4  Track data   judge-scoring fields for chosen tracks
 * Draft state is persisted to localStorage so closing the page doesn't
 * nuke the user's work.
 */

const OPEN_CODE_STACK = "Open Code";
const DRAFT_KEY = "oc:submit:draft:v1";
const STEP_KEY = "oc:submit:step:v1";
const isDev = typeof import.meta !== "undefined" && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true;

/**
 * Subscribe to a window/document event without useEffect.
 * Uses useSyncExternalStore: subscribe attaches the listener on mount and
 * the returned cleanup detaches it on unmount. Handler stays current via a
 * ref so we don't re-subscribe on every render.
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
      // Subscribe only runs on the client — safe to touch window/document here.
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

const STACK_SUGGESTIONS = [
  "Next.js", "React", "Python", "Node.js", "TypeScript",
  "Claude API", "OpenAI", "Supabase", "Firebase", "MongoDB",
  "PostgreSQL", "Tailwind CSS", "Flutter", "FastAPI", "Vercel",
  "AWS", "Docker", "Stripe", "Prisma", "Go",
];

const YOUTUBE_UNLISTED_DOC = "https://www.youtube.com/watch?v=XnGeqjbIusw";

const TRACK_LABEL_FOR_ERRORS: Record<TrackKey, string> = {
  virality: "Virality",
  revenue: "Revenue",
  maas: "MaaS",
};

function isGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[^\s]+/i.test(url.trim());
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
interface SubmitData {
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

const INITIAL_DATA: SubmitData = {
  buildMode: "solo",
  name: "",
  teamName: "",
  sameAsProject: true,
  tagline: "",
  description: "",
  stack: [OPEN_CODE_STACK],
  stackInput: "",
  team: [],
  teamInput: "",
  githubUrl: "",
  githubPublicConfirmed: false,
  demoUrl: "",
  videoUrl: "",
  mediaFiles: [],
  primaryTrack: "virality",
  secondaryTracks: [],
  trackData: {},
};

const VALID_TRACKS: TrackKey[] = ["virality", "revenue", "maas"];

function loadDraft(): SubmitData {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return INITIAL_DATA;
    const parsed = JSON.parse(raw) as Partial<SubmitData>;
    const primary = VALID_TRACKS.includes(parsed.primaryTrack as TrackKey)
      ? (parsed.primaryTrack as TrackKey)
      : "virality";
    const rawSecondaries = Array.isArray((parsed as { secondaryTracks?: unknown }).secondaryTracks)
      ? ((parsed as { secondaryTracks: unknown[] }).secondaryTracks)
      : (parsed as { secondaryTrack?: unknown }).secondaryTrack
        ? [(parsed as { secondaryTrack: unknown }).secondaryTrack]
        : [];
    const secondaries = (rawSecondaries as unknown[])
      .filter((t): t is TrackKey => typeof t === "string" && VALID_TRACKS.includes(t as TrackKey) && t !== primary)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 2);
    return {
      ...INITIAL_DATA,
      ...parsed,
      // Never restore transient uploading state
      mediaFiles: (parsed.mediaFiles || []).filter(
        (m) => m && m.url && !m.uploading,
      ),
      stack: Array.isArray(parsed.stack) && parsed.stack.length > 0
        ? (parsed.stack.includes(OPEN_CODE_STACK)
            ? parsed.stack
            : [OPEN_CODE_STACK, ...parsed.stack])
        : [OPEN_CODE_STACK],
      primaryTrack: primary,
      secondaryTracks: secondaries,
      trackData: (parsed.trackData && typeof parsed.trackData === "object") ? parsed.trackData : {},
    };
  } catch {
    return INITIAL_DATA;
  }
}

function saveDraft(data: SubmitData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota full or disabled — ignore */
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(STEP_KEY);
  } catch {
    /* ignore */
  }
}

function loadStep(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STEP_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 4) return 0;
    return Math.floor(n);
  } catch {
    return 0;
  }
}

function saveStep(step: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STEP_KEY, String(step));
  } catch {
    /* ignore */
  }
}

function initialDraftRestored(d: SubmitData): boolean {
  return (
    d.name.trim() !== "" ||
    d.tagline.trim() !== "" ||
    d.description.trim() !== "" ||
    d.team.length > 0 ||
    Object.keys(d.trackData ?? {}).length > 0
  );
}

// ---- Pure validators ----

function validateStep0(d: SubmitData): FormError[] {
  const out: FormError[] = [];
  if (!d.name.trim()) out.push({ id: "projectName", message: "Project name is required.", step: 0 });
  const tagline = d.tagline.trim();
  if (!tagline) out.push({ id: "tagline", message: "Tagline is required.", step: 0 });
  else if (d.tagline.length > 100) out.push({ id: "tagline", message: "Tagline must be 100 characters or less.", step: 0 });
  if (d.buildMode === "team" && !d.sameAsProject) {
    if (!d.teamName.trim()) out.push({ id: "teamName", message: "Team name is required.", step: 0 });
  }
  return out;
}

function validateStep1(d: SubmitData): FormError[] {
  const out: FormError[] = [];
  const count = descriptionCharCount(d.description);
  if (count === 0) {
    out.push({ id: "description", message: "Description is required. Tell us what you built.", step: 1 });
  } else if (count > 1500) {
    out.push({ id: "description", message: "Description must be 1500 characters or less.", step: 1 });
  }
  return out;
}

function validateStep2(d: SubmitData, opts: { asDraft: boolean }): FormError[] {
  const out: FormError[] = [];
  const gh = d.githubUrl.trim();
  if (!gh) {
    if (!opts.asDraft) out.push({ id: "githubUrl", message: "GitHub URL is required. Save as draft if you don't have one yet.", step: 2 });
  } else if (!isGithubUrl(gh)) {
    out.push({ id: "githubUrl", message: "GitHub URL must look like https://github.com/your-org/your-repo", step: 2 });
  } else if (!opts.asDraft && !d.githubPublicConfirmed) {
    out.push({ id: "githubPublic", message: "Confirm that the GitHub repository is public before submitting.", step: 2 });
  }
  const demo = d.demoUrl.trim();
  if (demo && !/^https?:\/\/.+/.test(demo)) {
    out.push({ id: "demoUrl", message: "URLs must start with http:// or https://", step: 2 });
  }
  const video = d.videoUrl.trim();
  if (video && !/^https?:\/\/.+/.test(video)) {
    out.push({ id: "videoUrl", message: "URLs must start with http:// or https://", step: 2 });
  }
  if (d.stack.length === 0) {
    out.push({ id: "stack", message: "Add at least one tech stack item.", step: 2 });
  }
  return out;
}

function validateTrackData(track: TrackKey, td: TrackData): FormError[] {
  const out: FormError[] = [];
  if (track === "virality") {
    const v = td.virality ?? {};
    if (!v.impressionsTotal?.trim()) out.push({ id: "virality.impressionsTotal", message: "Add an impressions total for Virality.", step: 4 });
    if (!v.reactionsTotal?.trim()) out.push({ id: "virality.reactionsTotal", message: "Add a reactions / comments total for Virality.", step: 4 });
    if (!v.amplificationNotes?.trim()) out.push({ id: "virality.amplificationNotes", message: "Add amplification notes for Virality.", step: 4 });
    if (!v.amplificationProofs || v.amplificationProofs.length === 0) out.push({ id: "virality.amplificationProofs", message: "Add at least one amplification proof.", step: 4 });
    if (!v.analyticsProvider) out.push({ id: "virality.analyticsProvider", message: "Pick an analytics provider for Virality.", step: 4 });
    if (v.analyticsProvider === "other" && !v.analyticsProviderOther?.trim()) out.push({ id: "virality.analyticsProviderOther", message: "Name the analytics tool you're using.", step: 4 });
    if (!v.uniqueVisitors?.trim()) out.push({ id: "virality.uniqueVisitors", message: "Add unique visitors for Virality.", step: 4 });
    if (!v.signupsCount?.trim()) out.push({ id: "virality.signupsCount", message: "Add signups count for Virality.", step: 4 });
    if (!v.signupEventDefinition?.trim()) out.push({ id: "virality.signupEventDefinition", message: "Define what a signup means for Virality.", step: 4 });
    if (!v.signupsProof?.url) out.push({ id: "virality.signupsProof", message: "Upload a signup proof.", step: 4 });
    return out;
  }
  if (track === "revenue") {
    const r = td.revenue ?? {};
    if (!r.painPoint?.trim()) out.push({ id: "revenue.painPoint", message: "Describe the pain point for Revenue.", step: 4 });
    if (!r.marketSize?.trim()) out.push({ id: "revenue.marketSize", message: "Add market size for Revenue.", step: 4 });
    if (!r.rightToWin?.trim()) out.push({ id: "revenue.rightToWin", message: "Add your right to win for Revenue.", step: 4 });
    if (!r.whyNow?.trim()) out.push({ id: "revenue.whyNow", message: "Add \u201Cwhy now\u201D for Revenue.", step: 4 });
    if (!r.tractionStage) out.push({ id: "revenue.tractionStage", message: "Pick a traction stage for Revenue.", step: 4 });
    if (!r.tractionDetails?.trim()) out.push({ id: "revenue.tractionDetails", message: "Add traction details for Revenue.", step: 4 });
    if (r.tractionStage && r.tractionStage !== "none" && (!r.tractionProofs || r.tractionProofs.length === 0)) {
      out.push({ id: "revenue.tractionProofs", message: "Add at least one traction proof.", step: 4 });
    }
    if (!r.moat?.trim()) out.push({ id: "revenue.moat", message: "Describe your moat for Revenue.", step: 4 });
    return out;
  }
  // maas — question-driven (no self-evaluation tier pickers; judges score from artifacts)
  const m: MaasTrackData = td.maas ?? {};
  const ro = m.realOutput ?? {};
  const org = m.orgStructure ?? {};
  const obs = m.observability ?? {};
  const ev = m.evals ?? {};
  const mem = m.memory ?? {};
  const cl = m.costLatency ?? {};
  const mu = m.managementUi ?? {};

  if (!ro.taskDomain) out.push({ id: "maas.realOutput.taskDomain", message: "Pick a task domain.", step: 4 });
  if (ro.taskDomain === "other" && !ro.taskDomainOther?.trim()) out.push({ id: "maas.realOutput.taskDomainOther", message: "Name the task domain.", step: 4 });
  if (!ro.surfaceUrl?.trim()) out.push({ id: "maas.realOutput.surfaceUrl", message: "Add the URL of the real surface the agent operates on.", step: 4 });
  if (!ro.proofs || ro.proofs.length === 0) out.push({ id: "maas.realOutput.proofs", message: "Upload at least one real-output proof.", step: 4 });

  if (!org.notes?.trim()) out.push({ id: "maas.orgStructure.notes", message: "Describe how your agents are organised.", step: 4 });

  if (!obs.tool?.trim()) out.push({ id: "maas.observability.tool", message: "Name your observability tool (or 'custom').", step: 4 });
  if (!obs.proofs || obs.proofs.length === 0) out.push({ id: "maas.observability.proofs", message: "Upload an observability proof.", step: 4 });

  if (!ev.notes?.trim()) out.push({ id: "maas.evals.notes", message: "Describe your eval set.", step: 4 });
  if (!ev.proofs || ev.proofs.length === 0) out.push({ id: "maas.evals.proofs", message: "Upload an evals proof.", step: 4 });

  if (!mem.architecture?.trim()) out.push({ id: "maas.memory.architecture", message: "Describe how the agent remembers across steps or tasks.", step: 4 });

  if (!cl.timePerTask?.trim()) out.push({ id: "maas.costLatency.timePerTask", message: "Add your time per task.", step: 4 });
  if (!cl.costPerTask?.trim()) out.push({ id: "maas.costLatency.costPerTask", message: "Add your cost per task.", step: 4 });

  if (!mu.url?.trim()) out.push({ id: "maas.managementUi.url", message: "Add the URL of your management UI.", step: 4 });

  return out;
}

function validateSecondaryClaim(track: TrackKey, td: TrackData): FormError[] {
  const out: FormError[] = [];
  const s = td.secondaryClaims?.[track] ?? {};
  const label = TRACK_LABEL_FOR_ERRORS[track];
  if (!s.tier?.trim()) {
    out.push({ id: `secondary.${track}.tier`, message: `Add a short rubric tier / milestone for your ${label} secondary track.`, step: 4 });
  }
  if (!s.proofs || s.proofs.length === 0) {
    out.push({ id: `secondary.${track}.proofs`, message: `Add at least one proof for your ${label} secondary track.`, step: 4 });
  }
  return out;
}

function validateStep4(d: SubmitData): FormError[] {
  const out: FormError[] = [];
  out.push(...validateTrackData(d.primaryTrack, d.trackData));
  for (const t of d.secondaryTracks) {
    out.push(...validateSecondaryClaim(t, d.trackData));
  }
  return out;
}

function validateAll(d: SubmitData, opts: { asDraft: boolean }): FormError[] {
  const out: FormError[] = [];
  out.push(...validateStep0(d));
  if (!opts.asDraft) out.push(...validateStep1(d));
  else {
    // Even on draft, cap description length
    const count = descriptionCharCount(d.description);
    if (count > 1500) {
      out.push({ id: "description", message: "Description must be 1500 characters or less.", step: 1 });
    }
  }
  out.push(...validateStep2(d, opts));
  if (!opts.asDraft) out.push(...validateStep4(d));
  return out;
}

function scrollToFirstError(errs: FormError[]) {
  if (!errs.length) return;
  const first = [...errs].sort((a, b) => a.step - b.step)[0];
  queueMicrotask(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(first.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el as HTMLElement & { focus?: () => void };
      if (typeof focusable.focus === "function") {
        try { focusable.focus(); } catch { /* ignore */ }
      }
    }
  });
}

function focusAndScrollTo(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = el as HTMLElement & { focus?: () => void };
  if (typeof focusable.focus === "function") {
    try { focusable.focus(); } catch { /* ignore */ }
  }
}

// ---- Inline error helper ----
function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{
      fontSize: T.caption, color: C.error, marginTop: 4,
      fontFamily: "var(--sans)", lineHeight: 1.4,
    }}>
      {message}
    </div>
  );
}

// ---- Summary banner ----
function SummaryBanner({ errs, onJump }: { errs: FormError[]; onJump: (id: string) => void }) {
  if (errs.length === 0) return null;
  const n = errs.length;
  return (
    <div
      role="alert"
      style={{
        background: C.errorSoft,
        border: `1px solid ${C.errorBorder}`,
        color: C.errorText,
        padding: "12px 16px",
        borderRadius: 10,
        marginBottom: 20,
        fontFamily: "var(--sans)",
      }}
    >
      <div style={{
        fontSize: T.bodySm, fontWeight: 650, marginBottom: 10,
        color: C.errorText,
      }}>
        {n} thing{n > 1 ? "s" : ""} to fix on this step
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {errs.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onJump(e.id)}
            style={{
              background: C.surface,
              border: `1px dashed ${C.errorBorder}`,
              color: C.errorText,
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: T.caption,
              fontWeight: 550,
              fontFamily: "var(--sans)",
              cursor: "pointer",
              lineHeight: 1.4,
              textAlign: "left",
            }}
          >
            {e.message}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OCSubmitForm() {
  const navigate = useNavigate();
  const { openLoginDialog } = useLoginDialog();
  const { isMobile } = useResponsive();

  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [submitted, setSubmitted] = useState<{ name: string; asDraft: boolean } | null>(null);

  // Lazy init reads localStorage once on mount — no useEffect needed.
  const [submitStepRaw, setSubmitStepRaw] = useState<number>(loadStep);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitDataRaw, setSubmitDataRaw] = useState<SubmitData>(loadDraft);
  const [draftRestored, setDraftRestored] = useState<boolean>(() =>
    initialDraftRestored(loadDraft()),
  );

  // Setter wrappers persist to localStorage on every mutation — replaces the
  // `useEffect(() => save(state), [state])` anti-pattern.
  const setSubmitData: Dispatch<SetStateAction<SubmitData>> = (update) => {
    setSubmitDataRaw((prev) => {
      const next =
        typeof update === "function"
          ? (update as (p: SubmitData) => SubmitData)(prev)
          : update;
      saveDraft(next);
      return next;
    });
  };
  const setSubmitStep: Dispatch<SetStateAction<number>> = (update) => {
    setSubmitStepRaw((prev) => {
      const next =
        typeof update === "function"
          ? (update as (p: number) => number)(prev)
          : update;
      saveStep(next);
      if (typeof window !== "undefined" && next !== prev) {
        // Let the new step mount before scrolling so the content is at position 0
        queueMicrotask(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
          if (typeof document !== "undefined") document.documentElement.scrollTop = 0;
        });
      }
      return next;
    });
  };
  const submitStep = submitStepRaw;
  const submitData = submitDataRaw;

  // Error helpers
  const getError = (id: string): string | undefined =>
    errors.find((e) => e.id === id)?.message;
  const clearError = (id: string) => {
    setErrors((es) => es.filter((e) => e.id !== id));
  };
  const stepErrors = (step: number): FormError[] =>
    errors.filter((e) => e.step === step);

  const currentStepErrors = stepErrors(submitStep);

  const [collabResults, setCollabResults] = useState<{ _id: string; name: string; avatar: string; avatarUrl?: string; company: string; role: string }[]>([]);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [searchingCollabs, setSearchingCollabs] = useState(false);
  const collabSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  // Network error (auth / backend) — separate from validation errors.
  const [networkError, setNetworkError] = useState("");

  // --- Auth ---
  const reloadUser = () => {
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)))
      .catch(() => setUser(null))
      .finally(() => setUserLoaded(true));
  };

  // Fire-and-forget one-shot on mount. Ref guard avoids a second fetch under
  // React strict mode double-invocation. Gated on window to skip SSR pass.
  const didInitAuth = useRef(false);
  if (typeof window !== "undefined" && !didInitAuth.current) {
    didInitAuth.current = true;
    reloadUser();
  }

  // Re-fetch user when login dialog succeeds — event subscription via
  // useSyncExternalStore (no useEffect).
  useEventSubscription("window", "bx:login-success", () => {
    reloadUser();
  });

  // Click-outside for team search dropdown — same pattern.
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
          })).filter((u: { _id: string }) => !user?._id || u._id !== user._id);
          setCollabResults(users);
          setShowCollabDropdown(true);
        })
        .finally(() => setSearchingCollabs(false));
    }, 250);
  };

  const pickTeamMember = (u: { _id: string; name: string; avatar: string; avatarUrl?: string; company: string }) => {
    if (submitData.team.some(c => c._id === u._id)) return;
    const colors = ["#0C2451", "#5B21B6", "#92400E", "#166534", "#1E40AF", "#7C3AED", "#B45309", "#047857"];
    let hash = 0;
    for (let i = 0; i < (u.company || "").length; i++) hash = (u.company || "").charCodeAt(i) + ((hash << 5) - hash);
    const cc = u.company ? colors[Math.abs(hash) % colors.length] : undefined;
    setSubmitData(d => ({
      ...d,
      team: [...d.team, { _id: u._id, name: u.name, avatar: u.avatar, avatarUrl: u.avatarUrl, company: u.company, companyColor: cc, role: 'collaborator' }],
      teamInput: "",
    }));
    setCollabResults([]);
    setShowCollabDropdown(false);
  };

  const handleSignIn = () => {
    openLoginDialog(() => { reloadUser(); });
  };

  // --- Submit ---
  const handleSubmitProject = async (asDraft = false) => {
    if (!user) { handleSignIn(); return; }
    setNetworkError("");

    const all = validateAll(submitData, { asDraft });
    if (all.length > 0) {
      const earliest = [...all].sort((a, b) => a.step - b.step)[0].step;
      setErrors(all);
      setSubmitStep(earliest);
      scrollToFirstError(all);
      return;
    }
    // All valid — clear any leftover errors
    setErrors([]);

    setSubmitting(true);
    try {
      const trimmedName = submitData.name.trim();
      const primaryUrl = submitData.demoUrl.trim() || submitData.videoUrl.trim() || submitData.githubUrl.trim() || undefined;
      const finalTeamName = submitData.sameAsProject ? trimmedName : (submitData.teamName.trim() || undefined);

      const res = await bxApi("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          teamName: finalTeamName,
          tagline: submitData.tagline.trim(),
          description: submitData.description,
          category: "AI",
          stack: submitData.stack,
          url: primaryUrl,
          githubUrl: submitData.githubUrl.trim() || undefined,
          demoUrl: submitData.demoUrl.trim() || undefined,
          videoUrl: submitData.videoUrl.trim() || undefined,
          media: submitData.mediaFiles.filter(m => !m.uploading).map(m => m.url),
          creators: submitData.team.filter(c => c.role === 'creator').map(c => c._id),
          collabs: submitData.team.filter(c => c.role === 'collaborator').map(c => c._id),
          isDraft: asDraft,
          buildathon: "opencode",
          primaryTrack: submitData.primaryTrack,
          secondaryTracks: submitData.secondaryTracks,
          trackData: submitData.trackData,
        }),
      });
      if (res.ok) {
        clearDraft();
        setSubmitData(INITIAL_DATA);
        setDraftRestored(false);
        setSubmitStep(0);
        setSubmitted({ name: trimmedName, asDraft });
        return;
      }
      const data = await res.json().catch(() => null);
      const msg = data?.message || data?.error;
      if (res.status === 401) setNetworkError("Your session has expired. Please log in again.");
      else if (res.status === 400 && msg) setNetworkError(msg);
      else setNetworkError(msg || "Something went wrong. Please try again.");
    } catch {
      setNetworkError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const githubLooksValid = submitData.githubUrl.trim() && isGithubUrl(submitData.githubUrl);

  const stepLabel = ["The basics", "The story", "Ship it", "Pick your track", "Track data"][submitStep];
  const totalSteps = 5;

  const handleCloseWithDraftConfirm = () => {
    // Draft auto-saves so closing is safe. Just navigate away.
    navigate("/oc");
  };

  const handleClearDraft = () => {
    clearDraft();
    setSubmitData(INITIAL_DATA);
    setDraftRestored(false);
    setSubmitStep(0);
    setErrors([]);
    setNetworkError("");
  };

  // Step-specific "Continue" — validate current step only.
  const handleContinue = () => {
    setNetworkError("");
    if (submitStep === 0) {
      const errs = validateStep0(submitData);
      if (errs.length) { setErrors((prev) => replaceStepErrors(prev, 0, errs)); scrollToFirstError(errs); return; }
      setErrors((prev) => clearStepErrors(prev, 0));
      setSubmitStep(1);
      return;
    }
    if (submitStep === 1) {
      const errs = validateStep1(submitData);
      if (errs.length) { setErrors((prev) => replaceStepErrors(prev, 1, errs)); scrollToFirstError(errs); return; }
      setErrors((prev) => clearStepErrors(prev, 1));
      setSubmitStep(2);
      return;
    }
    if (submitStep === 2) {
      const errs = validateStep2(submitData, { asDraft: false });
      if (errs.length) { setErrors((prev) => replaceStepErrors(prev, 2, errs)); scrollToFirstError(errs); return; }
      setErrors((prev) => clearStepErrors(prev, 2));
      setSubmitStep(3);
      return;
    }
    if (submitStep === 3) {
      // Step 3 has no validation errors — primary always has a default.
      setSubmitStep(4);
      return;
    }
    // Step 4 — final submit
    void handleSubmitProject(false);
  };

  if (submitted) {
    return (
      <div
        className={isMobile ? "responsive-modal-full" : "responsive-modal"}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: isMobile ? "100%" : 540,
          margin: isMobile ? 0 : "0 auto",
          background: C.surface,
          borderRadius: isMobile ? 0 : 20,
          border: isMobile ? "none" : `1px solid ${C.border}`,
          boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56, height: 56, borderRadius: 56, margin: "0 auto 20px",
            background: C.accentSoft, color: C.accent,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: T.heading, fontWeight: 500, color: C.text, letterSpacing: "-0.01em", marginBottom: 8 }}>
          {submitted.asDraft ? "Draft saved." : "You\u2019re in."}
        </div>
        <div style={{ fontFamily: "var(--sans)", fontSize: T.body, color: C.textSec, lineHeight: 1.55, marginBottom: 24 }}>
          <strong style={{ color: C.text, fontWeight: 600 }}>{submitted.name}</strong>
          {submitted.asDraft
            ? " is saved as a draft. Publish it from My Projects when you\u2019re ready."
            : " is live in the gallery. Thanks for shipping."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 280, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => navigate("/my-projects")}
            style={{
              padding: "11px 20px", borderRadius: 10, border: "none",
              background: C.accent, color: C.accentFg,
              fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
              cursor: "pointer",
            }}
          >
            See your project
          </button>
          <button
            type="button"
            onClick={() => navigate("/oc")}
            style={{
              padding: "11px 20px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface,
              color: C.text,
              fontSize: T.bodySm, fontWeight: 500, fontFamily: "var(--sans)",
              cursor: "pointer",
            }}
          >
            Browse the gallery
          </button>
        </div>
      </div>
    );
  }

  const taglineId = "tagline";
  const errProjectName = getError("projectName");
  const errTagline = getError("tagline");
  const errTeamName = getError("teamName");
  const errDescription = getError("description");
  const errGithubUrl = getError("githubUrl");
  const errGithubPublic = getError("githubPublic");
  const errDemoUrl = getError("demoUrl");
  const errVideoUrl = getError("videoUrl");
  const errStack = getError("stack");

  return (
    <div
      className={isMobile ? "responsive-modal-full" : "responsive-modal"}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: isMobile ? "100%" : 540,
        margin: isMobile ? 0 : "0 auto",
        background: C.surface,
        borderRadius: isMobile ? 0 : 20,
        border: isMobile ? "none" : `1px solid ${C.border}`,
        boxShadow: isMobile ? "none" : "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <style>{`
        .submit-input { width: 100%; border: 1px solid ${C.border}; border-radius: 10px; padding: 12px 16px; font-size: ${T.body}px; font-family: var(--sans); color: ${C.text}; background: ${C.surface}; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .submit-input:focus { border-color: ${C.accent}; }
        .submit-input::placeholder { color: ${C.textSec}; }
        .submit-input-lg { font-size: ${T.logo}px; font-weight: 500; font-family: var(--serif); }
        .submit-input:disabled { opacity: 0.55; cursor: not-allowed; }
        .submit-label { display: block; font-size: ${T.bodySm}px; font-weight: 600; color: ${C.text}; font-family: var(--sans); margin-bottom: 8px; }
        .submit-label .req { color: ${C.textMute}; font-weight: 400; }
        .submit-hint { font-size: ${T.caption}px; color: ${C.textMute}; font-family: var(--sans); margin-top: 6px; line-height: 1.5; }
      `}</style>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.borderLight }}>
        <div style={{
          height: 3, background: C.accent,
          width: `${((submitStep + 1) / totalSteps) * 100}%`,
          transition: "width 0.3s ease",
          borderRadius: 3,
        }} />
      </div>

      {/* Header */}
      <div style={{ padding: "20px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {submitStep > 0 && (
            <button
              type="button"
              onClick={() => { setNetworkError(""); setSubmitStep(s => Math.max(0, s - 1)); }}
              title="Back"
              aria-label="Back"
              style={{
                width: 32, height: 32, borderRadius: 32, flexShrink: 0,
                border: `1px solid ${C.borderLight}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.textMute,
                transition: "all 0.12s",
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
              {stepLabel}
            </div>
            <div style={{ fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 400 }}>
              Step {submitStep + 1} of {totalSteps} &middot; draft saved automatically
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCloseWithDraftConfirm}
          title="Close — your draft is saved on this device"
          style={{
            width: 32, height: 32, borderRadius: 32, flexShrink: 0,
            border: `1px solid ${C.borderLight}`, background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: T.bodyLg, color: C.textMute,
            transition: "all 0.12s",
          }}
        >{"\u00D7"}</button>
      </div>

      {/* Draft restored banner */}
      {draftRestored && (
        <div style={{
          margin: "14px 28px 0", padding: "10px 14px", borderRadius: 10,
          background: C.surfaceWarm, border: `1px dashed ${C.borderLight}`,
          fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span>We restored your previous draft on this device.</span>
          <button
            type="button"
            onClick={handleClearDraft}
            style={{
              background: "none", border: "none", padding: 0,
              fontSize: T.caption, fontWeight: 550, color: C.textMute,
              cursor: "pointer", fontFamily: "var(--sans)",
              textDecoration: "underline",
            }}
          >
            Start over
          </button>
        </div>
      )}

      {/* Sign-in prompt — ONLY on step 0, once */}
      {submitStep === 0 && userLoaded && !user && (
        <div style={{
          margin: "14px 28px 0", padding: "12px 14px", borderRadius: 10,
          background: C.surfaceWarm, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)", lineHeight: 1.45 }}>
            <strong style={{ color: C.text, fontWeight: 600 }}>Sign in to submit.</strong>{" "}
            Your draft is saved on this device, so it&rsquo;s safe to fill first.
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            style={{
              padding: "7px 14px", borderRadius: 10,
              border: `1px solid ${C.accent}`, background: C.accent, color: C.accentFg,
              fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Sign in
          </button>
        </div>
      )}

      <div style={{ padding: "24px 28px 28px" }}>
        {/* Summary banner for current step errors */}
        <SummaryBanner errs={currentStepErrors} onJump={focusAndScrollTo} />

        {/* Step 0: The basics — build mode + name + tagline + (if team) team block */}
        {submitStep === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label className="submit-label">How are you building this?</label>
            </div>

            {/* Build mode: Solo / With a team */}
            <div role="radiogroup" aria-label="Build mode" style={{ display: "flex", gap: 12 }}>
              {([
                { key: "solo", title: "Solo", sub: "Just me shipping this." },
                { key: "team", title: "With a team", sub: "I built this with others." },
              ] as { key: BuildMode; title: string; sub: string }[]).map(opt => {
                const selected = submitData.buildMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSubmitData(d => ({
                      ...d,
                      buildMode: opt.key,
                      team: opt.key === "solo" ? [] : d.team,
                      teamInput: opt.key === "solo" ? "" : d.teamInput,
                      sameAsProject: opt.key === "solo" ? true : d.sameAsProject,
                      teamName: opt.key === "solo" ? "" : d.teamName,
                    }))}
                    style={{
                      flex: 1, padding: "18px 16px", borderRadius: 14,
                      border: `1.5px solid ${selected ? C.accent : C.border}`,
                      background: selected ? C.accentSoft : C.surface,
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "flex-start", gap: 12,
                      transition: "all 0.15s",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 18, height: 18, borderRadius: 18, flexShrink: 0,
                        border: `1.5px solid ${selected ? C.accent : C.border}`,
                        background: C.surface,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        marginTop: 2,
                      }}
                    >
                      {selected && (
                        <span style={{ width: 9, height: 9, borderRadius: 9, background: C.accent }} />
                      )}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: T.body, fontWeight: 600, color: C.text }}>
                        {opt.title}
                      </span>
                      <span style={{ fontSize: T.caption, color: C.textMute, lineHeight: 1.4 }}>
                        {opt.sub}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="submit-label" htmlFor="projectName">
                Project name <span className="req">*</span>
              </label>
              <input
                id="projectName"
                className="submit-input"
                placeholder="e.g. Pagesync, Mailcraft, Budgetly"
                value={submitData.name}
                onChange={e => { clearError("projectName"); setSubmitData(d => ({ ...d, name: e.target.value })); }}
                autoFocus
                style={errProjectName ? { borderColor: C.error } : undefined}
              />
              <InlineError message={errProjectName} />
              <div className="submit-hint">The name people will see on the leaderboard.</div>
            </div>

            <div>
              <label className="submit-label" htmlFor={taglineId}>
                Tagline <span className="req">*</span>
              </label>
              <input
                id={taglineId}
                className="submit-input"
                placeholder="One line that explains what it does"
                value={submitData.tagline}
                onChange={e => { clearError("tagline"); setSubmitData(d => ({ ...d, tagline: e.target.value })); }}
                maxLength={100}
                style={{
                  borderColor: errTagline
                    ? C.error
                    : (submitData.tagline.length >= 100 ? C.error : undefined),
                }}
              />
              <InlineError message={errTagline} />
              <div style={{
                display: "flex", justifyContent: "flex-end",
                marginTop: 6, fontFamily: "var(--sans)", fontSize: T.caption,
              }}>
                <span style={{
                  color: submitData.tagline.length >= 90 ? (submitData.tagline.length >= 100 ? C.error : C.gold) : C.textMute,
                  fontWeight: submitData.tagline.length >= 100 ? 600 : 400,
                }}>
                  {submitData.tagline.length}/100
                </span>
              </div>
            </div>

            {/* Team block — only when buildMode === "team" */}
            {submitData.buildMode === "team" && (
              <>
                <div>
                  <label className="submit-label">Team name</label>
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)",
                    cursor: "pointer", userSelect: "none",
                    marginBottom: submitData.sameAsProject ? 0 : 10,
                  }}>
                    <input
                      type="checkbox"
                      checked={submitData.sameAsProject}
                      onChange={e => { clearError("teamName"); setSubmitData(d => ({ ...d, sameAsProject: e.target.checked, teamName: e.target.checked ? "" : d.teamName })); }}
                    />
                    Same as project name
                  </label>
                  {!submitData.sameAsProject && (
                    <input
                      id="teamName"
                      className="submit-input"
                      placeholder="Your team or studio name"
                      value={submitData.teamName}
                      onChange={e => { clearError("teamName"); setSubmitData(d => ({ ...d, teamName: e.target.value })); }}
                      style={errTeamName ? { borderColor: C.error } : undefined}
                    />
                  )}
                  {!submitData.sameAsProject && (
                    <>
                      <InlineError message={errTeamName} />
                      <div className="submit-hint">Shown publicly below the project name.</div>
                    </>
                  )}
                </div>

                <div ref={collabDropdownRef}>
                  <label className="submit-label">Who built it with you?</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="submit-input"
                      placeholder="Search GrowthX members by name…"
                      value={submitData.teamInput}
                      onChange={e => { const v = e.target.value; setSubmitData(d => ({ ...d, teamInput: v })); searchCollabs(v); }}
                      onFocus={() => { if (collabResults.length > 0) setShowCollabDropdown(true); }}
                    />
                    {searchingCollabs && (
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: T.caption, color: C.textMute }}>
                        Searching…
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
                        maxHeight: 240, overflowY: "auto",
                      }}>
                        {collabResults.map(u => {
                          const already = submitData.team.some(c => c._id === u._id);
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
                                  {u.avatar.length <= 3 ? u.avatar : u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
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
                  {submitData.team.length > 0 && (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
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
                              onClick={() => setSubmitData(d => ({
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
                              onClick={() => setSubmitData(d => ({ ...d, team: d.team.filter((_, idx) => idx !== ci) }))}
                              style={{ cursor: "pointer", fontSize: T.body, color: C.textMute, lineHeight: 1, marginTop: -1 }}
                            >{"\u00D7"}</span>
                          </span>
                        ))}
                      </div>
                      <div className="submit-hint">
                        Tap the role chip on any member to toggle Creator / Collaborator.
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 1: The story */}
        {submitStep === 1 && (
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
                  <span style={{ fontSize: T.label, fontWeight: 650, color: C.textMute, fontFamily: "var(--mono)", minWidth: 16 }}>
                    {pi + 1}.
                  </span>
                  <span style={{ fontSize: T.body, fontFamily: "var(--sans)", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 580, color: C.text }}>{prompt.q}</span>
                    <span style={{ color: C.textMute, fontWeight: 400 }}> — {prompt.hint}</span>
                  </span>
                </div>
              ))}
            </div>
            <div id="description">
              <RichTextEditor
                value={submitData.description}
                onChange={(json) => { clearError("description"); setSubmitData(d => ({ ...d, description: json })); }}
                maxChars={1500}
              />
            </div>
            <InlineError message={errDescription} />
          </div>
        )}

        {/* Step 2: Ship it — URLs + screenshots + stack */}
        {submitStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 400, lineHeight: 1.55 }}>
              Link us to the code, the demo, and a video. Add screenshots and confirm the stack.
            </div>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="submit-label" htmlFor="githubUrl">GitHub URL</label>
                <input
                  id="githubUrl"
                  className="submit-input"
                  placeholder="https://github.com/your-org/your-repo"
                  value={submitData.githubUrl}
                  onChange={e => { clearError("githubUrl"); clearError("githubPublic"); setSubmitData(d => ({ ...d, githubUrl: e.target.value })); }}
                  style={errGithubUrl ? { borderColor: C.error } : undefined}
                />
                <InlineError message={errGithubUrl} />
                {submitData.githubUrl.trim() && !isGithubUrl(submitData.githubUrl) && !errGithubUrl ? (
                  <div
                    className="submit-hint"
                    style={{ color: C.error }}
                  >
                    That doesn&rsquo;t look like a GitHub URL. Expected
                    {" "}<code style={{ fontFamily: "var(--mono)" }}>https://github.com/your-org/your-repo</code>.
                  </div>
                ) : !errGithubUrl ? (
                  <div className="submit-hint">
                    Public repo required. We&rsquo;ll confirm below once the URL looks like a GitHub link.
                  </div>
                ) : null}
                {githubLooksValid && (
                  <>
                    <label style={{
                      display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10,
                      padding: "10px 12px",
                      border: `1px solid ${errGithubPublic ? C.error : C.borderLight}`, borderRadius: 10,
                      background: C.surfaceWarm, fontSize: T.bodySm, color: C.text,
                      fontFamily: "var(--sans)", lineHeight: 1.45, cursor: "pointer",
                    }}>
                      <input
                        id="githubPublic"
                        type="checkbox"
                        checked={submitData.githubPublicConfirmed}
                        onChange={e => { clearError("githubPublic"); setSubmitData(d => ({ ...d, githubPublicConfirmed: e.target.checked })); }}
                        style={{ marginTop: 3, flexShrink: 0 }}
                      />
                      <span>I confirm this repository is public.</span>
                    </label>
                    <InlineError message={errGithubPublic} />
                  </>
                )}
              </div>

              <div>
                <label className="submit-label" htmlFor="demoUrl">
                  Demo / live URL <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="demoUrl"
                  className="submit-input"
                  placeholder="https://your-app.com"
                  value={submitData.demoUrl}
                  onChange={e => { clearError("demoUrl"); setSubmitData(d => ({ ...d, demoUrl: e.target.value })); }}
                  style={errDemoUrl ? { borderColor: C.error } : undefined}
                />
                <InlineError message={errDemoUrl} />
                <div className="submit-hint">
                  A hosted link anyone can open — e.g. Vercel, Netlify, Railway, your domain.
                </div>
              </div>

              <div>
                <label className="submit-label" htmlFor="videoUrl">
                  Video URL <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="videoUrl"
                  className="submit-input"
                  placeholder="https://youtube.com/watch?v=…"
                  value={submitData.videoUrl}
                  onChange={e => { clearError("videoUrl"); setSubmitData(d => ({ ...d, videoUrl: e.target.value })); }}
                  style={errVideoUrl ? { borderColor: C.error } : undefined}
                />
                <InlineError message={errVideoUrl} />
                <div className="submit-hint">
                  A 30–90 second walkthrough helps. Sharing a private build? Use an{" "}
                  <a
                    href={YOUTUBE_UNLISTED_DOC}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.accent, textDecoration: "underline" }}
                  >
                    unlisted
                  </a>{" "}
                  YouTube link instead.
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: C.borderLight }} />

            {/* Screenshots */}
            <div id="mediaFiles">
              <MediaUpload
                label="Screenshots"
                value={submitData.mediaFiles}
                onChange={files => setSubmitData(d => ({ ...d, mediaFiles: typeof files === 'function' ? files(d.mediaFiles) : files }))}
              />
            </div>

            <div style={{ height: 1, background: C.borderLight }} />

            {/* Tech stack */}
            <div id="stack">
              <label className="submit-label">Tech stack</label>

              {submitData.stack.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {submitData.stack.map((s, si) => {
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
                            onClick={ev => { ev.stopPropagation(); clearError("stack"); setSubmitData(d => ({ ...d, stack: d.stack.filter((_, idx) => idx !== si) })); }}
                            style={{ cursor: "pointer", fontSize: T.bodySm, color: C.textMute, lineHeight: 1, marginLeft: 2 }}
                          >{"\u00D7"}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {(() => {
                const available = STACK_SUGGESTIONS.filter(s => !submitData.stack.includes(s));
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
                            onClick={() => { clearError("stack"); setSubmitData(d => ({ ...d, stack: [...d.stack, s] })); }}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "4px 10px 4px 5px", borderRadius: 20,
                              background: C.bg, border: `1px solid ${C.borderLight}`,
                              fontSize: T.label, color: C.textSec, fontWeight: 450,
                              fontFamily: "var(--sans)", cursor: "pointer",
                              transition: "all 0.15s",
                            }}
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

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="submit-input"
                  placeholder="Or type a custom one…"
                  value={submitData.stackInput}
                  onChange={e => setSubmitData(d => ({ ...d, stackInput: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && submitData.stackInput.trim()) {
                      e.preventDefault();
                      const val = submitData.stackInput.trim();
                      if (!submitData.stack.includes(val)) { clearError("stack"); setSubmitData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" })); }
                      else setSubmitData(d => ({ ...d, stackInput: "" }));
                    }
                  }}
                  style={{ flex: 1 }}
                />
                {submitData.stackInput.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const val = submitData.stackInput.trim();
                      if (val && !submitData.stack.includes(val)) { clearError("stack"); setSubmitData(d => ({ ...d, stack: [...d.stack, val], stackInput: "" })); }
                      else setSubmitData(d => ({ ...d, stackInput: "" }));
                    }}
                    style={{
                      padding: "0 14px", borderRadius: 8, border: "none", background: C.accent,
                      fontSize: T.label, fontWeight: 600, color: C.accentFg,
                      cursor: "pointer", fontFamily: "var(--sans)", whiteSpace: "nowrap",
                    }}
                  >Add</button>
                )}
              </div>
              <InlineError message={errStack} />
              <div className="submit-hint">
                &ldquo;Open Code&rdquo; is locked in for buildathon submissions. Press Enter to add others.
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pick your track */}
        {submitStep === 3 && (
          <OCTrackPickStep
            primary={submitData.primaryTrack}
            secondaries={submitData.secondaryTracks}
            onChange={(next) => setSubmitData((d) => ({
              ...d,
              primaryTrack: next.primary,
              secondaryTracks: next.secondaries,
            }))}
            errors={currentStepErrors}
          />
        )}

        {/* Step 4: Track data */}
        {submitStep === 4 && (
          <OCTrackDataStep
            primary={submitData.primaryTrack}
            secondaries={submitData.secondaryTracks}
            trackData={submitData.trackData}
            onChange={(next) => setSubmitData((d) => ({ ...d, trackData: next }))}
            onSecondariesChange={(next) => setSubmitData((d) => {
              const claims = { ...(d.trackData.secondaryClaims ?? {}) };
              const valid = new Set(next);
              (Object.keys(claims) as TrackKey[]).forEach((k) => {
                if (!valid.has(k)) delete claims[k];
              });
              return {
                ...d,
                secondaryTracks: next,
                trackData: { ...d.trackData, secondaryClaims: claims },
              };
            })}
            errors={currentStepErrors}
            onClearError={clearError}
          />
        )}

        {/* Network / backend error (auth, 500, etc.) — not validation */}
        {networkError && (
          <div style={{
            marginTop: 16, padding: "10px 14px", borderRadius: 10,
            background: C.errorSoft, border: `1px solid ${C.errorBorder}`,
            fontSize: T.bodySm, color: C.errorText, fontFamily: "var(--sans)",
            fontWeight: 450, lineHeight: 1.45,
          }}>
            {networkError}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginTop: networkError ? 16 : 28,
        }}>
          {submitStep > 0 ? (
            <button
              type="button"
              onClick={() => { setNetworkError(""); setSubmitStep(s => s - 1); }}
              disabled={submitting}
              title="Back"
              aria-label="Back"
              style={{
                width: 44, height: 44, borderRadius: 44, flexShrink: 0,
                border: `1px solid ${C.border}`, background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textSec,
                cursor: submitting ? "default" : "pointer", fontFamily: "var(--sans)",
                transition: "all 0.12s", opacity: submitting ? 0.5 : 1, marginTop: 2,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          ) : <div />}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={handleContinue}
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
              {submitting ? "Submitting\u2026" : submitStep === 4 ? "Submit" : "Continue"}
            </button>

            {submitStep === 4 && !submitting && (
              <button
                type="button"
                onClick={() => {
                  setNetworkError("");
                  void handleSubmitProject(true);
                }}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontSize: T.bodySm, fontWeight: 450, color: C.textMute,
                  cursor: "pointer", fontFamily: "var(--sans)",
                }}
              >
                or save as draft
              </button>
            )}

            {isDev && submitStep === 4 && !submitting && (
              <button
                type="button"
                onClick={() => {
                  setNetworkError("");
                  void handleSubmitProject(true);
                }}
                title="DEV only — POST current data as a draft via the (mock) API"
                style={{
                  background: "none", border: `1px dashed ${C.borderLight}`, padding: "6px 10px",
                  borderRadius: 8, fontSize: T.caption, fontWeight: 500, color: C.textMute,
                  cursor: "pointer", fontFamily: "var(--mono)", letterSpacing: "0.02em",
                }}
              >
                DEV · fake draft submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- step error helpers (outside component, pure) ----

function clearStepErrors(prev: FormError[], step: number): FormError[] {
  return prev.filter((e) => e.step !== step);
}

function replaceStepErrors(prev: FormError[], step: number, next: FormError[]): FormError[] {
  return [...prev.filter((e) => e.step !== step), ...next];
}
