import { describe, it, expect } from "vitest";
import { buildDiscoveryIndex, DISCOVERY_SCHEMA } from "../lib/skills-api";
import { parseSkillMarkdown } from "../lib/skill-markdown";
import { BUNDLE_SKILLS } from "../lib/skills-bundle";
import type { Skill } from "../types";

const baseSkill: Skill = {
  _id: "s1",
  slug: "grill-me",
  name: "grill-me",
  title: "Grill me",
  description: "Interviews you until the plan is clear.",
  tags: ["planning"],
  install_count: 412,
  tier: "prompt-only",
  license: "MIT",
  source_url: null,
  publisher: { name: "GrowthX" },
  latest_version: {
    version: "1.3.0",
    sha256: "9f2c8a1d4e6b0c3f5a7d9e1b2c4f6a8d0e2b4c6f8a0d2e4b6c8f0a2d4e6b8c41",
    size_bytes: 9830,
    tier: "prompt-only",
  },
  created_at: "2026-08-02T10:00:00.000Z",
  updated_at: "2026-09-17T10:00:00.000Z",
};

describe("buildDiscoveryIndex", () => {
  it("emits the 0.2.0 discovery shape", () => {
    const index = buildDiscoveryIndex([baseSkill]);
    expect(index.$schema).toBe(DISCOVERY_SCHEMA);
    expect(index.skills).toEqual([
      {
        name: "grill-me",
        description: "Interviews you until the plan is clear.",
        type: "archive",
        url: "/api/v1/bx/skills/grill-me/download?version=1.3.0",
        digest: `sha256:${baseSkill.latest_version && typeof baseSkill.latest_version === "object" ? baseSkill.latest_version.sha256 : ""}`,
      },
    ]);
  });

  it("skips a skill with no installable version", () => {
    const yanked: Skill = { ...baseSkill, slug: "gone", latest_version: null };
    expect(buildDiscoveryIndex([yanked, baseSkill]).skills.map(s => s.name)).toEqual(["grill-me"]);
  });

  it("skips a latest_version that arrived unpopulated", () => {
    const unpopulated: Skill = { ...baseSkill, latest_version: "652f00000000000000000001" };
    expect(buildDiscoveryIndex([unpopulated]).skills).toHaveLength(0);
  });

  it("never carries bundle skills — they hold no registry slug", () => {
    const names = buildDiscoveryIndex([baseSkill]).skills.map(s => s.name);
    const vendored = BUNDLE_SKILLS.filter(b => !b.ours).map(b => b.name);
    expect(names.filter(n => vendored.includes(n))).toEqual([]);
  });
});

describe("parseSkillMarkdown", () => {
  it("splits frontmatter from the body", () => {
    const parsed = parseSkillMarkdown("---\nname: grill-me\ndescription: Ask first\n---\n\n# Grill me\n\nBody.");
    expect(parsed.frontmatter).toEqual([
      { key: "name", value: "grill-me" },
      { key: "description", value: "Ask first" },
    ]);
    expect(parsed.blocks[0]).toMatchObject({ type: "heading", level: 1 });
  });

  it("keeps a fenced block verbatim rather than parsing its contents", () => {
    const parsed = parseSkillMarkdown("```\n# not a heading\n- not a list\n```");
    expect(parsed.blocks).toEqual([{ type: "code", value: "# not a heading\n- not a list" }]);
  });

  it("renders no raw HTML token for an injected tag", () => {
    const parsed = parseSkillMarkdown("<script>alert(1)</script>");
    expect(parsed.blocks).toEqual([
      { type: "paragraph", content: [{ type: "text", value: "<script>alert(1)</script>" }] },
    ]);
  });

  it("groups consecutive bullets into one list", () => {
    const parsed = parseSkillMarkdown("- one\n- two\n- three");
    expect(parsed.blocks).toHaveLength(1);
    expect(parsed.blocks[0]).toMatchObject({ type: "list", ordered: false });
  });
});

describe("BUNDLE_SKILLS", () => {
  it("is the eleven-skill bundle, three of them ours", () => {
    expect(BUNDLE_SKILLS).toHaveLength(11);
    expect(BUNDLE_SKILLS.filter(s => s.ours).map(s => s.name)).toEqual([
      "grill-me",
      "art-direction",
      "checkpoint",
    ]);
  });
});
