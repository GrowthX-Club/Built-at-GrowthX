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
  size?: "default" | "large" | "detail" | "float";
  className?: string;
  style?: React.CSSProperties;
}

export default function UpvoteButton({
  projectId,
  weighted: initialWeighted,
  hasVoted: initialVoted,
  onVote,
  onUnauthClick,
  size = "default",
  className,
  style: extraStyle,
}: UpvoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [weighted, setWeighted] = useState(initialWeighted);
  const [loading, setLoading] = useState(false);
  const [popActive, setPopActive] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  // Size-specific styles
  const sizeConfig = {
    default: {
      iconSize: 12,
      padding: voted ? "4px 10px" : "6px 14px",
      borderRadius: voted ? 8 : 20,
      fontSize: T.bodySm,
      fontWeight: 650,
      showLabel: false,
    },
    large: {
      iconSize: 16,
      padding: "10px 18px",
      borderRadius: 10,
      fontSize: T.subtitle,
      fontWeight: 650,
      showLabel: false,
    },
    detail: {
      iconSize: voted ? 20 : 16,
      padding: voted ? "12px 28px" : "10px 22px",
      borderRadius: voted ? 12 : 24,
      fontSize: voted ? T.bodyLg : T.body,
      fontWeight: voted ? 700 : 600,
      showLabel: true,
    },
    float: {
      iconSize: 18,
      padding: "13px 20px",
      borderRadius: voted ? 12 : 24,
      fontSize: T.body,
      fontWeight: voted ? 700 : 600,
      showLabel: true,
    },
  };

  const cfg = sizeConfig[size];

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={[popActive ? "vote-pop-active" : "", className].filter(Boolean).join(" ") || undefined}
      style={{
        display: "flex",
        flexDirection: size === "large" ? "column" : "row",
        alignItems: "center",
        justifyContent: size === "float" ? "center" : undefined,
        gap: size === "large" ? 2 : 8,
        background: voted ? C.accent : "transparent",
        borderRadius: cfg.borderRadius,
        padding: cfg.padding,
        border: voted ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
        cursor: "pointer",
        transition: "all 0.25s",
        opacity: loading ? 0.6 : 1,
        fontFamily: "var(--sans)",
        color: voted ? C.accentFg : C.text,
        position: "relative",
        overflow: "visible",
        ...extraStyle,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      <svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: cfg.fontSize, fontWeight: cfg.fontWeight, color: voted ? C.accentFg : C.text, lineHeight: 1 }}>
        {cfg.showLabel && voted ? "Voted \u00B7 " : ""}{fmt(weighted)}
      </span>
    </button>
  );
}
