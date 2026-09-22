"use client";

import { useState } from "react";
import { C, T, type BundleSkill } from "@/types";
import { BUNDLE_REPO, bundleInstallCommand } from "@/lib/skills-bundle";

const COLLAPSED_ROWS = 5;

export default function SkillBundleStrip({
  skills,
  searching,
}: {
  skills: BundleSkill[];
  searching: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!skills.length) return null;

  const showAll = expanded || searching;
  const visible = showAll ? skills : skills.slice(0, COLLAPSED_ROWS);

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        background: C.surfaceWarm,
        overflow: "hidden",
        margin: "14px 0 10px",
      }}
    >
      <div
        style={{
          padding: "13px 18px",
          borderBottom: `1px solid ${C.borderLight}`,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: T.badge,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: C.textSec,
          }}
        >
          In your Build Sprint bundle
        </span>
        <span style={{ fontSize: T.caption, color: C.textMute }}>
          {searching
            ? `${skills.length} ${skills.length === 1 ? "match" : "matches"}`
            : `${skills.length} skills · already installed if you ran the setup command`}
        </span>
      </div>

      {visible.map((skill) => (
        <a
          key={skill.name}
          href={skill.upstreamUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={bundleInstallCommand(skill.name)}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 18px",
              borderBottom: `1px solid ${C.borderLight}`,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontFamily: "var(--mono)", fontSize: T.label, fontWeight: 500, flexShrink: 0, color: C.text }}>
              {skill.name}
            </span>
            <span
              style={{
                fontSize: T.label,
                color: C.textSec,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {skill.description}
            </span>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.badge - 1,
                color: skill.ours ? C.gold : C.textMute,
                flexShrink: 0,
              }}
            >
              {skill.ours ? "◆ " : ""}
              {skill.upstream}
            </span>
          </div>
        </a>
      ))}

      {!showAll && skills.length > COLLAPSED_ROWS && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "11px 18px",
            fontSize: T.caption,
            color: C.blue,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--sans)",
          }}
        >
          Show all {skills.length}
        </button>
      )}

      <div style={{ padding: "11px 18px", fontSize: T.caption, color: C.textMute, borderTop: `1px solid ${C.borderLight}` }}>
        These ship with the sprint bundle and stay on GitHub — install them with{" "}
        <code style={{ fontFamily: "var(--mono)" }}>npx skills add {BUNDLE_REPO} --skill &lt;name&gt;</code>
      </div>
    </div>
  );
}
