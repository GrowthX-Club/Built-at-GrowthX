"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Project, Event, ROLE_WEIGHTS, ROLE_COLORS } from "@/types";
import UpvoteButton from "@/components/UpvoteButton";
import Avatar from "@/components/Avatar";
import CommentSection from "@/components/CommentSection";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<(Project & { eventData?: Event }) | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const p = data.projects.find((proj: Project) => proj._id === id);
        if (p) {
          setProject(p);
          setHasVoted(data.votedIds.includes(id));
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-secondary text-sm">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-secondary text-sm">
        Project not found
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-secondary hover:text-dark transition-colors mb-6"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4">
          <path d="M10.5 3L5.5 8L10.5 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        Back to projects
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <UpvoteButton
          projectId={project._id}
          weightedScore={project.weightedScore}
          rawVotes={project.rawVotes}
          hasVoted={hasVoted}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-dark">{project.name}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface border border-border text-secondary">
              {project.category}
            </span>
          </div>
          <p className="text-secondary mt-1">{project.tagline}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {project.eventData && (
              <span
                className="text-xs font-medium"
                style={{ color: project.eventData.color }}
              >
                {project.eventData.name}
              </span>
            )}
            {project.productUrl && (
              <a
                href={project.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange hover:text-orange-600 font-medium"
              >
                Visit product &rarr;
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {project.description && (
            <div>
              <h2 className="text-sm font-semibold text-dark mb-2">About</h2>
              <p className="text-sm text-dark/80 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {project.buildLog && (
            <div>
              <h2 className="text-sm font-semibold text-dark mb-2">
                Build Log
              </h2>
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-sm text-dark/80 leading-relaxed whitespace-pre-wrap">
                  {project.buildLog}
                </p>
              </div>
            </div>
          )}

          <CommentSection projectId={project._id} />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-dark mb-3">Team</h2>
            <div className="space-y-3">
              {project.team.map((member) => (
                <Link
                  key={member.memberId}
                  href={`/members/${member.memberId}`}
                  className="flex items-center gap-3 hover:bg-surface rounded-lg p-2 -m-2 transition-colors"
                >
                  <Avatar name={member.name} size="md" />
                  <div>
                    <div className="text-sm font-medium text-dark">
                      {member.name}
                    </div>
                    <div className="text-xs text-secondary">{member.role}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {project.traction && (
            <div>
              <h2 className="text-sm font-semibold text-dark mb-3">
                Traction
              </h2>
              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                {project.traction.users && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Users</span>
                    <span className="font-mono font-medium text-dark">
                      {String(project.traction.users)}
                    </span>
                  </div>
                )}
                {project.traction.revenue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Revenue</span>
                    <span className="font-mono font-medium text-dark">
                      {project.traction.revenue}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-dark mb-3">
              Vote Breakdown
            </h2>
            <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
              {Object.entries(ROLE_WEIGHTS).map(([role, weight]) => (
                <div key={role} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ROLE_COLORS[role] }}
                    />
                    <span className="text-dark capitalize">{role}</span>
                  </div>
                  <span className="font-mono text-secondary text-xs">
                    {weight}x
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
                <span className="font-medium text-dark">Total</span>
                <span className="font-mono font-bold text-dark">
                  {project.weightedScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
