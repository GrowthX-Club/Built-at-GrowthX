import { mockBxApi } from "./mock-api/index";
import type { Skill, SkillDetail, SkillsFlags } from "@/types";
import { skillLatestVersion } from "@/types";

const API_BASE =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined) ||
  (typeof process !== "undefined" ? process.env?.VITE_API_URL : undefined) ||
  "http://localhost:8000/api/v1";

const MOCK_MODE =
  ((typeof import.meta !== "undefined" ? import.meta.env?.VITE_MOCK_MODE : undefined) ||
    (typeof process !== "undefined" ? process.env?.VITE_MOCK_MODE : undefined)) === "true";

/** Unauthenticated read against gx-backend, usable from a loader or the browser. */
async function bxRead(path: string): Promise<Response | null> {
  if (MOCK_MODE) {
    const mocked = mockBxApi(path);
    if (mocked) return mocked;
  }
  try {
    return await fetch(`${API_BASE}/bx${path}`);
  } catch {
    return null;
  }
}

/** A flag we cannot read counts as off — a failed fetch closes the surface, never opens it. */
export async function fetchSkillsFlags(): Promise<SkillsFlags> {
  const res = await bxRead("/me");
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

export async function fetchSkills(query: SkillsQuery = {}): Promise<Skill[]> {
  const res = await bxRead(`/skills${skillsQueryString(query)}`);
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data?.skills) ? data.skills : [];
  } catch {
    return [];
  }
}

export async function fetchSkillDetail(slug: string): Promise<SkillDetail | null> {
  const res = await bxRead(`/skills/${encodeURIComponent(slug)}`);
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

/** The well-known index the `npx skills` CLI reads. Skills with no installable version are skipped. */
export function buildDiscoveryIndex(skills: Skill[]): { $schema: string; skills: DiscoveryEntry[] } {
  const entries: DiscoveryEntry[] = [];
  for (const skill of skills) {
    const latest = skillLatestVersion(skill);
    if (!latest?.version || !latest.sha256) continue;
    entries.push({
      name: skill.slug,
      description: skill.description || "",
      type: "archive",
      url: `/api/v1/bx/skills/${skill.slug}/download?version=${encodeURIComponent(latest.version)}`,
      digest: `sha256:${latest.sha256}`,
    });
  }
  return { $schema: DISCOVERY_SCHEMA, skills: entries };
}
