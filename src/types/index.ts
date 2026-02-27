// ---- Typography scale ----
export const T = {
  micro: 8, badge: 11, caption: 12, label: 13,
  bodySm: 14, body: 16, bodyLg: 18, subtitle: 20,
  title: 22, logo: 24, heading: 28, headingLg: 32,
  pageTitle: 40, display: 44,
} as const;

// ---- Color system (warm palette) ----
export const C = {
  bg: "#F8F7F4",
  surface: "#FFFFFF",
  surfaceWarm: "#FAF9F6",
  border: "#E8E5DE",
  borderLight: "#F0EDE6",
  text: "#181710",
  textSec: "#6B665B",
  textMute: "#A09A8C",
  accent: "#181710",
  accentSoft: "#EDEADE",
  gold: "#B8962E",
  goldSoft: "#FDF8EC",
  goldBorder: "#E8D9A0",
  green: "#2D7A3F",
  greenSoft: "#EDF7F0",
  blue: "#2255CC",
  blueSoft: "#EEF3FF",
  brand: "#0080FF",
  brandSoft: "#EBF4FF",
  brandBorder: "#99CCFF",
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
  builder: { label: "Builder", color: "#8B6914", bg: "#FDF8EC" },
  host: { label: "Host", color: "#92400E", bg: "#FEF3C7" },
  founder: { label: "Founder", color: "#5B21B6", bg: "#F3EEFF" },
  member: { label: "Member", color: "#166534", bg: "#EDF7F0" },
};

// ---- Data types ----
export interface Builder {
  name: string;
  avatar: string;
  avatarUrl?: string;
  city: string;
  title?: string;
  company?: string;
  companyColor?: string;
}

export interface Collab {
  _id?: string;
  avatar: string;
  avatarUrl?: string;
  name: string;
  title?: string;
  company?: string;
  companyColor?: string;
  role?: 'creator' | 'collaborator';
}

export interface GalleryItem {
  type: string;
  label: string;
  colors: string[];
}

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
  stack: string[];
  buildathon: string | null;
  heroColor: string;
  featured: boolean;
  date: string;
  gallery: GalleryItem[];
  url?: string;
  enabled: boolean;
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
  company?: string;
  companyColor?: string;
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
  content: string;
  parentId: string | null;
  createdAt: string;
  reactions: Reaction[];
}

// ---- Company logo via logo.dev ----

const LOGO_DEV_TOKEN = 'pk_RqfvqsxqSGSajjqEOE8sTQ';

/** Generate a logo.dev URL from a company name (best-effort domain guess) */
export function getCompanyLogoUrl(company: string): string {
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
  company: string; companyColor: string; role: string; city: string;
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
  return { name, initials, avatarUrl, company, companyColor, role, city };
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

/** Normalize a backend project (with populated creator/collabs) to frontend Project shape */
export function normalizeProject(p: Record<string, unknown>): Project {
  // Handle populated creator object
  const creatorRaw = p.creator as Record<string, unknown> | string | undefined;
  let builder: Builder;
  if (creatorRaw && typeof creatorRaw === 'object' && (creatorRaw as Record<string, unknown>).name) {
    const u = formatPopulatedUser(creatorRaw as Record<string, unknown>);
    builder = {
      name: u.name, avatar: u.initials, avatarUrl: u.avatarUrl,
      city: u.city, title: u.role || undefined,
      company: u.company || undefined, companyColor: u.companyColor || undefined,
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
          companyColor: u.companyColor || undefined, role,
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
    stack: (p.stack ?? []) as string[],
    buildathon: (p.buildathon ?? null) as string | null,
    heroColor: ((p.heroColor ?? p.hero_color ?? '#2255CC') as string),
    featured: (p.featured ?? false) as boolean,
    date: (p.date ?? '') as string,
    gallery: (p.gallery ?? []) as GalleryItem[],
    url: (p.url as string) || undefined,
    enabled: (p.enabled !== undefined ? p.enabled : true) as boolean,
  };
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
    company: (m.company ?? undefined) as string | undefined,
    companyColor: ((m.companyColor ?? m.company_color ?? (m.company ? generateCompanyColor(m.company as string) : undefined)) as string | undefined),
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
  "Claude API": "anthropic.com",
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
};

// Hardcoded logo URLs for stacks where logo.dev doesn't have a good match
const STACK_LOGO_OVERRIDES: Record<string, string> = {
  "OpenClaw": "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/openclaw.png",
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
