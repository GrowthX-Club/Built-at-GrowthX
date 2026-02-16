"use client";

import { C, STACK_META } from "@/types";
import type { Project } from "@/types";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import UpvoteButton from "./UpvoteButton";

function CompanyTag({ name, color }: { name: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color: color,
        background: `${color}10`,
        padding: "1px 6px",
        borderRadius: 4,
        border: `1px solid ${color}20`,
        fontFamily: "var(--mono)",
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 2,
          background: color,
        }}
      />
      {name}
    </span>
  );
}

function BuilderCycler({ project }: { project: Project }) {
  const team = [
    {
      name: project.builder.name,
      company: project.builder.company,
      color: project.builder.companyColor,
    },
    ...project.collabs.map((c) => ({
      name: c.name,
      company: c.company,
      color: c.companyColor,
    })),
  ];
  const [idx, setIdx] = useState(0);
  const [animState, setAnimState] = useState<"in" | "out">("in");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (team.length <= 1) return;
    timerRef.current = setInterval(() => {
      setAnimState("out");
      setTimeout(() => {
        setIdx((i) => (i + 1) % team.length);
        setAnimState("in");
      }, 200);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [team.length]);

  const current = team[idx];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minHeight: 20,
        overflow: "hidden",
      }}
    >
      <div
        key={idx}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          animation:
            animState === "in"
              ? "slideUp 0.25s ease-out"
              : "slideOut 0.2s ease-in forwards",
        }}
      >
        {current?.company && current?.color && (
          <CompanyTag name={current.company} color={current.color} />
        )}
        <span style={{ fontSize: 12, color: C.textSec }}>{current?.name}</span>
      </div>
      {team.length > 1 && (
        <span
          style={{
            fontSize: 9,
            color: C.textMute,
            fontFamily: "var(--mono)",
          }}
        >
          +{team.length - 1}
        </span>
      )}
    </div>
  );
}

export default function ProjectCard({
  project,
  hasVoted = false,
  onVote,
  onUnauthClick,
}: {
  project: Project;
  hasVoted?: boolean;
  onVote?: (projectId: number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
  onUnauthClick?: () => void;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        className="animate-fadeUp"
        style={{
          background: C.surface,
          borderRadius: 12,
          border: `1px solid ${project.featured ? C.goldBorder : C.border}`,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.2s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.textMute;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = project.featured
            ? C.goldBorder
            : C.border;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {project.featured && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: C.goldSoft,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 10,
              color: C.gold,
              fontWeight: 600,
              fontFamily: "var(--mono)",
              zIndex: 2,
            }}
          >
            &#x2726; Featured
          </div>
        )}

        <div
          style={{
            height: 100,
            background: `linear-gradient(135deg, ${project.heroColor}15, ${project.heroColor}08)`,
            borderBottom: `1px solid ${C.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${project.heroColor}, ${project.heroColor}CC)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "var(--serif)",
              boxShadow: `0 4px 12px ${project.heroColor}30`,
            }}
          >
            {project.name[0]}
          </div>
        </div>

        <div style={{ padding: "14px 16px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                fontWeight: 600,
                margin: 0,
                color: C.text,
                letterSpacing: "-0.01em",
              }}
            >
              {project.name}
            </h3>
            <UpvoteButton
              projectId={project.id}
              weighted={project.weighted}
              raw={project.raw}
              hasVoted={hasVoted}
              onVote={onVote}
              onUnauthClick={onUnauthClick}
            />
          </div>

          <p
            style={{
              fontSize: 13,
              color: C.textSec,
              margin: "0 0 12px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.tagline}
          </p>

          <BuilderCycler project={project} />

          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {project.stack.slice(0, 3).map((tech) => {
              const meta = STACK_META[tech];
              return (
                <span
                  key={tech}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: meta ? `${meta.bg}12` : C.surfaceWarm,
                    border: `1px solid ${C.borderLight}`,
                    color: C.textSec,
                    fontFamily: "var(--mono)",
                  }}
                >
                  {meta && (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: meta.bg,
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontWeight: 700,
                      }}
                    >
                      {meta.icon}
                    </span>
                  )}
                  {tech}
                </span>
              );
            })}
            {project.stack.length > 3 && (
              <span
                style={{
                  fontSize: 10,
                  color: C.textMute,
                  fontFamily: "var(--mono)",
                  padding: "2px 4px",
                }}
              >
                +{project.stack.length - 3}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
              paddingTop: 10,
              borderTop: `1px solid ${C.borderLight}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.textMute,
                fontFamily: "var(--mono)",
              }}
            >
              {project.buildathon || "Community"}
            </span>
            <span style={{ fontSize: 11, color: C.textMute }}>
              {project.date}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
