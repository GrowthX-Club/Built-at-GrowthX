"use client";

import { useState } from "react";
import { C } from "@/types";

interface UpvoteButtonProps {
  projectId: number;
  weighted: number;
  raw?: number;
  hasVoted: boolean;
  onVote?: (projectId: number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
}

export default function UpvoteButton({
  projectId,
  weighted: initialWeighted,
  hasVoted: initialVoted,
  onVote,
}: UpvoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [weighted, setWeighted] = useState(initialWeighted);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || !onVote) return;

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
        alignItems: "center",
        gap: 3,
        background: voted ? `${C.gold}10` : C.surfaceWarm,
        borderRadius: 6,
        padding: "3px 8px",
        border: `1px solid ${voted ? C.goldBorder : C.borderLight}`,
        cursor: onVote ? "pointer" : "default",
        transition: "all 0.15s",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--mono)",
      }}
    >
      <span style={{ fontSize: 10, color: voted ? C.gold : C.textMute }}>&#9650;</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: voted ? C.gold : C.text,
        }}
      >
        {weighted}
      </span>
    </button>
  );
}
