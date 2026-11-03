// ---- Typography scale ----
export const T = {
  micro: 8, badge: 11, caption: 12, label: 13,
  bodySm: 14, body: 16, bodyLg: 18, subtitle: 20,
  title: 22, logo: 24, heading: 28, headingLg: 32,
  pageTitle: 40, display: 44,
} as const;

// ---- Color system (warm palette, theme-aware via CSS custom properties) ----
export const C = {
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  surfaceWarm: "var(--c-surfaceWarm)",
  border: "var(--c-border)",
  borderLight: "var(--c-borderLight)",
  text: "var(--c-text)",
  textSec: "var(--c-textSec)",
  textMute: "var(--c-textMute)",
  accent: "var(--c-accent)",
  accentSoft: "var(--c-accentSoft)",
  accentFg: "var(--c-accentFg)",
  gold: "var(--c-gold)",
  goldSoft: "var(--c-goldSoft)",
  goldBorder: "var(--c-goldBorder)",
  green: "var(--c-green)",
  greenSoft: "var(--c-greenSoft)",
  blue: "var(--c-blue)",
  blueSoft: "var(--c-blueSoft)",
  brand: "var(--c-brand)",
  brandSoft: "var(--c-brandSoft)",
  brandBorder: "var(--c-brandBorder)",
  error: "var(--c-error)",
  errorSoft: "var(--c-errorSoft)",
  errorBorder: "var(--c-errorBorder)",
  errorText: "var(--c-errorText)",
  creator: "var(--c-creator)",
  creatorBg: "var(--c-creator-bg)",
};

// ---- Custom emoji reactions ----
export interface CustomEmoji {
  code: string;
  display: string;
  label: string;
  special?: boolean;
}

export const CUSTOM_EMOJIS: CustomEmoji[] = [
  { code: "ship_it", display: "\u{1F680}", label: "Ship it" },
  { code: "take_my_money", display: "\u{1F4B8}", label: "Take my money" },
  { code: "built_different", display: "\u{26A1}", label: "Built different" },
  { code: "fire", display: "\u{1F525}", label: "Fire" },
  { code: "love", display: "\u{2764}\u{FE0F}", label: "Love" },
  { code: "mind_blown", display: "\u{1F92F}", label: "Mind blown" },
  { code: "builder_approved", display: "\u{2726}", label: "Builder approved", special: true },
  { code: "eyes", display: "\u{1F440}", label: "Looking" },
  { code: "hundred", display: "\u{1F4AF}", label: "100" },
  { code: "clap", display: "\u{1F44F}", label: "Clap" },
  { code: "growthx", display: "\u{25C6}", label: "GrowthX", special: true },
  { code: "chef_kiss", display: "\u{1F90C}", label: "Chef's kiss" },
];

// ---- Roles ----
export const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  builder: { label: "Builder", color: "var(--c-role-builder)", bg: "var(--c-role-builder-bg)" },
  host: { label: "Host", color: "var(--c-role-host)", bg: "var(--c-role-host-bg)" },
  founder: { label: "Founder", color: "var(--c-role-founder)", bg: "var(--c-role-founder-bg)" },
  member: { label: "Member", color: "var(--c-role-member)", bg: "var(--c-role-member-bg)" },
};

// ---- Data types ----
export interface Builder {
  _id?: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  city: string;
  title?: string;
  company?: string;
  companyColor?: string;
  companyLogo?: string;
}

export interface Collab {
  _id?: string;
  avatar: string;
  avatarUrl?: string;
  name: string;
  title?: string;
  company?: string;
  companyColor?: string;
  companyLogo?: string;
  role?: 'creator' | 'collaborator';
}

export interface GalleryItem {
  type: string;
  label: string;
  colors: string[];
}

export interface MediaItem {
  type: "image" | "loom" | "youtube";
  url: string;
}

export type ProjectTrack = 'virality' | 'revenue' | 'maas' | null;
export type ProjectAccolade = 'rank-1' | 'rank-2' | 'rank-3' | 'top-5' | 'top-15' | null;

