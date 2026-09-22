import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { C, T, skillPublisher, type SkillFile, type SkillVersion } from "@/types";
import { fetchSkillDetail, fetchSkillsFlags } from "@/lib/skills-api";
import { useResponsive } from "@/hooks/useMediaQuery";
import SkillGlyph from "@/components/SkillGlyph";
import SkillInstallCommand from "@/components/SkillInstallCommand";
import SkillMarkdown from "@/components/SkillMarkdown";

const REPORT_EMAIL = "support@growthx.club";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const cookie = request.headers.get("cookie");
  const flags = await fetchSkillsFlags(cookie);
  if (!flags.marketplaceEnabled) throw new Response("Not Found", { status: 404 });

  const detail = await fetchSkillDetail(params.slug!, cookie);
  if (!detail) throw new Response("Not Found", { status: 404 });
  return detail;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.skill) return [{ title: "Skill Not Found" }];
  const { skill } = data;
  const title = `${skill.slug} — Skills — Built at GrowthX`;
  return [
    { title },
    { name: "description", content: skill.description },
    { property: "og:title", content: title },
    { property: "og:description", content: skill.description },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: skill.description },
    {
      tagName: "link",
      rel: "canonical",
      href: `https://built.growthx.club/skills/${skill.slug}`,
    },
  ];
};

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "12px 22px 12px 0", marginRight: 22 }}>
      <dt
        style={{
          fontFamily: "var(--mono)",
          fontSize: T.badge - 1,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.textMute,
          margin: "0 0 3px",
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, fontSize: T.bodySm, fontWeight: 500, color: C.text }}>{children}</dd>
    </div>
  );
}

