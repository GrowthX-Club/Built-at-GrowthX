import { MockRoute, ok } from "./types";

const PUBLISHER = {
  _id: "mock-user-001",
  name: "Demo User",
  username: "demo_user",
  display_picture: "",
};

const GROWTHX = {
  _id: "mock-user-gx",
  name: "GrowthX",
  username: "growthx",
  display_picture: "",
};

const SKILL_MD = `---
name: grill-me
description: Interview the user until the plan is clear, before any code gets written.
---

# Grill me

Interview the user relentlessly until you both understand exactly what they are
building. Do not write code or a plan until they confirm the interview is done.

## How to ask

- One question at a time. Wait for the answer before asking the next.
- Give your recommended answer with every question, so they can just say "yes".
- Plain words. If you use a technical term, explain it in the same sentence.
`;

const SHIP_CHECK_MD = `---
name: ship-check
description: Walk the golden path logged-out on a phone viewport before you call anything live.
---

# Ship check

Run \`bash scripts/ship-check.sh\` against the deployed URL, then read the report.
`;

const mockSkills = [
  {
    _id: "mock-skill-001",
    slug: "grill-me",
    name: "grill-me",
    title: "Grill me",
    description: "Interviews you until the plan is clear, before any code gets written.",
    tags: ["planning", "writing"],
    install_count: 412,
    tier: "prompt-only" as const,
    license: "MIT",
    source_url: null,
    enabled: true,
    publisher: GROWTHX,
    latest_version: {
      _id: "mock-version-001",
      version: "1.3.0",
      sha256: "9f2c8a1d4e6b0c3f5a7d9e1b2c4f6a8d0e2b4c6f8a0d2e4b6c8f0a2d4e6b8c41",
      size_bytes: 9830,
      tier: "prompt-only" as const,
    },
    created_at: "2026-08-02T10:00:00.000Z",
    updated_at: "2026-09-17T10:00:00.000Z",
  },
  {
    _id: "mock-skill-002",
    slug: "ship-check",
    name: "ship-check",
    title: "Ship check",
    description: "Walks the golden path logged-out on a phone viewport before you call anything live.",
    tags: ["review", "ops"],
    install_count: 71,
    tier: "has-executables" as const,
    license: null,
    source_url: "https://github.com/example/ship-check",
    enabled: true,
    publisher: PUBLISHER,
    latest_version: {
      _id: "mock-version-002",
      version: "0.2.0",
      sha256: "1d07b3c5e7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7c8e2",
      size_bytes: 41200,
      tier: "has-executables" as const,
    },
    created_at: "2026-09-01T10:00:00.000Z",
    updated_at: "2026-09-19T10:00:00.000Z",
  },
];

const mockVersions: Record<string, Array<Record<string, unknown>>> = {
  "grill-me": [
    {
      version: "1.3.0",
      sha256: mockSkills[0].latest_version.sha256,
      size_bytes: 9830,
      tier: "prompt-only",
      yanked: false,
      files: [
        { path: "SKILL.md", size: 7270, executable: false },
        { path: "agents/openai.yaml", size: 2560, executable: false },
      ],
      created_at: "2026-09-17T10:00:00.000Z",
    },
    {
      version: "1.2.0",
      sha256: "77ba2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c0f31",
      size_bytes: 9100,
      tier: "prompt-only",
      yanked: false,
      files: [{ path: "SKILL.md", size: 7000, executable: false }],
      created_at: "2026-08-18T10:00:00.000Z",
    },
  ],
  "ship-check": [
    {
      version: "0.2.0",
      sha256: mockSkills[1].latest_version.sha256,
      size_bytes: 41200,
      tier: "has-executables",
      yanked: false,
      files: [
        { path: "SKILL.md", size: 5400, executable: false },
        { path: "scripts/ship-check.sh", size: 3100, executable: true },
        { path: "scripts/viewport.js", size: 32700, executable: true },
      ],
      created_at: "2026-09-19T10:00:00.000Z",
    },
  ],
};

const SKILL_MD_BY_SLUG: Record<string, string> = {
  "grill-me": SKILL_MD,
  "ship-check": SHIP_CHECK_MD,
};

const routes: MockRoute[] = [
  {
    method: "GET",
    path: "/skills",
    description: "List/search the skills registry. Query: q, tag, sort=installs|new, limit, offset",
    auth: false,
    handler: ({ query }) => {
      const q = (query.get("q") || "").trim().toLowerCase();
      const tag = query.get("tag");
      const sort = query.get("sort") || "installs";
      const limit = parseInt(query.get("limit") || "50", 10);
      const offset = parseInt(query.get("offset") || "0", 10);

      let skills = [...mockSkills];
      if (q) {
        skills = skills.filter(
          (s) =>
            s.slug.includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.includes(q))
        );
      }
      if (tag) skills = skills.filter((s) => s.tags.includes(tag));
      skills.sort((a, b) =>
        sort === "new"
          ? new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          : b.install_count - a.install_count
      );

      return ok({ success: true, skills: skills.slice(offset, offset + limit) });
    },
  },

  {
    method: "GET",
    path: "/skills/:slug",
    description: "Skill detail: the skill, every version, the latest SKILL.md and file tree",
    auth: false,
    handler: ({ params }) => {
      const skill = mockSkills.find((s) => s.slug === params.slug);
      if (!skill) return { status: 404, data: { message: "Skill not found" } };
      const versions = mockVersions[skill.slug] || [];
      return ok({
        success: true,
        skill,
        versions,
        skill_md: SKILL_MD_BY_SLUG[skill.slug] || "",
        files: (versions[0]?.files as unknown[]) || [],
      });
    },
  },

  {
    method: "GET",
    path: "/skills/:slug/versions/:version",
    description: "One version's manifest plus its SKILL.md",
    auth: false,
    handler: ({ params }) => {
      const versions = mockVersions[params.slug] || [];
      const version = versions.find((v) => v.version === params.version);
      if (!version) return { status: 404, data: { message: "Version not found" } };
      return ok({ success: true, version: { ...version, skill_md: SKILL_MD_BY_SLUG[params.slug] || "" } });
    },
  },
];

export default routes;
