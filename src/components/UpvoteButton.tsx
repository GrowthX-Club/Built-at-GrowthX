"use client";

import { useState } from "react";

interface UpvoteButtonProps {
  projectId: string;
  weightedScore: number;
  rawVotes: number;
  hasVoted: boolean;
  size?: "sm" | "lg";
}

export default function UpvoteButton({
  projectId,
  weightedScore: initialScore,
  rawVotes: initialRaw,
  hasVoted: initialVoted,
  size = "sm",
}: UpvoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [score, setScore] = useState(initialScore);
  const [rawVotes, setRawVotes] = useState(initialRaw);
  const [loading, setLoading] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();

      if (res.ok) {
        setVoted(data.voted);
        setScore(data.weightedScore);
        setRawVotes(data.rawVotes);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLarge = size === "lg";

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex flex-col items-center justify-center border rounded-lg transition-all ${
        voted
          ? "border-orange bg-orange-50 text-orange"
          : "border-border bg-white text-secondary hover:border-orange hover:text-orange"
      } ${isLarge ? "px-5 py-3 min-w-[72px]" : "px-3 py-2 min-w-[56px]"} ${
        loading ? "opacity-50" : ""
      }`}
    >
      <svg
        viewBox="0 0 12 8"
        className={`${isLarge ? "w-4 h-3" : "w-3 h-2"} mb-0.5`}
        fill="currentColor"
      >
        <path d="M6 0L12 8H0L6 0Z" />
      </svg>
      <span
        className={`font-mono font-bold leading-tight ${
          isLarge ? "text-lg" : "text-sm"
        }`}
      >
        {score}
      </span>
      <span
        className={`font-mono leading-tight ${
          isLarge ? "text-xs" : "text-[10px]"
        } ${voted ? "text-orange/60" : "text-secondary"}`}
      >
        {rawVotes}
      </span>
    </button>
  );
}
