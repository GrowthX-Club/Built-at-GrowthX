import type { TrackData, TrackKey } from "../../types";
import { seedProjects } from "../seed-data";
import { MockRoute, ok } from "./types";

// Persisted store for submissions made in mock mode. Backed by localStorage
// so HMR/reload doesn't wipe the user's work mid-session. Cleared by
// `localStorage.removeItem("mock:submittedProjects")` when you need a clean slate.
const STORE_KEY = "mock:submittedProjects:v1";
interface MockSubmittedProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  stack: string[];
  url?: string;
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  media: { type: "image"; url: string }[];
  creators: string[];
  collabs: string[];
  isDraft: boolean;
  buildathon?: string;
  enabled: boolean;
  weighted: number;
  raw: number;
  date: string;
  builder: {
    name: string;
    avatar: string;
    city: string;
  };
  primaryTrack?: TrackKey;
  secondaryTracks?: TrackKey[];
  trackData?: TrackData;
}
function loadStore(): MockSubmittedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as MockSubmittedProject[] : [];
  } catch {
    return [];
  }
}
function saveStore(list: MockSubmittedProject[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* quota */ }
}
const submittedProjects: MockSubmittedProject[] = loadStore();

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/projects",
    description: "List projects with sorting and pagination",
    auth: false,
    handler: ({ query }) => {
      const limit = parseInt(query.get("limit") || "20", 10);
      const offset = parseInt(query.get("offset") || "0", 10);
      const sort = query.get("sort") || "trending";

      const published = seedProjects.filter(p => !p.isDraft);
      const sorted = [...published].sort((a, b) => {
        if (sort === "top") return b.weighted - a.weighted;
        if (sort === "new")
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        // Trending
        const now = Date.now();
        const score = (p: typeof a) => {
          const hoursAge =
            (now - new Date(p.date).getTime()) / 3600000;
          return p.weighted / Math.pow(hoursAge + 2, 1.5);
        };
        return score(b) - score(a);
      });

      return ok({
        projects: sorted.slice(offset, offset + limit),
        totalCount: sorted.length,
        votedProjectIds: [],
      });
    },
  },

  {
    method: "GET",
    path: "/projects/:id",
    description: "Get a single project by ID or slug",
    auth: false,
    handler: ({ params }) => {
      const project = seedProjects.find(
        (p) =>
          String(p.id) === params.id ||
          String(p.name).toLowerCase().replace(/\s+/g, "-") === params.id
      );
      return ok({ project: project || null });
    },
  },

  {
    method: "POST",
    path: "/projects",
    description: "Create a new project (requires auth). Fields: name, tagline, description, url, stack, buildProcess, isDraft",
    auth: true,
    handler: ({ body }) => {
      const id = `mock-${Date.now()}`;
      const mediaInput = Array.isArray(body.media) ? (body.media as unknown[]) : [];
      const media = mediaInput
        .map((m) => {
          if (typeof m === "string") return { type: "image" as const, url: m };
          if (m && typeof m === "object" && "url" in m) {
            return { type: "image" as const, url: String((m as { url: unknown }).url) };
          }
          return null;
        })
        .filter((m): m is { type: "image"; url: string } => m !== null);
      const project: MockSubmittedProject = {
        id,
        name: (body.name as string) || "Untitled",
        tagline: (body.tagline as string) || "",
        description: (body.description as string) || "",
        category: (body.category as string) || "AI",
        stack: Array.isArray(body.stack) ? (body.stack as string[]) : [],
        url: body.url as string | undefined,
        githubUrl: body.githubUrl as string | undefined,
        demoUrl: body.demoUrl as string | undefined,
        videoUrl: body.videoUrl as string | undefined,
        media,
        creators: Array.isArray(body.creators) ? (body.creators as string[]) : [],
        collabs: Array.isArray(body.collabs) ? (body.collabs as string[]) : [],
        isDraft: Boolean(body.isDraft),
        buildathon: body.buildathon as string | undefined,
        enabled: true,
        weighted: 0,
        raw: 0,
        date: new Date().toISOString(),
        builder: { name: "You", avatar: "Y", city: "" },
        primaryTrack: (body.primaryTrack as TrackKey | undefined),
        secondaryTracks: Array.isArray(body.secondaryTracks) ? (body.secondaryTracks as TrackKey[]) : [],
        trackData: (body.trackData as TrackData | undefined) ?? {},
      };
      submittedProjects.unshift(project);
      saveStore(submittedProjects);
      return ok({ project });
    },
  },

  {
    method: "PUT",
    path: "/projects/:id",
    description: "Update a project (requires auth). Can update isDraft, url, etc.",
    auth: true,
    handler: ({ params, body }) => {
      const idx = submittedProjects.findIndex((p) => p.id === params.id);
      if (idx !== -1) {
        const updated = { ...submittedProjects[idx] };
        if (typeof body.isDraft === "boolean") updated.isDraft = body.isDraft;
        if (typeof body.enabled === "boolean") updated.enabled = body.enabled;
        if (typeof body.name === "string") updated.name = body.name;
        if (typeof body.tagline === "string") updated.tagline = body.tagline;
        if (typeof body.description === "string") updated.description = body.description;
        if (typeof body.url === "string") updated.url = body.url;
        if (typeof body.githubUrl === "string") updated.githubUrl = body.githubUrl;
        if (typeof body.demoUrl === "string") updated.demoUrl = body.demoUrl;
        if (typeof body.videoUrl === "string") updated.videoUrl = body.videoUrl;
        if (Array.isArray(body.stack)) updated.stack = body.stack as string[];
        if (Array.isArray(body.media)) {
          const mediaInput = body.media as unknown[];
          updated.media = mediaInput
            .map((m) => {
              if (typeof m === "string") return { type: "image" as const, url: m };
              if (m && typeof m === "object" && "url" in m) {
                return { type: "image" as const, url: String((m as { url: unknown }).url) };
              }
              return null;
            })
            .filter((m): m is { type: "image"; url: string } => m !== null);
        }
        if (Array.isArray(body.creators)) updated.creators = body.creators as string[];
        if (Array.isArray(body.collabs)) updated.collabs = body.collabs as string[];
        if (typeof body.primaryTrack === "string") updated.primaryTrack = body.primaryTrack as TrackKey;
        if (Array.isArray(body.secondaryTracks)) {
          updated.secondaryTracks = body.secondaryTracks as TrackKey[];
        }
        if (body.trackData && typeof body.trackData === "object") {
          updated.trackData = body.trackData as TrackData;
        }
        submittedProjects[idx] = updated;
        saveStore(submittedProjects);
        return ok({ project: updated, success: true });
      }
      return ok({ project: { id: params.id }, success: true });
    },
  },

  {
    method: "GET",
    path: "/my-projects",
    description: "List the authenticated user's own projects",
    auth: true,
    handler: () => ok({ projects: submittedProjects }),
  },

  {
    method: "GET",
    path: "/admin/projects",
    description: "List ALL submitted projects for admin view (no filtering, includes drafts and disabled). Real backend must gate this on admin role.",
    auth: true,
    handler: () => ok({ projects: submittedProjects }),
  },
];

export default routes;
