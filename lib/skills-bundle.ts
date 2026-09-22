import type { BundleSkill } from "@/types";

/**
 * The Build Sprint bundle. These are links out, not registry rows — the eight
 * vendored ones are deliberately never published, so none of them holds a slug.
 * Upstreams track `GrowthX-Club/build-sprint-skills/SOURCES.md`.
 */
export const BUNDLE_REPO = "GrowthX-Club/build-sprint-skills";

export const BUNDLE_SKILLS: BundleSkill[] = [
  {
    name: "grill-me",
    description: "Interviews you until the plan is clear, before any code.",
    upstream: "GrowthX",
    upstreamUrl: `https://github.com/${BUNDLE_REPO}/tree/main/skills/grill-me`,
    ours: true,
  },
  {
    name: "art-direction",
    description: "Gives the project one visual point of view before it generates a single image asset.",
    upstream: "GrowthX",
    upstreamUrl: `https://github.com/${BUNDLE_REPO}/tree/main/skills/art-direction`,
    ours: true,
  },
  {
    name: "checkpoint",
    description: "Saves a working state you can get back to when the next hour goes sideways.",
    upstream: "GrowthX",
    upstreamUrl: `https://github.com/${BUNDLE_REPO}/tree/main/skills/checkpoint`,
    ours: true,
  },
  {
    name: "impeccable",
    description: "A menu of UI passes against your live app.",
    upstream: "pbakaus/impeccable",
    upstreamUrl: "https://github.com/pbakaus/impeccable",
    ours: false,
  },
  {
    name: "frontend-design",
    description: "Tokens, type scale, spacing, component patterns.",
    upstream: "anthropics/skills",
    upstreamUrl: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    ours: false,
  },
  {
    name: "vercel-react-best-practices",
    description: "React and Next.js performance rules from Vercel engineering.",
    upstream: "vercel-labs/agent-skills",
    upstreamUrl: "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices",
    ours: false,
  },
  {
    name: "convex-expert",
    description: "Schemas, queries, mutations the way Convex wants them.",
    upstream: "get-convex/agent-skills",
    upstreamUrl: "https://github.com/get-convex/agent-skills/tree/main/skills/convex-expert",
    ours: false,
  },
  {
    name: "convex-auth",
    description: "Passkeys, OAuth and the auth.config.ts wiring for a Convex app.",
    upstream: "get-convex/agent-skills",
    upstreamUrl: "https://github.com/get-convex/agent-skills/tree/main/skills/convex-auth",
    ours: false,
  },
  {
    name: "convex-agent",
    description: "An AI agent or RAG backend on Convex, with @convex-dev/agent.",
    upstream: "get-convex/agent-skills",
    upstreamUrl: "https://github.com/get-convex/agent-skills/tree/main/skills/convex-agent",
    ours: false,
  },
  {
    name: "copywriting",
    description: "Landing page, pricing page, headlines.",
    upstream: "coreyhaines31/marketingskills",
    upstreamUrl: "https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting",
    ours: false,
  },
  {
    name: "agentation",
    description: "A visual feedback toolbar dropped into a Next.js project.",
    upstream: "benjitaylor/agentation",
    upstreamUrl: "https://github.com/benjitaylor/agentation/tree/main/skills/agentation",
    ours: false,
  },
];

export function bundleInstallCommand(name: string): string {
  return `npx skills add ${BUNDLE_REPO} --skill ${name}`;
}

export function matchesBundleSkill(skill: BundleSkill, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return skill.name.toLowerCase().includes(q) || skill.description.toLowerCase().includes(q);
}
