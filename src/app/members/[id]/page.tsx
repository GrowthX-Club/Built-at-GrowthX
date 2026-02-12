"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Member, Project, Event, ROLE_COLORS, ROLE_WEIGHTS } from "@/types";
import Avatar from "@/components/Avatar";
import ProjectRow from "@/components/ProjectRow";

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [projects, setProjects] = useState<(Project & { eventData?: Event })[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/members/${id}`).then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([memberData, projectsData]) => {
      setMember(memberData.member);
      const memberProjects = projectsData.projects.filter(
        (p: Project) => p.team.some((t: { memberId: string }) => t.memberId === id)
      );
      setProjects(memberProjects);
      setVotedIds(projectsData.votedIds);
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

  if (!member) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-secondary text-sm">
        Member not found
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <Link
        href="/builders"
        className="inline-flex items-center gap-1 text-sm text-secondary hover:text-dark transition-colors mb-6"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4">
          <path d="M10.5 3L5.5 8L10.5 13" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        Back to builders
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <Avatar name={member.name} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-dark">{member.name}</h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                color: ROLE_COLORS[member.role],
                backgroundColor: `${ROLE_COLORS[member.role]}15`,
              }}
            >
              {member.role} &middot; {ROLE_WEIGHTS[member.role] || 1}x
            </span>
          </div>
          <p className="text-sm text-secondary mt-0.5">
            {member.company} &middot; {member.city}
          </p>
          {member.bio && (
            <p className="text-sm text-dark/80 mt-2">{member.bio}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-secondary hover:text-dark"
              >
                LinkedIn
              </a>
            )}
            {member.twitter && (
              <a
                href={member.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-secondary hover:text-dark"
              >
                Twitter
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-dark">
            {member.builderScore}
          </div>
          <div className="text-xs text-secondary mt-1">Builder Score</div>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-dark">
            {member.projectsShipped}
          </div>
          <div className="text-xs text-secondary mt-1">Projects Shipped</div>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="font-mono text-2xl font-bold text-dark">
            {member.totalWeightedVotes}
          </div>
          <div className="text-xs text-secondary mt-1">Weighted Votes</div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-dark mb-4">
        Projects ({projects.length})
      </h2>
      <div className="-mx-6">
        {projects.map((project, i) => (
          <ProjectRow
            key={project._id}
            project={project}
            hasVoted={votedIds.includes(project._id)}
            rank={i + 1}
          />
        ))}
        {projects.length === 0 && (
          <div className="text-center py-8 text-secondary text-sm px-6">
            No projects shipped yet
          </div>
        )}
      </div>
    </div>
  );
}
