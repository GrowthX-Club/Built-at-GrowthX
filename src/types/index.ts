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
  city: string;
  title?: string;
  company?: string;
  companyColor?: string;
}

export interface Collab {
  avatar: string;
  name: string;
  title?: string;
  company?: string;
  companyColor?: string;
}

export interface GalleryItem {
  type: string;
  label: string;
  colors: string[];
}

export interface Project {
  id: number;
  name: string;
  tagline: string;
  description: string;
  builder: Builder;
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
}

export interface BuildingProject {
  id: number;
  name: string;
  tagline: string;
  builder: { name: string; avatar: string; role: string; city: string };
  status: "idea" | "prototyping" | "beta";
  watchers: number;
  log: string;
  logDate: string;
  help: string | null;
}

export interface BuilderProfile {
  name: string;
  avatar: string;
  role: string;
  city: string;
  rep: number;
  shipped: number;
  bio: string;
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
  projectId: number;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface Vote {
  projectId: number;
  builderName: string;
  weight: number;
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
};
