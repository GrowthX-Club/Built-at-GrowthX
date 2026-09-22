import { mockBxApi } from "./mock-api/index";
import type { Skill, SkillDetail, SkillsFlags } from "@/types";
import { skillLatestVersion } from "@/types";

export const API_BASE =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_API_URL : undefined) ||
  "http://localhost:8000/api/v1";

const MOCK_MODE =
  ((typeof import.meta !== "undefined" ? import.meta.env?.VITE_MOCK_MODE : undefined) ||
    (typeof process !== "undefined" ? process.env?.VITE_MOCK_MODE : undefined)) === "true";

/**
 * Read against gx-backend, usable from a loader or the browser. Feature flags are
 * resolved per user, so a loader must hand in the request's Cookie header — server-side
 * fetch has no cookie jar, and without it every SSR read is anonymous.
 */
async function bxRead(path: string, cookie?: string | null): Promise<Response | null> {
  if (MOCK_MODE) {
    const mocked = mockBxApi(path);
    if (mocked) return mocked;
  }
  try {
    return await fetch(`${API_BASE}/bx${path}`, {
      credentials: "include",
      headers: cookie ? { cookie } : undefined,
    });
  } catch {
    return null;
  }
}

/** A flag we cannot read counts as off — a failed fetch closes the surface, never opens it. */
export async function fetchSkillsFlags(cookie?: string | null): Promise<SkillsFlags> {
  const res = await bxRead("/me", cookie);
  if (!res || !res.ok) return { marketplaceEnabled: false, publishEnabled: false };
  try {
    const data = await res.json();
    return {
      marketplaceEnabled: data?.flags?.skills_marketplace_enabled === true,
      publishEnabled: data?.flags?.skills_publish_enabled === true,
    };
  } catch {
    return { marketplaceEnabled: false, publishEnabled: false };
  }
}

export interface SkillsQuery {
  q?: string;
  tag?: string;
  sort?: "installs" | "new";
  limit?: number;
  offset?: number;
}

export function skillsQueryString({ q, tag, sort, limit, offset }: SkillsQuery): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  if (sort) params.set("sort", sort);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** The backend validator caps `limit` at 100; anything higher is a 400. */
export const SKILLS_PAGE_LIMIT = 100;

const MAX_REGISTRY_PAGES = 20;

/** `ok: false` is an upstream failure, which callers must not show as an empty registry. */
export interface SkillsResult {
  ok: boolean;
  skills: Skill[];
}

export async function fetchSkills(query: SkillsQuery = {}, cookie?: string | null): Promise<SkillsResult> {
  const res = await bxRead(`/skills${skillsQueryString(query)}`, cookie);
  if (!res || !res.ok) return { ok: false, skills: [] };
  try {
    const data = await res.json();
    return { ok: true, skills: Array.isArray(data?.skills) ? data.skills : [] };
  } catch {
    return { ok: false, skills: [] };
  }
}

/** Walks the registry a page at a time, stopping at MAX_REGISTRY_PAGES so it can never hang. */
export async function fetchAllSkills(
  query: Omit<SkillsQuery, "limit" | "offset"> = {},
  cookie?: string | null
): Promise<SkillsResult> {
  const skills: Skill[] = [];
  for (let page = 0; page < MAX_REGISTRY_PAGES; page++) {
    const result = await fetchSkills(
      { ...query, limit: SKILLS_PAGE_LIMIT, offset: page * SKILLS_PAGE_LIMIT },
      cookie
    );
    if (!result.ok) return { ok: false, skills: [] };
    skills.push(...result.skills);
    if (result.skills.length < SKILLS_PAGE_LIMIT) break;
  }
  return { ok: true, skills };
}

export async function fetchSkillDetail(slug: string, cookie?: string | null): Promise<SkillDetail | null> {
  const res = await bxRead(`/skills/${encodeURIComponent(slug)}`, cookie);
  if (!res || !res.ok) return null;
  try {
    const data = await res.json();
    if (!data?.skill) return null;
    return {
      skill: data.skill,
      versions: Array.isArray(data.versions) ? data.versions : [],
      skill_md: typeof data.skill_md === "string" ? data.skill_md : "",
      files: Array.isArray(data.files) ? data.files : [],
    };
  } catch {
    return null;
  }
}

export const DISCOVERY_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

export interface DiscoveryEntry {
  name: string;
  description: string;
  type: "archive";
  url: string;
  digest: string;
}

/**
 * The well-known index the `npx skills` CLI reads. Skills with no installable version are skipped.
 * `url` must be absolute: the CLI resolves it against this origin, which does not serve `/api/v1`.
 */
export function buildDiscoveryIndex(
  skills: Skill[],
  apiBase: string = API_BASE
): { $schema: string; skills: DiscoveryEntry[] } {
  const base = apiBase.replace(/\/+$/, "");
  const entries: DiscoveryEntry[] = [];
  for (const skill of skills) {
    const latest = skillLatestVersion(skill);
    if (!latest?.version || !latest.sha256) continue;
    entries.push({
      name: skill.slug,
      description: skill.description || "",
      type: "archive",
      url: `${base}/bx/skills/${skill.slug}/download?version=${encodeURIComponent(latest.version)}`,
      digest: `sha256:${latest.sha256}`,
    });
  }
  return { $schema: DISCOVERY_SCHEMA, skills: entries };
}
