export interface Event {
  _id: string;
  name: string;
  type: "buildathon" | "cohort" | "host_club" | "independent";
  city: string;
  date: string;
  host: {
    memberId: string;
    name: string;
  };
  projectCount: number;
  color: string;
}

export interface TeamMember {
  memberId: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Project {
  _id: string;
  name: string;
  tagline: string;
  description: string;
  buildLog: string;
  logo: string;
  screenshots: string[];
  demoVideo: string;
  productUrl: string;
  category:
    | "AI tool"
    | "SaaS"
    | "Developer tool"
    | "Consumer app"
    | "Chrome extension"
    | "Internal tool"
    | "API";
  event?: string;
  eventData?: Event;
  cohortTag?: string;
  team: TeamMember[];
  weekSubmitted: number;
  submittedAt: string;
  weightedScore: number;
  rawVotes: number;
  traction?: {
    users?: string | number;
    revenue?: string;
  };
}

export interface Member {
  _id: string;
  name: string;
  avatar: string;
  company: string;
  city: string;
  role: "builder" | "host" | "founder" | "member" | "nonmember";
  bio: string;
  linkedIn: string;
  twitter: string;
  builderScore: number;
  projectsShipped: number;
  totalWeightedVotes: number;
}

export interface Vote {
  _id: string;
  projectId: string;
  memberId: string;
  role: string;
  weight: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  projectId: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  content: string;
  parentId?: string;
  createdAt: string;
}

export const ROLE_WEIGHTS: Record<string, number> = {
  builder: 5,
  host: 4,
  founder: 3,
  member: 2,
  nonmember: 1,
};

export const ROLE_COLORS: Record<string, string> = {
  builder: "#FF6B35",
  host: "#7C3AED",
  founder: "#059669",
  member: "#2563EB",
  nonmember: "#8899AA",
};

export const CATEGORY_OPTIONS = [
  "AI tool",
  "SaaS",
  "Developer tool",
  "Consumer app",
  "Chrome extension",
  "Internal tool",
  "API",
] as const;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  buildathon: "#FF6B35",
  cohort: "#7C3AED",
  host_club: "#059669",
  independent: "#2563EB",
};
