import { Link } from "react-router";
import { C, T, skillPublisher, type Skill } from "@/types";
import SkillGlyph from "./SkillGlyph";

function publisherInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function ScriptsChip() {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: T.badge - 1,
        letterSpacing: "0.05em",
        padding: "2px 7px",
        borderRadius: 4,
        background: C.errorSoft,
        color: C.errorText,
        border: `1px solid ${C.errorBorder}`,
      }}
    >
      &#x26A1; scripts
    </span>
  );
}

export default function SkillRow({ skill }: { skill: Skill }) {
  const publisher = skillPublisher(skill);
  const publisherName = publisher?.name || publisher?.username || "A GrowthX member";

  return (
    <Link to={`/skills/${skill.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          padding: "18px 16px",
          margin: "0 -16px",
          borderBottom: `1px solid ${C.borderLight}`,
          borderRadius: 10,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.surfaceWarm;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <SkillGlyph name={skill.slug} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: T.bodySm + 1, fontWeight: 500, letterSpacing: "-0.01em", color: C.text }}>
              {skill.slug}
            </span>
            {skill.tier === "has-executables" && <ScriptsChip />}
          </div>
          <div style={{ color: C.textSec, fontSize: T.bodySm, margin: "3px 0 8px", lineHeight: 1.5 }}>
            {skill.description}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: T.caption, color: C.textMute }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textSec }}>
              {publisher?.display_picture ? (
                <img
                  src={publisher.display_picture}
                  alt=""
                  style={{ width: 18, height: 18, borderRadius: 5, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: C.accentSoft,
                    color: C.textSec,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--mono)",
                    fontSize: T.micro,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {publisherInitials(publisherName)}
                </span>
              )}
              {publisherName}
            </span>
            <span style={{ color: C.border }}>&middot;</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: T.caption, color: C.textSec }}>
              {skill.install_count} {skill.install_count === 1 ? "install" : "installs"}
            </span>
            {(skill.tags || []).length > 0 && <span style={{ color: C.border }}>&middot;</span>}
            {(skill.tags || []).map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: T.badge - 1,
                  letterSpacing: "0.04em",
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: C.accentSoft,
                  color: C.textSec,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
