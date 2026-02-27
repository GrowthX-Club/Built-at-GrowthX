"use client";

import { useState } from "react";
import { C, T } from "@/types";

function fmt(n: number) {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

interface UpvoteButtonProps {
  projectId: string | number;
  weighted: number;
  raw?: number;
  hasVoted: boolean;
  onVote?: (projectId: string | number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
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
  const [ghostActive, setGhostActive] = useState(false);

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
        if (result.voted && !voted) {
          setGhostActive(true);
          setTimeout(() => setGhostActive(false), 600);
        }
        setVoted(result.voted);
        setWeighted(result.weighted);
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize = isLarge ? 16 : 12;

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: isLarge ? "column" : "row",
        alignItems: "center",
        gap: isLarge ? 2 : 4,
        background: voted ? C.brandSoft : C.surface,
        borderRadius: isLarge ? 10 : 8,
        padding: isLarge ? "10px 18px" : "4px 10px",
        border: voted ? `1.5px solid ${C.brand}` : `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "border 0.25s, background 0.25s, color 0.25s",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--sans)",
        color: voted ? C.brand : C.text,
        position: "relative",
        overflow: "visible",
      }}
    >
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: iconSize, height: iconSize, flexShrink: 0 }}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
          <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <span
          className={`vote-ghost${ghostActive ? " active" : ""}`}
          style={{ color: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
            <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      <span
        style={{
          fontSize: isLarge ? T.subtitle : T.bodySm,
          fontWeight: 650,
          color: voted ? C.brand : C.text,
        }}
      >
        {fmt(weighted)}
      </span>
    </button>
  );
}
