"use client";

import Link from "next/link";
import { Project, Event } from "@/types";
import UpvoteButton from "./UpvoteButton";
import Avatar from "./Avatar";

interface ProjectRowProps {
  project: Project & { eventData?: Event };
  hasVoted: boolean;
  rank?: number;
}

export default function ProjectRow({ project, hasVoted, rank }: ProjectRowProps) {
  return (
    <Link
      href={`/projects/${project._id}`}
      className="flex items-center gap-4 px-6 py-4 border-b border-border-light hover:bg-surface transition-colors"
    >
      {rank !== undefined && (
        <span className="text-sm font-mono text-secondary w-5 text-right shrink-0">
          {rank}
        </span>
      )}
      <UpvoteButton
        projectId={project._id}
        weightedScore={project.weightedScore}
        rawVotes={project.rawVotes}
        hasVoted={hasVoted}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-dark text-sm">{project.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-secondary">
            {project.category}
          </span>
        </div>
        <p className="text-sm text-secondary mt-0.5 truncate">
          {project.tagline}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center -space-x-1.5">
            {project.team.map((member) => (
              <Avatar
                key={member.memberId}
                name={member.name}
                size="xs"
              />
            ))}
          </div>
          <span className="text-xs text-secondary">
            {project.team.map((m) => m.name).join(", ")}
          </span>
          {project.eventData && (
            <>
              <span className="text-xs text-secondary">&middot;</span>
              <span
                className="text-xs font-medium"
                style={{ color: project.eventData.color }}
              >
                {project.eventData.name}
              </span>
            </>
          )}
          {project.traction && (
            <>
              <span className="text-xs text-secondary">&middot;</span>
              <span className="text-xs text-secondary">
                {project.traction.users && String(project.traction.users)}
                {project.traction.users && project.traction.revenue && " · "}
                {project.traction.revenue}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
