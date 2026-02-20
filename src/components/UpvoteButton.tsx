"use client";

import { useState } from "react";
import { C } from "@/types";

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

interface UpvoteButtonProps {
  projectId: number;
  weighted: number;
  raw?: number;
  hasVoted: boolean;
  onVote?: (projectId: number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
  onUnauthClick?: () => void;
  size?: "default" | "large";
}

export default function UpvoteButton({
  projectId,
  weighted: initialWeighted,
  hasVoted: initialVoted,
  onVote,
  onUnauthClick,
  size = "default",
}: UpvoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [weighted, setWeighted] = useState(initialWeighted);
  const [loading, setLoading] = useState(false);

  const isLarge = size === "large";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onVote) {
      onUnauthClick?.();
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const result = await onVote(projectId);
      if (result) {
        setVoted(result.voted);
        setWeighted(result.weighted);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: isLarge ? "column" : "row",
        alignItems: "center",
        gap: isLarge ? 2 : 3,
        background: voted ? `${C.gold}10` : C.surfaceWarm,
        borderRadius: isLarge ? 10 : 6,
        padding: isLarge ? "10px 18px" : "3px 8px",
        border: `1px solid ${voted ? C.goldBorder : C.borderLight}`,
        cursor: "pointer",
        transition: "all 0.15s",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--mono)",
      }}
    >
      <span style={{ fontSize: isLarge ? 14 : 10, color: voted ? C.gold : C.textMute }}>&#9650;</span>
      <span
        style={{
          fontSize: isLarge ? 18 : 13,
          fontWeight: 600,
          color: voted ? C.gold : C.text,
        }}
      >
        {fmt(weighted)}
      </span>
    </button>
  );
}
