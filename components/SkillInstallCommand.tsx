"use client";

import { useState } from "react";
import { C, T } from "@/types";

export default function SkillInstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard
      ?.writeText(command)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };

  return (
    <div
      style={{
        background: "var(--c-codeBg)",
        color: "var(--c-codeFg)",
        border: "1px solid var(--c-codeBorder)",
        borderRadius: 10,
        padding: "14px 16px",
        fontFamily: "var(--mono)",
        fontSize: T.label,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <span style={{ overflowX: "auto", whiteSpace: "nowrap" }}>{command}</span>
      <button
        onClick={copy}
        style={{
          fontFamily: "var(--mono)",
          fontSize: T.badge - 1,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "inherit",
          background: "none",
          border: "none",
          opacity: copied ? 1 : 0.55,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