export interface Project {
  id: string | number;
  _id?: string;
  name: string;
  tagline: string;
  description: string;
  builder: Builder;
  creators?: Collab[];
  collabs: Collab[];
  weighted: number;
  raw: number;
  category: string;
  icon?: string;
  stack: string[];
  buildathon: string | null;
  heroColor: string;
  featured: boolean;
  date: string;
  gallery: GalleryItem[];
  media?: MediaItem[];
  slug?: string;
  url?: string;
  buildProcess?: string;
  isDraft?: boolean;
  enabled: boolean;
  /** Project track classification (nullable — server may not populate). */
  track?: ProjectTrack;
  /** Project accolade / ranking (nullable — server may not populate). */
  accolade?: ProjectAccolade;
  /** A skill shipped with the project; only set once GrowthX has reviewed it. */
  skill?: ProjectSkill;
}

export interface ProjectSkill {
  name: string;
  /** The skill's folder on GitHub at the reviewed commit, when it came from GitHub. */
  sourceUrl?: string;
  reviewedAt: string;
  /** The full SKILL.md text; only the project page carries it, never the lists. */
  instructions?: string;
  files: { path: string; size: number }[];
  downloads: number;
  version?: number;
  /** Whether a downloadable zip exists (Claude and ChatGPT upload it). */
  hasBundle: boolean;
  category?: string;
}

/** A member's skill upload while GrowthX checks it (GET /bx/skills/submissions). */
export interface SkillSubmission {
  id: string;
  status: "pending" | "approved" | "sent_back";
  name: string;
  /** The listing's title and one-line summary; null means the backend makes them from SKILL.md. */
  title: string | null;
  tagline: string | null;
  description: string;
  category: string;
  files: { path: string; size: number }[];
  sourceUrl: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  projectSlug: string | null;
  instructions?: string;
  /** Every file in the upload with its text (null for binary files); only the single-submission read has it. */
  contents?: { path: string; text: string | null }[];
  user?: { id: string; name: string; avatarUrl?: string };
}

export interface BuildingProject {
  id: string | number;
  name: string;
  tagline: string;
  builder: { name: string; avatar: string; avatarUrl?: string; role: string; city: string };
  status: "idea" | "prototyping" | "beta";
  watchers: number;
  log: string;
  logDate: string;
  help: string | null;
}

export interface BuilderProfile {
  _id?: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  role: string;
  city: string;
  rep: number;
  shipped: number;
  bio: string;
  /** Job title (current experience when the backend has it). */
  title?: string;
  company?: string;
  companyColor?: string;
  companyLogo?: string;
  currentFunction?: string;
  linkedin?: string;
  twitter?: string;
  isMembershipActive?: boolean;
}

export interface CityData {
  name: string;
  builders: number;
  shipped: number;
  flag: string;
  trend: string;
}

export interface Reaction {
  emoji: CustomEmoji;
  count: number;
  mine?: boolean;
}

export interface ThreadReply {
  author: {
    name: string;
    avatar: string;
    role: string;
    isCreator?: boolean;
    title?: string;
    company?: string;
    companyColor?: string;
    companyLogo?: string;
  };
  content: string;
  time: string;
  reactions: Reaction[];
}

export interface ThreadData {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    rep: number;
    title?: string;
    company?: string;
    companyColor?: string;
    companyLogo?: string;
  };
  content: string;
  time: string;
  reactions: Reaction[];
  replies: ThreadReply[];
}

export interface Comment {
  id: string;
  projectId: string | number;
  authorName: string;
  authorAvatar: string;
  authorAvatarUrl?: string;
  authorRole: string;
  authorTitle: string;
  authorCompany: string;
  authorCompanyColor: string;
  authorCompanyLogo?: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  reactions: Reaction[];
}

// ---- Company logo via logo.dev ----

const LOGO_DEV_TOKEN = 'pk_RqfvqsxqSGSajjqEOE8sTQ';

