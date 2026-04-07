"use client";

import { useState, useRef } from "react";
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
  const [popActive, setPopActive] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

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
          setPopActive(true);
          setTimeout(() => setPopActive(false), 500);
          // Spawn burst particles portaled to body
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const container = document.createElement("div");
            container.style.cssText = `position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9999;`;
            const dots: HTMLElement[] = [];
            [0, 55, 110, 170, 230, 300].forEach(deg => {
              const rad = (deg * Math.PI) / 180;
              const dist = 44 + Math.random() * 20;
              const dot = document.createElement("div");
              dot.className = "vote-burst-dot";
              dot.style.left = `${cx}px`;
              dot.style.top = `${cy}px`;
              dot.style.transform = "translate(-50%, -50%) scale(1)";
              dot.style.opacity = "1";
              dot.dataset.tx = `${Math.cos(rad) * dist}`;
              dot.dataset.ty = `${Math.sin(rad) * dist}`;
              container.appendChild(dot);
              dots.push(dot);
            });
            document.body.appendChild(container);
            requestAnimationFrame(() => {
              dots.forEach(dot => {
                dot.style.transform = `translate(calc(-50% + ${dot.dataset.tx}px), calc(-50% + ${dot.dataset.ty}px)) scale(0)`;
                dot.style.opacity = "0";
              });
            });
            setTimeout(() => container.remove(), 550);
          }
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
      ref={btnRef}
      onClick={handleClick}
      className={popActive ? "vote-pop-active" : ""}
      style={{
        display: "flex",
        flexDirection: isLarge ? "column" : "row",
        alignItems: "center",
        gap: isLarge ? 2 : 4,
        background: voted ? C.accent : "transparent",
        borderRadius: isLarge ? 10 : 20,
        padding: isLarge ? "10px 18px" : "6px 14px",
        border: voted ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "border 0.25s, background 0.25s, color 0.25s",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--sans)",
        color: voted ? C.accentFg : C.text,
        position: "relative",
        overflow: "visible",
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        style={{
          fontSize: isLarge ? T.subtitle : T.bodySm,
          fontWeight: 650,
          color: voted ? C.accentFg : C.text,
        }}
      >
        {fmt(weighted)}
      </span>
    </button>
  );
}
