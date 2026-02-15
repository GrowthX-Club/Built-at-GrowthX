"use client";

import { C } from "@/types";

interface UpvoteButtonProps {
  weighted: number;
  raw: number;
}

export default function UpvoteButton({ weighted }: UpvoteButtonProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        background: C.surfaceWarm,
        borderRadius: 6,
        padding: "3px 8px",
        border: `1px solid ${C.borderLight}`,
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 10, color: C.textMute }}>&#9650;</span>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
        }}
      >
        {weighted}
      </span>
    </div>
  );
}