/** Get company logo URL — uses DB logo if available, falls back to logo.dev domain guess */
export function getCompanyLogoUrl(company: string, dbLogoUrl?: string): string {
  if (dbLogoUrl && !dbLogoUrl.includes('cdn.brandfetch.io')) return dbLogoUrl;
  if (!company) return '';
  // Strip common suffixes and normalize to a plausible domain
  const cleaned = company
    .replace(/\s*(Inc\.?|Ltd\.?|Pvt\.?|LLC|Corp\.?|Technologies|Tech|Limited|Private|&\s*Co\.?)$/i, '')
    .trim();
  const domain = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=64`;
}

// ---- Normalizers for gx-backend response shapes ----

function generateCompanyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#0C2451', '#5B21B6', '#92400E', '#166534', '#1E40AF', '#7C3AED', '#B45309', '#047857'];
  return colors[Math.abs(hash) % colors.length];
}

// Extract flat user fields from a gx-backend populated user object
function formatPopulatedUser(u: Record<string, unknown>): {
  name: string; initials: string; avatarUrl: string | undefined;
  company: string; companyColor: string; companyLogo: string; role: string; city: string;
} {
  const nameObj = u?.name as Record<string, string> | undefined;
  const first = nameObj?.first || '';
  const last = nameObj?.last || '';
  const name = `${first} ${last}`.trim() || 'Anonymous';
  const initials = (first.charAt(0) + last.charAt(0)).toUpperCase() || '?';
  const avatarUrl = (u?.display_picture as string) || undefined;
  const onboarding = u?.onboarding as Record<string, unknown> | undefined;
  const enrollment = onboarding?.enrollment as Record<string, unknown> | undefined;
  const appForm = enrollment?.application_form as Record<string, string> | undefined;
  const company = appForm?.company || '';
  const role = appForm?.role || '';
  const addresses = u?.addresses as Record<string, unknown> | undefined;
  const defaultAddr = addresses?.default_address as Record<string, string> | undefined;
  const talent = u?.talent as Record<string, unknown> | undefined;
  const prefLoc = Array.isArray(talent?.preferred_location) ? talent.preferred_location[0] as Record<string, string> | undefined : undefined;
  const city = defaultAddr?.city || prefLoc?.city || '';
  const companyColor = company ? generateCompanyColor(company) : '';
  const companyLogo = (u?.company_logo as string) || '';
  return { name, initials, avatarUrl, company, companyColor, companyLogo, role, city };
}

function normalizeReactions(raw: unknown[]): Reaction[] {
  return raw.map((item) => {
    const r = item as Record<string, unknown>;
    return {
      emoji: {
        code: (r.emoji_code ?? '') as string,
        display: (r.emoji_display ?? '') as string,
        label: (r.emoji_label ?? '') as string,
        special: (r.emoji_special ?? false) as boolean,
      },
      count: (r.count ?? 0) as number,
      mine: (r.mine ?? false) as boolean,
    };
  });
}

/** Extract a YouTube video id from watch / youtu.be / embed / shorts URLs (null if not YouTube) */
export function getYouTubeVideoId(url: string): string | null {
  const m = url.match(
    /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

/** Extract a Loom video id from share/embed URLs (null if not Loom) */
export function getLoomVideoId(url: string): string | null {
  const m = url.match(/^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  return m ? m[1] : null;
}

/** Classify a media URL as loom, youtube, or image. Only classifies as video
 * when a video id is actually extractable, so consumers can safely embed. */
export function detectMediaType(url: string): MediaItem["type"] {
  if (getLoomVideoId(url)) return "loom";
  if (getYouTubeVideoId(url)) return "youtube";
  return "image";
}

/** True if a media item is a video embed (not an image) */
export function isVideoMedia(item: MediaItem): boolean {
  return item.type === "loom" || item.type === "youtube";
}

/** Parse raw media array (strings or objects) into typed MediaItem[] */
function normalizeMedia(raw: unknown): MediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        const url = item.trim();
        if (!url) return null;
        return { type: detectMediaType(url), url } as MediaItem;
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const url = ((obj.url ?? "") as string).trim();
        if (!url) return null;
        // Never trust a claimed type — re-derive from the URL so a mislabeled
        // entry can't reach an <iframe src> without a valid video id.
        return { type: detectMediaType(url), url } as MediaItem;
      }
      return null;
    })
    .filter(Boolean) as MediaItem[];
}

const CDN = "https://public-cdn.growthx.club/";

/**
 * The project's first screenshot, resized by the CDN (Cloudflare) to `width` px; undefined when it has none.
 * Only our own CDN's image files count: Drive/Docs links and videos are not pictures we can show.
 */
export function projectImage(p: Pick<Project, "media">, width: number): string | undefined {
  const m = p.media?.find(x => x.type === "image" && x.url.startsWith(CDN) && /\.(png|jpe?g|gif|webp)$/i.test(x.url));
  if (!m) return undefined;
  return `${CDN}cdn-cgi/image/width=${width},quality=75,format=auto/${m.url.slice(CDN.length)}`;
}

/**
 * Format a project date for display (e.g. "26 Jul 2026").
 * Returns "" when the value doesn't parse as a date so callers can hide it.
 */
export function formatProjectDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Normalize a backend project (with populated creator/collabs) to frontend Project shape */
export function normalizeProject(p: Record<string, unknown>): Project {
  // Handle populated creator object
  const creatorRaw = p.creator as Record<string, unknown> | string | undefined;
  let builder: Builder;
  if (creatorRaw && typeof creatorRaw === 'object' && (creatorRaw as Record<string, unknown>).name) {
    const u = formatPopulatedUser(creatorRaw as Record<string, unknown>);
    builder = {
      _id: ((creatorRaw as Record<string, unknown>)._id ?? '') as string,
      name: u.name, avatar: u.initials, avatarUrl: u.avatarUrl,
      city: u.city, title: u.role || undefined,
      company: u.company || undefined, companyColor: u.companyColor || undefined,
      companyLogo: u.companyLogo || undefined,
    };
  } else if (p.builder && typeof p.builder === 'object') {
    // Already in flat builder shape (e.g. from local state)
    builder = p.builder as Builder;
  } else {
    builder = { name: 'Anonymous', avatar: '?', city: '' };
  }

  // Helper to parse a populated users array
  const parseUserArray = (raw: unknown[], role: 'creator' | 'collaborator'): Collab[] =>
    raw.map((_c) => {
      if (typeof _c === 'string') return { _id: _c, name: '', avatar: '', role } as Collab;
      const c = _c as Record<string, unknown>;
      if (c && typeof c === 'object' && c.name && typeof c.name === 'object') {
        const u = formatPopulatedUser(c);
        return {
          _id: (c._id ?? '') as string,
          name: u.name, avatar: u.initials, avatarUrl: u.avatarUrl,
          title: u.role || undefined, company: u.company || undefined,
          companyColor: u.companyColor || undefined, companyLogo: u.companyLogo || undefined, role,
        };
      }
      return { ...(c as unknown as Collab), role };
    });

  // Handle populated creators array (additional creators beyond the submitter)
  const creators = parseUserArray(Array.isArray(p.creators) ? p.creators : [], 'creator');

  // Handle populated collabs array — exclude anyone already in creators
  const creatorIds = new Set(creators.map(c => c._id || c.name).filter(Boolean));
  const collabs = parseUserArray(Array.isArray(p.collabs) ? p.collabs : [], 'collaborator')
    .filter(c => !creatorIds.has(c._id || c.name));

  return {
    id: (p.id ?? p._id ?? '') as string,
    _id: p._id as string | undefined,
    name: (p.name ?? '') as string,
    tagline: (p.tagline ?? '') as string,
    description: (p.description ?? '') as string,
    builder,
    creators,
    collabs,
    weighted: (p.weighted ?? p.weighted_votes ?? 0) as number,
    raw: (p.raw ?? p.raw_votes ?? 0) as number,
    category: (p.category ?? '') as string,
    icon: (p.icon as string) || undefined,
    stack: (p.stack ?? []) as string[],
    buildathon: (p.buildathon ?? null) as string | null,
    heroColor: ((p.heroColor ?? p.hero_color ?? '#2255CC') as string),
    featured: (p.featured ?? false) as boolean,
    date: (p.date ?? p.created_at ?? p.createdAt ?? '') as string,
    gallery: (p.gallery ?? []) as GalleryItem[],
    media: normalizeMedia(p.media),
    slug: (p.slug ?? undefined) as string | undefined,
    url: (p.url as string) || undefined,
    buildProcess: (p.buildProcess ?? p.build_process ?? undefined) as string | undefined,
    isDraft: (p.isDraft ?? p.is_draft ?? false) as boolean,
    enabled: (p.enabled !== undefined ? p.enabled : true) as boolean,
    track: normalizeTrack(p.track),
    accolade: normalizeAccolade(p.accolade),
    skill: normalizeSkill(p.skill),
  };
}

type RawFile = { path?: string; size?: number };
const normalizeFiles = (files: unknown) =>
  (Array.isArray(files) ? (files as RawFile[]) : [])
    .filter(f => typeof f?.path === "string")
    .map(f => ({ path: f.path as string, size: Number(f.size) || 0 }));

function normalizeSkill(raw: unknown): ProjectSkill | undefined {
  const s = raw as {
    name?: string; source_url?: string | null; reviewed_at?: string | null; instructions?: string;
    files?: unknown; downloads?: number; version?: number; has_bundle?: boolean; category?: string;
  } | null | undefined;
  if (!s?.name || !s.reviewed_at) return undefined;
  return {
    name: s.name,
    sourceUrl: s.source_url || undefined,
    reviewedAt: s.reviewed_at,
    instructions: s.instructions || undefined,
    files: normalizeFiles(s.files),
    downloads: Number(s.downloads) || 0,
    version: s.version,
    hasBundle: !!s.has_bundle,
    category: s.category || undefined,
  };
}

export function normalizeSubmission(raw: Record<string, unknown>): SkillSubmission {
  const u = raw.user as { _id?: string; name?: { first?: string; last?: string }; display_picture?: string } | undefined;
  return {
    id: String(raw._id ?? ""),
    status: (["pending", "approved", "sent_back"].includes(raw.status as string) ? raw.status : "pending") as SkillSubmission["status"],
    name: String(raw.name ?? ""),
    title: (raw.title as string) || null,
    tagline: (raw.tagline as string) || null,
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    files: normalizeFiles(raw.files),
    sourceUrl: (raw.source_url as string) || null,
    reviewNote: (raw.review_note as string) || null,
    createdAt: String(raw.created_at ?? ""),
    reviewedAt: (raw.reviewed_at as string) || null,
    projectSlug: (raw.project_slug as string) || null,
    instructions: (raw.instructions as string) || undefined,
    contents: Array.isArray(raw.contents)
      ? (raw.contents as { path?: string; text?: string | null }[])
          .filter(c => typeof c?.path === "string")
          .map(c => ({ path: c.path as string, text: typeof c.text === "string" ? c.text : null }))
      : undefined,
    user: u ? {
      id: String(u._id ?? ""),
      name: `${u.name?.first ?? ""} ${u.name?.last ?? ""}`.trim() || "A GrowthX member",
      avatarUrl: u.display_picture || undefined,
    } : undefined,
  };
}

const VALID_TRACKS = new Set<NonNullable<ProjectTrack>>(['virality', 'revenue', 'maas']);
const VALID_ACCOLADES = new Set<NonNullable<ProjectAccolade>>([
  'rank-1', 'rank-2', 'rank-3', 'top-5', 'top-15',
]);

function normalizeTrack(raw: unknown): ProjectTrack {
  if (typeof raw !== 'string') return null;
  const v = raw.toLowerCase();
  return VALID_TRACKS.has(v as NonNullable<ProjectTrack>) ? (v as NonNullable<ProjectTrack>) : null;
}

function normalizeAccolade(raw: unknown): ProjectAccolade {
  if (typeof raw !== 'string') return null;
  const v = raw.toLowerCase();
  return VALID_ACCOLADES.has(v as NonNullable<ProjectAccolade>) ? (v as NonNullable<ProjectAccolade>) : null;
}

/** Normalize backend /me response to BuilderProfile */
export function normalizeUser(u: Record<string, unknown> | null): BuilderProfile | null {
  if (!u) return null;
  return {
    _id: (u._id ?? '') as string,
    name: (u.name ?? 'Anonymous') as string,
    avatar: (u.initials ?? u.avatar ?? '?') as string,
    avatarUrl: (u.avatar_url ?? undefined) as string | undefined,
    role: 'member', // platform role — backend doesn't distinguish yet
    city: (u.city ?? '') as string,
    rep: (u.rep ?? 0) as number,
    shipped: (u.shipped ?? 0) as number,
    bio: (u.bio ?? '') as string,
    company: (u.company ?? undefined) as string | undefined,
    companyColor: ((u.companyColor ?? u.company_color ?? (u.company ? generateCompanyColor(u.company as string) : undefined)) as string | undefined),
    companyLogo: ((u.companyLogo ?? u.company_logo ?? undefined) as string | undefined),
    currentFunction: (u.current_function ?? u.currentFunction ?? undefined) as string | undefined,
    linkedin: (u.linkedin ?? undefined) as string | undefined,
    twitter: (u.twitter ?? undefined) as string | undefined,
    isMembershipActive: (u.is_membership_active ?? false) as boolean,
  };
}

/** Normalize backend building project (has populated creator instead of flat builder) */
export function normalizeBuildingProject(p: Record<string, unknown>): BuildingProject {
  const creatorRaw = p.creator as Record<string, unknown> | undefined;
  let builder: BuildingProject['builder'];
  if (creatorRaw && typeof creatorRaw === 'object' && (creatorRaw as Record<string, unknown>).name && typeof (creatorRaw as Record<string, unknown>).name === 'object') {
    const u = formatPopulatedUser(creatorRaw);
    builder = { name: u.name, avatar: u.initials, avatarUrl: u.avatarUrl, role: 'member', city: u.city };
  } else if (p.builder && typeof p.builder === 'object') {
    builder = p.builder as BuildingProject['builder'];
  } else {
    builder = { name: 'Anonymous', avatar: '?', role: 'member', city: '' };
  }

  return {
    id: (p.id ?? p._id ?? '') as string | number,
    name: (p.name ?? '') as string,
    tagline: (p.tagline ?? '') as string,
    builder,
    status: (p.status ?? 'idea') as BuildingProject['status'],
    watchers: (p.watchers ?? 0) as number,
    log: (p.log ?? '') as string,
    logDate: ((p.logDate ?? p.log_date ?? '') as string),
    help: (p.help ?? null) as string | null,
  };
}

/** Normalize backend thread (snake_case → camelCase, reaction shape) */
export function normalizeThread(t: Record<string, unknown>): ThreadData {
  const rawAuthor = t.author as Record<string, unknown> | undefined;
  const author = {
    name: (rawAuthor?.name ?? '') as string,
    avatar: (rawAuthor?.avatar ?? '') as string,
    role: (rawAuthor?.role ?? 'member') as string,
    rep: (rawAuthor?.rep ?? 0) as number,
    title: (rawAuthor?.title ?? undefined) as string | undefined,
    company: (rawAuthor?.company ?? undefined) as string | undefined,
    companyColor: ((rawAuthor?.companyColor ?? rawAuthor?.company_color ?? undefined) as string | undefined),
    companyLogo: ((rawAuthor?.companyLogo ?? rawAuthor?.company_logo ?? undefined) as string | undefined),
  };

  const rawReactions = Array.isArray(t.reactions) ? t.reactions : [];
  const rawReplies = Array.isArray(t.replies) ? t.replies : [];

  return {
    id: (t.id ?? t._id ?? '') as string,
    author,
    content: (t.content ?? '') as string,
    time: (t.time ?? '') as string,
    reactions: normalizeReactions(rawReactions),
    replies: rawReplies.map((r: Record<string, unknown>) => {
      const ra = r.author as Record<string, unknown> | undefined;
      return {
        author: {
          name: (ra?.name ?? '') as string,
          avatar: (ra?.avatar ?? '') as string,
          role: (ra?.role ?? 'member') as string,
          isCreator: (ra?.isCreator ?? ra?.is_creator ?? false) as boolean,
          title: (ra?.title ?? undefined) as string | undefined,
          company: (ra?.company ?? undefined) as string | undefined,
          companyColor: ((ra?.companyColor ?? ra?.company_color ?? undefined) as string | undefined),
          companyLogo: ((ra?.companyLogo ?? ra?.company_logo ?? undefined) as string | undefined),
        },
        content: (r.content ?? '') as string,
        time: (r.time ?? '') as string,
        reactions: normalizeReactions(Array.isArray(r.reactions) ? r.reactions : []),
      };
    }),
  };
}

/** Normalize a backend member to BuilderProfile (from /members endpoint) */
export function normalizeMember(m: Record<string, unknown>): BuilderProfile {
  return {
    _id: (m._id ?? '') as string,
    name: (m.name ?? 'Anonymous') as string,
    avatar: (m.initials ?? m.avatar ?? '?') as string,
    avatarUrl: (m.avatar_url ?? undefined) as string | undefined,
    role: 'member', // platform role not available from backend yet
    city: (m.city ?? '') as string,
    rep: (m.rep ?? 0) as number,
    shipped: (m.shipped ?? 0) as number,
    bio: (m.bio ?? '') as string,
    title: ((m.title ?? m.role) || undefined) as string | undefined,
    company: (m.company ?? undefined) as string | undefined,
    companyColor: ((m.companyColor ?? m.company_color ?? (m.company ? generateCompanyColor(m.company as string) : undefined)) as string | undefined),
    companyLogo: ((m.companyLogo ?? m.company_logo ?? undefined) as string | undefined),
  };
}

export function normalizeComment(c: Record<string, unknown>): Comment {
  const rawReactions = Array.isArray(c.reactions) ? c.reactions : [];

  // Handle populated author object from backend
  const authorRaw = c.author as Record<string, unknown> | undefined;
  let authorName = (c.authorName ?? c.author_name ?? "Anonymous") as string;
  let authorAvatar = (c.authorAvatar ?? c.author_avatar ?? "") as string;
  let authorRole = (c.authorRole ?? c.author_role ?? "member") as string;
  let authorTitle = (c.authorTitle ?? c.author_title ?? "") as string;
  let authorCompany = (c.authorCompany ?? c.author_company ?? "") as string;
  let authorCompanyColor = (c.authorCompanyColor ?? c.author_company_color ?? "") as string;
  let authorCompanyLogo = (c.authorCompanyLogo ?? c.author_company_logo ?? undefined) as string | undefined;
  let authorAvatarUrl = (c.authorAvatarUrl ?? c.author_avatar_url ?? undefined) as string | undefined;

  if (authorRaw && typeof authorRaw === 'object' && authorRaw.name && typeof authorRaw.name === 'object') {
    // Populated gx-backend user object
    const u = formatPopulatedUser(authorRaw);
    authorName = u.name;
    authorAvatar = u.initials;
    authorAvatarUrl = u.avatarUrl;
    authorRole = 'member';
    authorTitle = u.role;
    authorCompany = u.company;
    authorCompanyColor = u.companyColor;
    authorCompanyLogo = u.companyLogo || undefined;
  }

  return {
    id: (c.id ?? c._id ?? "") as string,
    projectId: (c.projectId ?? c.project_id ?? "") as string,
    authorName,
    authorAvatar,
    authorAvatarUrl,
    authorRole,
    authorTitle,
    authorCompany,
    authorCompanyColor,
    authorCompanyLogo,
    content: (c.content ?? "") as string,
    parentId: (c.parentId ?? c.parent_id ?? null) as string | null,
    createdAt: (c.createdAt ?? c.created_at ?? c.updatedAt ?? c.updated_at ?? "") as string,
    reactions: normalizeReactions(rawReactions),
  };
}

export interface Vote {
  projectId: number;
  builderName: string;
  weight: number;
}

// ---- BX API Keys ----
export interface BxApiKey {
  _id: string;
  user: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyResponse {
  success: true;
  msg: string;
  api_key: string;
}

export interface ListApiKeysResponse {
  success: true;
  api_keys: BxApiKey[];
}

export interface RevokeApiKeyResponse {
  success: true;
  msg: string;
}

export const ROLE_WEIGHTS: Record<string, number> = {
  founder: 5,
  host: 4,
  builder: 3,
  member: 2,
};

// Stack metadata for tech icons
export const STACK_META: Record<string, { icon: string; bg: string; color: string }> = {
  "Next.js": { icon: "N", bg: "#000", color: "#fff" },
  "Claude API": { icon: "C", bg: "#D4A27F", color: "#fff" },
  "Supabase": { icon: "S", bg: "#3ECF8E", color: "#fff" },
  "Vercel": { icon: "\u{25B2}", bg: "#000", color: "#fff" },
  "React": { icon: "\u{269B}", bg: "#61DAFB", color: "#222" },
  "Node.js": { icon: "N", bg: "#339933", color: "#fff" },
  "Razorpay": { icon: "R", bg: "#0C2451", color: "#fff" },
  "PostgreSQL": { icon: "P", bg: "#336791", color: "#fff" },
  "Python": { icon: "Py", bg: "#3776AB", color: "#FFD43B" },
  "Whisper": { icon: "W", bg: "#412991", color: "#fff" },
  "GPT-4": { icon: "G", bg: "#10A37F", color: "#fff" },
  "FastAPI": { icon: "F", bg: "#009688", color: "#fff" },
  "TensorFlow": { icon: "TF", bg: "#FF6F00", color: "#fff" },
  "Flutter": { icon: "F", bg: "#02569B", color: "#fff" },
  "Firebase": { icon: "\u{1F525}", bg: "#FFCA28", color: "#333" },
  "Google Maps API": { icon: "G", bg: "#4285F4", color: "#fff" },
  "React Native": { icon: "\u{269B}", bg: "#61DAFB", color: "#222" },
  "WhatsApp Business API": { icon: "W", bg: "#25D366", color: "#fff" },
  "OpenClaw": { icon: "\u{1F99E}", bg: "#D63B2F", color: "#fff" },
};

// Stack name → logo.dev domain mapping
const STACK_DOMAINS: Record<string, string> = {
  "Next.js": "nextjs.org",
  "Claude API": "claude.com",
  "Supabase": "supabase.com",
  "Vercel": "vercel.com",
  "React": "react.dev",
  "Node.js": "nodejs.org",
  "Razorpay": "razorpay.com",
  "PostgreSQL": "postgresql.org",
  "Python": "python.org",
  "Whisper": "openai.com",
  "GPT-4": "openai.com",
  "FastAPI": "fastapi.tiangolo.com",
  "TensorFlow": "tensorflow.org",
  "Flutter": "flutter.dev",
  "Firebase": "firebase.google.com",
  "Google Maps API": "google.com",
  "React Native": "reactnative.dev",
  "WhatsApp Business API": "whatsapp.com",
  "TypeScript": "typescriptlang.org",
  "JavaScript": "javascript.com",
  "Tailwind CSS": "tailwindcss.com",
  "MongoDB": "mongodb.com",
  "Redis": "redis.io",
  "Docker": "docker.com",
  "AWS": "aws.amazon.com",
  "Stripe": "stripe.com",
  "Figma": "figma.com",
  "GitHub": "github.com",
  "OpenAI": "openai.com",
  "Prisma": "prisma.io",
  "GraphQL": "graphql.org",
  "Express": "expressjs.com",
  "Vue.js": "vuejs.org",
  "Angular": "angular.io",
  "Svelte": "svelte.dev",
  "Django": "djangoproject.com",
  "Ruby on Rails": "rubyonrails.org",
  "Go": "go.dev",
  "Rust": "rust-lang.org",
  "Kotlin": "kotlinlang.org",
  "Swift": "swift.org",
  "Cloudflare": "cloudflare.com",
  "Twilio": "twilio.com",
  "Slack API": "slack.com",
  "Notion API": "notion.so",
  "Linear": "linear.app",
  "Framer": "framer.com",
  "OpenClaw": "openclaw.com",
  // AI models & coding agents — product marks, not vendor-company logos
  "Claude": "claude.com",
  "Claude Code": "claude.com",
  "Cursor": "cursor.com",
  "GPT-4o": "openai.com",
  // Sarvam model family
  "Samvaad": "sarvam.ai",
  "Saaras": "sarvam.ai",
  "Bulbul": "sarvam.ai",
  "Sarvam Vision": "sarvam.ai",
  "Sarvam Translate": "sarvam.ai",
  "Sarvam-30B": "sarvam.ai",
  "Sarvam-105B": "sarvam.ai",
  "Sarvam AI": "sarvam.ai",
  // Non-.com brands the domain guess gets wrong
  "LiveKit": "livekit.io",
  "Streamlit": "streamlit.io",
  "Pipecat": "pipecat.ai",
  "Hono": "hono.dev",
  "Qdrant": "qdrant.tech",
  "KiCad": "kicad.org",
  "ffmpeg": "ffmpeg.org",
  "FFmpeg": "ffmpeg.org",
  "MCP": "modelcontextprotocol.io",
  "LangGraph": "langchain.com",
  "LangChain": "langchain.com",
  "Fastify": "fastify.dev",
  "Zod": "zod.dev",
  "Vite": "vitejs.dev",
  "SQLite": "sqlite.org",
  "Railway": "railway.app",
  "Telegram": "telegram.org",
  "Android": "android.com",
  "WebRTC": "webrtc.org",
  "npm": "npmjs.com",
  "Flask": "flask.palletsprojects.com",
  "Framer Motion": "framer.com",
  "Vercel AI SDK": "vercel.com",
  "Tailwind": "tailwindcss.com",
  "Postgres": "postgresql.org",
  "n8n": "n8n.io",
  "Exotel": "exotel.com",
  "WhatsApp": "whatsapp.com",
};

// Hardcoded logo URLs for stacks where logo.dev doesn't have a good match
const STACK_LOGO_OVERRIDES: Record<string, string> = {
  "OpenClaw": "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/openclaw.png",
  // Codex has no own domain on logo.dev — openai.com would render the OpenAI
  // company logo, which misrepresents the agent. Use the Codex product mark.
  "Codex": "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/codex.png",
};

/** Generate a logo.dev URL for a tech stack item */
export function getStackLogoUrl(stackName: string): string {
  if (!stackName) return '';
  if (STACK_LOGO_OVERRIDES[stackName]) return STACK_LOGO_OVERRIDES[stackName];
  // Use known mapping first, fall back to best-effort domain guess
  const domain = STACK_DOMAINS[stackName]
    || stackName.toLowerCase().replace(/\s*(api|sdk|\.js|\.ts)$/i, '').replace(/[^a-z0-9]/g, '') + '.com';
  return `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=64`;
}
