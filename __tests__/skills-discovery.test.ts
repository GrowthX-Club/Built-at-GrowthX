import { describe, it, expect, vi, afterEach } from "vitest";
import {
  API_BASE,
  buildDiscoveryIndex,
  DISCOVERY_SCHEMA,
  fetchAllSkills,
  SKILLS_PAGE_LIMIT,
} from "../lib/skills-api";
import { parseInline, parseSkillMarkdown, safeLinkHref } from "../lib/skill-markdown";
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
    const index = buildDiscoveryIndex([baseSkill], "https://api.example.com/api/v1");
    expect(index.$schema).toBe(DISCOVERY_SCHEMA);
    expect(index.skills).toEqual([
      {
        name: "grill-me",
        description: "Interviews you until the plan is clear.",
        type: "archive",
        url: "https://api.example.com/api/v1/bx/skills/grill-me/download?version=1.3.0",
        digest: `sha256:${baseSkill.latest_version && typeof baseSkill.latest_version === "object" ? baseSkill.latest_version.sha256 : ""}`,
      },
    ]);
  });

  it("emits an absolute download url, because the CLI resolves it against this origin", () => {
    const [entry] = buildDiscoveryIndex([baseSkill]).skills;
    expect(entry.url.startsWith("/")).toBe(false);
    expect(entry.url).toBe(`${API_BASE}/bx/skills/grill-me/download?version=1.3.0`);
    expect(new URL(entry.url).pathname).toBe("/api/v1/bx/skills/grill-me/download");
  });

  it("does not double a slash when the base carries a trailing one", () => {
    const [entry] = buildDiscoveryIndex([baseSkill], "https://api.example.com/api/v1/").skills;
    expect(entry.url).toBe("https://api.example.com/api/v1/bx/skills/grill-me/download?version=1.3.0");
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

describe("fetchAllSkills", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const page = (count: number, offset: number) =>
    Array.from({ length: count }, (_, i) => ({ ...baseSkill, _id: `s${offset + i}`, slug: `skill-${offset + i}` }));

  it("never asks for more than the backend's limit of 100", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      seen.push(url);
      return new Response(JSON.stringify({ success: true, skills: [] }), { status: 200 });
    });

    await fetchAllSkills({ sort: "installs" });

    expect(SKILLS_PAGE_LIMIT).toBe(100);
    for (const url of seen) {
      expect(Number(new URL(url, "https://x.test").searchParams.get("limit"))).toBeLessThanOrEqual(100);
    }
  });

  it("pages past 100 until a short page ends it", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      const offset = Number(new URL(url, "https://x.test").searchParams.get("offset") || "0");
      const skills = offset === 0 ? page(100, 0) : page(7, 100);
      return new Response(JSON.stringify({ success: true, skills }), { status: 200 });
    });

    const result = await fetchAllSkills();
    expect(result.ok).toBe(true);
    expect(result.skills).toHaveLength(107);
    expect(result.skills[100].slug).toBe("skill-100");
  });

  it("reports a failed page as a failure, not an empty registry", async () => {
    vi.stubGlobal("fetch", async () => new Response("Bad Request", { status: 400 }));

    const result = await fetchAllSkills();
    expect(result.ok).toBe(false);
    expect(result.skills).toEqual([]);
  });

  it("stops at a page ceiling rather than walking forever", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", async () => {
      calls++;
      return new Response(JSON.stringify({ success: true, skills: page(100, 0) }), { status: 200 });
    });

    await fetchAllSkills();
    expect(calls).toBeLessThanOrEqual(20);
  });
});

describe("safeLinkHref", () => {
  it("keeps http, https and mailto", () => {
    expect(safeLinkHref("https://growthx.club/a")).toBe("https://growthx.club/a");
    expect(safeLinkHref("http://example.com/")).toBe("http://example.com/");
    expect(safeLinkHref("mailto:support@growthx.club")).toBe("mailto:support@growthx.club");
  });

  it("rejects javascript:, including the whitespace-obfuscated form", () => {
    expect(safeLinkHref("javascript:alert(1)")).toBeNull();
    expect(safeLinkHref("JavaScript:alert(1)")).toBeNull();
    expect(safeLinkHref("java\nscript:alert(1)")).toBeNull();
    expect(safeLinkHref("  javascript:alert(1)  ")).toBeNull();
    expect(safeLinkHref("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeLinkHref("vbscript:msgbox(1)")).toBeNull();
  });

  it("rejects relative hrefs, which point at bundle files this origin does not serve", () => {
    expect(safeLinkHref("scripts/run.sh")).toBeNull();
    expect(safeLinkHref("#anchor")).toBeNull();
    expect(safeLinkHref("")).toBeNull();
  });
});

describe("parseInline link safety", () => {
  it("renders a javascript: link as plain text, never as an anchor", () => {
    const tokens = parseInline("read [the docs](javascript:alert) first");
    expect(tokens.some((t) => t.type === "link")).toBe(false);
    expect(tokens.map((t) => t.value).join("")).toBe("read the docs first");
  });

  it("keeps a normal https link as a link", () => {
    const tokens = parseInline("see [docs](https://growthx.club/docs)");
    expect(tokens).toContainEqual({ type: "link", value: "docs", href: "https://growthx.club/docs" });
  });
});
