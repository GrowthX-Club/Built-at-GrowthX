"use client";

import { C, STACK_META } from "@/types";
import type { Project } from "@/types";
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

/* ── Featured "Host Pick" card ── */
export function HostPickCard({
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
    <div
      className="animate-fadeUp"
      style={{
        background: C.surface,
        borderRadius: 14,
        border: `1.5px solid ${C.goldBorder}`,
        padding: 0,
        marginBottom: 28,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Label */}
      <div
        style={{
          background: C.goldSoft,
          borderBottom: `1px solid ${C.goldBorder}`,
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 12, color: C.gold }}>&#x2726;</span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--mono)",
            fontWeight: 700,
            color: C.gold,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Host Pick This Week
        </span>
      </div>

      {/* Content */}
      <Link
        href={`/projects/${project.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "20px 24px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.surfaceWarm;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${project.heroColor}, ${project.heroColor}CC)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "var(--serif)",
              flexShrink: 0,
              boxShadow: `0 4px 16px ${project.heroColor}30`,
            }}
          >
            {project.name[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                  color: C.text,
                  letterSpacing: "-0.01em",
                }}
              >
                {project.name}
              </h3>
              {project.builder.company && project.builder.companyColor && (
                <CompanyTag name={project.builder.company} color={project.builder.companyColor} />
              )}
            </div>
            <p
              style={{
                fontSize: 14,
                color: C.textSec,
                margin: "0 0 8px",
                lineHeight: 1.5,
              }}
            >
              {project.tagline}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: C.textMute }}>
                by {project.builder.name}
                {project.collabs.length > 0 && ` + ${project.collabs.length}`}
              </span>
              <span style={{ color: C.borderLight }}>·</span>
              <div style={{ display: "flex", gap: 4 }}>
                {project.stack.slice(0, 3).map((tech) => {
                  const meta = STACK_META[tech];
                  return (
                    <span
                      key={tech}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        padding: "1px 5px",
                        borderRadius: 3,
                        background: meta ? `${meta.bg}12` : C.surfaceWarm,
                        border: `1px solid ${C.borderLight}`,
                        color: C.textSec,
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {meta && (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            background: meta.bg,
                            color: meta.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 7,
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
              </div>
            </div>
          </div>

          {/* Upvote */}
          <div style={{ flexShrink: 0 }}>
            <UpvoteButton
              projectId={project.id}
              weighted={project.weighted}
              raw={project.raw}
              hasVoted={hasVoted}
              onVote={onVote}
              onUnauthClick={onUnauthClick}
              size="large"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── Regular project list row ── */
export default function ProjectRow({
  project,
  hasVoted = false,
  onVote,
  onUnauthClick,
  isLast = false,
}: {
  project: Project;
  hasVoted?: boolean;
  onVote?: (projectId: number) => Promise<{ voted: boolean; weighted: number; raw: number } | null>;
  onUnauthClick?: () => void;
  isLast?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        className="animate-fadeUp"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
          borderBottom: isLast ? "none" : `1px solid ${C.borderLight}`,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.surfaceWarm;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${project.heroColor}, ${project.heroColor}CC)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--serif)",
            flexShrink: 0,
          }}
        >
          {project.name[0]}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span
              style={{
                fontFamily: "var(--serif)",
                fontSize: 15,
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.01em",
              }}
            >
              {project.name}
            </span>
            {project.builder.company && project.builder.companyColor && (
              <CompanyTag name={project.builder.company} color={project.builder.companyColor} />
            )}
          </div>
          <p
            style={{
              fontSize: 13,
              color: C.textSec,
              margin: 0,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.tagline}
          </p>
        </div>

        {/* Builder */}
        <div
          style={{
            flexShrink: 0,
            fontSize: 12,
            color: C.textMute,
            textAlign: "right",
            minWidth: 80,
          }}
        >
          {project.builder.name}
        </div>

        {/* Upvote */}
        <div style={{ flexShrink: 0 }}>
          <UpvoteButton
            projectId={project.id}
            weighted={project.weighted}
            raw={project.raw}
            hasVoted={hasVoted}
            onVote={onVote}
            onUnauthClick={onUnauthClick}
          />
        </div>
      </div>
    </Link>
  );
}
