"use client";

import { C, ROLES } from "@/types";

export default function Header({
  onSubmit,
}: {
  onSubmit?: () => void;
}) {
  return (
    <header
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: 22,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "-0.02em",
          }}
        >
          Built
        </span>
        <span
          style={{
            fontSize: 11,
            color: C.textMute,
            fontFamily: "var(--mono)",
            padding: "2px 8px",
            background: C.surfaceWarm,
            borderRadius: 4,
            border: `1px solid ${C.borderLight}`,
          }}
        >
          at GrowthX
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            color: C.textSec,
            fontFamily: "var(--mono)",
          }}
        >
          6 shipped &middot; 4 building
        </span>
        <button
          onClick={onSubmit}
          style={{
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--sans)",
          }}
        >
          + Submit
        </button>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${ROLES.builder.bg}, ${ROLES.builder.color}20)`,
            border: `2px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: C.textSec,
          }}
        >
          AM
        </div>
      </div>
    </header>
  );
}
