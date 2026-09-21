import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import type { MetaFunction } from "react-router";
import { C, T, type Skill } from "@/types";
import { fetchSkills, fetchSkillsFlags, SKILLS_PAGE_LIMIT } from "@/lib/skills-api";
import { BUNDLE_SKILLS, matchesBundleSkill } from "@/lib/skills-bundle";
import { useResponsive } from "@/hooks/useMediaQuery";
import SkillBundleStrip from "@/components/SkillBundleStrip";
import SkillInstallCommand from "@/components/SkillInstallCommand";
import SkillRow from "@/components/SkillRow";

const DESCRIPTION =
  "Agent skills built by GrowthX members. Install one into Claude or Codex with the npx skills command you already use.";

export const meta: MetaFunction = () => [
  { title: "Skills — Built at GrowthX" },
  { name: "description", content: DESCRIPTION },
  { property: "og:title", content: "Skills — Built at GrowthX" },
  { property: "og:description", content: DESCRIPTION },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "Skills — Built at GrowthX" },
  { name: "twitter:description", content: DESCRIPTION },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/skills" },
];

export async function loader() {
  const flags = await fetchSkillsFlags();
  if (!flags.marketplaceEnabled) throw new Response("Not Found", { status: 404 });

  const registry = await fetchSkills({ sort: "installs", limit: SKILLS_PAGE_LIMIT });
  return { skills: registry.skills, loadFailed: !registry.ok, publishEnabled: flags.publishEnabled };
}

type SortKey = "installs" | "new";

export default function SkillsIndexPage() {
  const { skills: initialSkills, loadFailed, publishEnabled } = useLoaderData<typeof loader>();
  const { isMobile, isTablet } = useResponsive();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("installs");
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [failed, setFailed] = useState(loadFailed);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Pills come off the unfiltered first load so the set does not shrink as you filter.
  const allTags = useMemo(() => {
    const seen = new Set<string>();
    for (const skill of initialSkills) for (const t of skill.tags || []) seen.add(t);
    return Array.from(seen).sort();
  }, [initialSkills]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery && !tag && sort === "installs") {
      setSkills(initialSkills);
      setFailed(loadFailed);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSkills({
      q: debouncedQuery || undefined,
      tag: tag || undefined,
      sort,
      limit: SKILLS_PAGE_LIMIT,
    })
      .then((result) => {
        if (cancelled) return;
        setFailed(!result.ok);
        setSkills(result.skills);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, tag, sort, initialSkills, loadFailed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const bundleMatches = BUNDLE_SKILLS.filter((s) => matchesBundleSkill(s, debouncedQuery));

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile || isTablet ? "0" : "0 32px" }}>
        <main
          className="responsive-main"
          style={{ padding: isMobile ? "20px 16px 80px" : isTablet ? "32px 32px 100px" : "32px 0 100px" }}
        >
          <div style={{ padding: "8px 0 24px" }}>
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontSize: isMobile ? T.headingLg : T.pageTitle,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
                color: C.text,
              }}
            >
              Skills
            </h1>
            <p style={{ margin: 0, color: C.textSec, fontSize: T.body, maxWidth: "56ch" }}>
              Agent skills built by GrowthX members. Install one into Claude or Codex with the same{" "}
              <code style={{ fontFamily: "var(--mono)", fontSize: T.bodySm }}>npx skills</code> command you
              already use — no login, no new tool.
            </p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <SkillInstallCommand command="npx skills add built.growthx.club --list" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              margin: "8px 0 16px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want the agent to be better at?"
              aria-label="Search skills"
              style={{
                border: 0,
                outline: 0,
                background: "transparent",
                color: C.text,
                fontFamily: "var(--sans)",
                fontSize: T.body,
                width: "100%",
              }}
            />
            <kbd
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.badge,
                color: C.textMute,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: "2px 6px",
                flexShrink: 0,
              }}
            >
              /
            </kbd>
          </div>

          {allTags.length > 0 && (
            <div className="filter-pills-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
              {[null, ...allTags].map((t) => {
                const active = tag === t;
                return (
                  <button
                    key={t ?? "all"}
                    onClick={() => setTag(t)}
                    style={{
                      flex: "none",
                      fontFamily: "var(--mono)",
                      fontSize: T.badge,
                      letterSpacing: "0.04em",
                      padding: "6px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                      border: `1px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accent : C.surface,
                      color: active ? C.accentFg : C.textSec,
                    }}
                  >
                    {t ?? "All"}
                  </button>
                );
              })}
            </div>
          )}

          <SkillBundleStrip skills={bundleMatches} searching={!!debouncedQuery} />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              padding: "22px 0 10px",
              borderBottom: `1px solid ${C.borderLight}`,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.badge,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.textMute,
              }}
            >
              From the community &middot; {skills.length} {skills.length === 1 ? "skill" : "skills"}
            </span>
            <div style={{ display: "flex", gap: 14 }}>
              {([["installs", "Most installed"], ["new", "Recently updated"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  style={{
                    fontSize: T.label,
                    color: sort === key ? C.text : C.textMute,
                    fontWeight: sort === key ? 500 : 400,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--sans)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
            {failed ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: C.errorText, fontSize: T.bodySm }}>
                Couldn&rsquo;t reach the skills registry. Reload to try again.
              </div>
            ) : skills.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: C.textMute, fontSize: T.bodySm }}>
                {debouncedQuery || tag
                  ? "Nothing in the registry matches that yet."
                  : "No one has published to the registry yet."}
              </div>
            ) : (
              skills.map((skill) => <SkillRow key={skill._id || skill.slug} skill={skill} />)
            )}
          </div>

          {publishEnabled && (
            <div
              style={{
                marginTop: 40,
                border: `1px dashed ${C.border}`,
                borderRadius: 14,
                padding: 24,
                background: C.surfaceWarm,
              }}
            >
              <h3 style={{ fontFamily: "var(--serif)", fontSize: T.title, fontWeight: 600, margin: "0 0 6px", color: C.text }}>
                Built one yourself?
              </h3>
              <p style={{ margin: "0 0 14px", color: C.textSec, fontSize: T.bodySm }}>
                Publish it from the terminal. Your agent reads the folder, you confirm, it&rsquo;s live — and
                world-readable to anyone with the install command.
              </p>
              <SkillInstallCommand command="/growthx-skills publish" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