function SectionHeading({ title, side }: { title: string; side?: string }) {
  return (
    <h2
      style={{
        fontFamily: "var(--mono)",
        fontSize: T.badge,
        fontWeight: 500,
        letterSpacing: "0.11em",
        textTransform: "uppercase",
        color: C.textMute,
        margin: "0 0 12px",
        paddingBottom: 8,
        borderBottom: `1px solid ${C.borderLight}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
      }}
    >
      <span>{title}</span>
      {side && (
        <span style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)", fontSize: T.caption }}>
          {side}
        </span>
      )}
    </h2>
  );
}

function FileTree({ slug, files }: { slug: string; files: SkillFile[] }) {
  return (
    <div style={{ padding: "10px 8px", fontFamily: "var(--mono)", fontSize: T.label }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", color: C.text }}>
        <span>&#x25BE;</span>
        <span>{slug}/</span>
      </div>
      {files.map((file) => (
        <div
          key={file.path}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 14px",
            paddingLeft: 30 + 14,
            borderRadius: 7,
            color: C.textSec,
          }}
        >
          <span>{file.executable ? "▸" : "◻"}</span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: file.executable ? C.errorText : undefined,
            }}
          >
            {file.path}
          </span>
          {file.executable && (
            <span
              style={{
                fontSize: T.micro + 1,
                letterSpacing: "0.06em",
                padding: "1px 5px",
                borderRadius: 3,
                flexShrink: 0,
                background: C.errorSoft,
                color: C.errorText,
                border: `1px solid ${C.errorBorder}`,
              }}
            >
              exec
            </span>
          )}
          <span style={{ fontSize: T.badge, color: C.textMute, flexShrink: 0 }}>{formatBytes(file.size)}</span>
        </div>
      ))}
    </div>
  );
}

function pickLatest(versions: SkillVersion[]): SkillVersion | null {
  return versions.find((v) => !v.yanked) || versions[0] || null;
}

export default function SkillDetailPage() {
  const { skill, versions, skill_md, files } = useLoaderData<typeof loader>();
  const { isMobile, isTablet } = useResponsive();

  const publisher = skillPublisher(skill);
  const publisherName = publisher?.name || publisher?.username || "A GrowthX member";
  const latest = pickLatest(versions);
  const executables = files.filter((f) => f.executable);
  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const installCommand = `npx skills add built.growthx.club --skill ${skill.slug}`;

  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 } as const;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile || isTablet ? "0" : "0 32px" }}>
        <main
          className="responsive-main"
          style={{ padding: isMobile ? "0 16px 80px" : isTablet ? "0 32px 100px" : "0 0 100px" }}
        >
          <Link
            to="/skills"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--mono)",
              fontSize: T.badge,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.textMute,
              padding: "32px 0 20px",
              textDecoration: "none",
            }}
          >
            &larr; All skills
          </Link>

          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <SkillGlyph name={skill.slug} size={isMobile ? 48 : 60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: isMobile ? T.title : T.heading - 2,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  color: C.text,
                  overflowWrap: "anywhere",
                }}
              >
                {skill.slug}
              </h1>
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: T.subtitle,
                  color: C.textSec,
                  margin: "4px 0 0",
                  fontStyle: "italic",
                }}
              >
                {skill.description}
              </p>
            </div>
          </div>

          <dl
            style={{
              display: "flex",
              flexWrap: "wrap",
              margin: "22px 0 0",
              borderTop: `1px solid ${C.borderLight}`,
              borderBottom: `1px solid ${C.borderLight}`,
            }}
          >
            <MetaCell label="Publisher">{publisherName}</MetaCell>
            <MetaCell label="Installs">{skill.install_count}</MetaCell>
            <MetaCell label="Version">
              {latest ? `${latest.version} · ${formatDate(latest.created_at)}` : "—"}
            </MetaCell>
            <MetaCell label="Contents">
              <span style={{ color: skill.tier === "has-executables" ? C.errorText : C.green }}>
                {skill.tier === "has-executables" ? "Ships executables" : "Prompt only"}
              </span>
            </MetaCell>
            <MetaCell label="License">{skill.license || "Not declared"}</MetaCell>
          </dl>

          {executables.length > 0 && (
            <div
              style={{
                margin: "24px 0 0",
                border: `1px solid ${C.errorBorder}`,
                background: C.errorSoft,
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                gap: 12,
              }}
            >
              <span style={{ flexShrink: 0, color: C.errorText, fontSize: T.bodySm + 1, lineHeight: 1.4 }}>
                &#x25B2;
              </span>
              <div>
                <h4 style={{ margin: "0 0 3px", fontSize: T.bodySm, fontWeight: 700, color: C.errorText }}>
                  This skill ships {executables.length} executable{executables.length === 1 ? " file" : " files"}
                </h4>
                <p style={{ margin: 0, fontSize: T.label, color: C.textSec, lineHeight: 1.5 }}>
                  It can run commands on your machine when your agent invokes it. Nothing here is reviewed by
                  GrowthX before it goes live — read the SKILL.md and the file list below before you install.
                </p>
              </div>
            </div>
          )}

          <section style={{ marginTop: 36 }}>
            <SectionHeading title="SKILL.md" side="the whole thing. read it before you install it." />
            <div style={card}>
              <SkillMarkdown source={skill_md} />
            </div>
          </section>

          <section style={{ marginTop: 36 }}>
            <SectionHeading
              title="Files"
              side={`${files.length} ${files.length === 1 ? "file" : "files"} · ${formatBytes(totalBytes)}`}
            />
            <div style={card}>
              {files.length === 0 ? (
                <div style={{ padding: "18px 22px", color: C.textMute, fontSize: T.bodySm }}>
                  This version shipped no file manifest.
                </div>
              ) : (
                <FileTree slug={skill.slug} files={files} />
              )}
            </div>
          </section>

          <section style={{ marginTop: 36 }}>
            <SectionHeading title="Install" />
            <SkillInstallCommand command={installCommand} />
            <div style={{ marginTop: 8, fontSize: T.caption, color: C.textMute, lineHeight: 1.6 }}>
              Writes to <code style={{ fontFamily: "var(--mono)" }}>.claude/skills/{skill.slug}/</code> and{" "}
              <code style={{ fontFamily: "var(--mono)" }}>.agents/skills/{skill.slug}/</code>. Restart your
              session afterwards — skills only load at start.
            </div>
          </section>

          <section style={{ marginTop: 36 }}>
            <SectionHeading title="Versions" />
            <div style={card}>
              {versions.length === 0 ? (
                <div style={{ padding: "18px 22px", color: C.textMute, fontSize: T.bodySm }}>
                  No published versions.
                </div>
              ) : (
                versions.map((version, i) => (
                  <div
                    key={version.version}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      padding: "13px 18px",
                      borderBottom: i === versions.length - 1 ? "none" : `1px solid ${C.borderLight}`,
                      background: version.version === latest?.version ? C.surfaceWarm : "transparent",
                    }}
                  >
                    <span style={{ fontFamily: "var(--mono)", fontSize: T.label, fontWeight: 500, width: 58, flexShrink: 0, color: C.text }}>
                      {version.version}
                    </span>
                    <span style={{ fontSize: T.label, color: C.textSec, flex: 1, minWidth: 120 }}>
                      {formatDate(version.created_at)} · {formatBytes(version.size_bytes)}
                      {version.yanked && <span style={{ color: C.errorText }}> · yanked</span>}
                    </span>
                    <span
                      style={{ fontFamily: "var(--mono)", fontSize: T.badge, color: C.textMute, overflowWrap: "anywhere" }}
                      title={version.sha256}
                    >
                      sha256:{version.sha256.slice(0, 4)}…{version.sha256.slice(-4)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              fontSize: T.caption,
              color: C.textMute,
            }}
          >
            <span>
              Published by {publisherName} · slug claimed {formatDate(skill.created_at)}
            </span>
            <a
              href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(`Report skill: ${skill.slug}`)}`}
              style={{ color: C.textSec, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Report this skill
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
