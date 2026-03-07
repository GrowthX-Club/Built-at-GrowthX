import { describe, it, expect } from "vitest";
import { normalizeProject } from "../types";

describe("normalizeProject", () => {
  const baseProject = {
    _id: "p1",
    name: "Test Project",
    tagline: "A test",
    description: "{}",
    builder: { name: "Builder", initials: "B", role: "member", city: "NYC" },
    collabs: [],
    weighted: 10,
    raw: 5,
    category: "AI",
    stack: ["React"],
    buildathon: null,
    heroColor: "#2255CC",
    featured: false,
    date: "2025-01-01",
    gallery: [],
    enabled: true,
  };

  it("should include isDraft field defaulting to false", () => {
    const p = normalizeProject(baseProject);
    expect(p.isDraft).toBe(false);
  });

  it("should normalize isDraft from backend data", () => {
    const p = normalizeProject({ ...baseProject, isDraft: true });
    expect(p.isDraft).toBe(true);
  });

  it("should normalize is_draft (snake_case) from backend", () => {
    const p = normalizeProject({ ...baseProject, is_draft: true });
    expect(p.isDraft).toBe(true);
  });

  it("should include buildProcess field", () => {
    const p = normalizeProject(baseProject);
    expect(p.buildProcess).toBeUndefined();
  });

  it("should normalize buildProcess from backend data", () => {
    const bp = '{"root":{"children":[]}}';
    const p = normalizeProject({ ...baseProject, buildProcess: bp });
    expect(p.buildProcess).toBe(bp);
  });

  it("should normalize build_process (snake_case) from backend", () => {
    const bp = '{"root":{"children":[]}}';
    const p = normalizeProject({ ...baseProject, build_process: bp });
    expect(p.buildProcess).toBe(bp);
  });

  it("should keep url as optional", () => {
    const withUrl = normalizeProject({ ...baseProject, url: "https://example.com" });
    expect(withUrl.url).toBe("https://example.com");

    const noUrl = normalizeProject(baseProject);
    expect(noUrl.url).toBeUndefined();
  });

  it("should preserve enabled field", () => {
    const p = normalizeProject({ ...baseProject, enabled: false });
    expect(p.enabled).toBe(false);
  });
});

describe("Draft mode filtering logic", () => {
  const makeProject = (overrides: Record<string, unknown> = {}) =>
    normalizeProject({
      _id: "p1",
      name: "Test",
      tagline: "Test",
      description: "{}",
      builder: { name: "B", initials: "B", role: "member", city: "NYC" },
      collabs: [],
      weighted: 0,
      raw: 0,
      category: "AI",
      stack: [],
      buildathon: null,
      heroColor: "#2255CC",
      featured: false,
      date: "2025-01-01",
      gallery: [],
      enabled: true,
      ...overrides,
    });

  it("should filter out draft projects from public listing", () => {
    const projects = [
      makeProject({ _id: "1", isDraft: false }),
      makeProject({ _id: "2", isDraft: true }),
      makeProject({ _id: "3" }), // defaults to false
    ];

    const publicProjects = projects.filter((p) => p.enabled !== false && !p.isDraft);
    expect(publicProjects).toHaveLength(2);
    expect(publicProjects.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("should filter out disabled projects", () => {
    const projects = [
      makeProject({ _id: "1", enabled: true }),
      makeProject({ _id: "2", enabled: false }),
    ];

    const publicProjects = projects.filter((p) => p.enabled !== false && !p.isDraft);
    expect(publicProjects).toHaveLength(1);
  });

  it("should filter out both draft and disabled projects", () => {
    const projects = [
      makeProject({ _id: "1", enabled: true, isDraft: false }),
      makeProject({ _id: "2", enabled: false, isDraft: false }),
      makeProject({ _id: "3", enabled: true, isDraft: true }),
      makeProject({ _id: "4", enabled: false, isDraft: true }),
    ];

    const publicProjects = projects.filter((p) => p.enabled !== false && !p.isDraft);
    expect(publicProjects).toHaveLength(1);
    expect(publicProjects[0].id).toBe("1");
  });
});

describe("URL validation logic", () => {
  const urlPattern = /^https?:\/\/.+/;

  it("should accept valid HTTP URLs", () => {
    expect(urlPattern.test("https://example.com")).toBe(true);
    expect(urlPattern.test("http://example.com")).toBe(true);
    expect(urlPattern.test("https://my-project.vercel.app")).toBe(true);
  });

  it("should reject invalid URLs", () => {
    expect(urlPattern.test("")).toBe(false);
    expect(urlPattern.test("example.com")).toBe(false);
    expect(urlPattern.test("ftp://example.com")).toBe(false);
    expect(urlPattern.test("not a url")).toBe(false);
  });

  describe("submit validation", () => {
    function validateSubmit(data: { url: string; isDraft: boolean }) {
      const errors: string[] = [];
      const savingAsDraft = data.isDraft;

      if (!savingAsDraft) {
        if (!data.url?.trim()) {
          errors.push("Product URL is required. Save as draft if you don't have one yet.");
        } else if (!urlPattern.test(data.url.trim())) {
          errors.push("Please enter a valid URL starting with http:// or https://");
        }
      } else if (data.url?.trim() && !urlPattern.test(data.url.trim())) {
        errors.push("Please enter a valid URL starting with http:// or https://");
      }
      return errors;
    }

    it("should require URL when not saving as draft", () => {
      const errors = validateSubmit({ url: "", isDraft: false });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("required");
    });

    it("should validate URL format when not saving as draft", () => {
      const errors = validateSubmit({ url: "invalid", isDraft: false });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("valid URL");
    });

    it("should pass with valid URL when not saving as draft", () => {
      const errors = validateSubmit({ url: "https://example.com", isDraft: false });
      expect(errors).toHaveLength(0);
    });

    it("should allow empty URL when saving as draft", () => {
      const errors = validateSubmit({ url: "", isDraft: true });
      expect(errors).toHaveLength(0);
    });

    it("should still validate URL format when saving as draft with a URL", () => {
      const errors = validateSubmit({ url: "invalid", isDraft: true });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("valid URL");
    });

    it("should pass with valid URL when saving as draft", () => {
      const errors = validateSubmit({ url: "https://example.com", isDraft: true });
      expect(errors).toHaveLength(0);
    });
  });
});
