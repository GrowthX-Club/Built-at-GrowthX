"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { C, STACK_META, ROLES, type Project, type Comment, type BuilderProfile } from "@/types";
import Avatar from "@/components/Avatar";
import UpvoteButton from "@/components/UpvoteButton";
import SignInPicker from "@/components/SignInPicker";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => setProject(d.project));
    fetch(`/api/comments?projectId=${params.id}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user));
    fetch("/api/members")
      .then((r) => r.json())
      .then((d) => setBuilders(d.builders));
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        const voted = d.votedIds || [];
        setHasVoted(voted.includes(Number(params.id)));
      });
  }, [params.id]);

  const handleSignIn = async (name: string) => {
    const res = await fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await res.json();
    setUser(d.user);
    // Refresh voted state
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const voted = data.votedIds || [];
        setHasVoted(voted.includes(Number(params.id)));
      });
  };

  const handleVote = async (projectId: number) => {
    if (!user) return null;
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) return null;
    const result = await res.json();
    setHasVoted(result.voted);
    setProject((p) =>
      p ? { ...p, weighted: result.weighted, raw: result.raw } : p
    );
    return result;
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: Number(params.id), content: newComment.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setComments((c) => [...c, d.comment]);
        setNewComment("");
      }
    } finally {
      setPosting(false);
    }
  };

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.textMute, fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: "none", color: C.textSec, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          &larr; Back
        </Link>
        <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text }}>{project.name}</span>
        {project.featured && (
          <span style={{ fontSize: 10, color: C.gold, background: C.goldSoft, border: `1px solid ${C.goldBorder}`, padding: "2px 8px", borderRadius: 6, fontFamily: "var(--mono)", fontWeight: 600 }}>
            &#x2726; Featured
          </span>
        )}
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 60px" }}>
        {/* Hero */}
        <div style={{ height: 160, borderRadius: 16, background: `linear-gradient(135deg, ${project.heroColor}20, ${project.heroColor}08)`, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: `linear-gradient(135deg, ${project.heroColor}, ${project.heroColor}CC)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 700, fontFamily: "var(--serif)", boxShadow: `0 8px 24px ${project.heroColor}30` }}>
            {project.name[0]}
          </div>
        </div>

        {/* Title & meta */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 600, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{project.name}</h1>
            <UpvoteButton
              projectId={project.id}
              weighted={project.weighted}
              raw={project.raw}
              hasVoted={hasVoted}
              onVote={user ? handleVote : undefined}
              onUnauthClick={!user ? () => setShowSignIn(true) : undefined}
            />
          </div>
          <p style={{ fontSize: 17, color: C.textSec, lineHeight: 1.6, margin: "0 0 12px" }}>{project.tagline}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {project.buildathon && (
              <span style={{ fontSize: 12, color: C.textMute, fontFamily: "var(--mono)", background: C.surfaceWarm, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.borderLight}` }}>{project.buildathon}</span>
            )}
            <span style={{ fontSize: 12, color: C.textMute }}>{project.date}</span>
            <span style={{ fontSize: 12, color: C.textMute, background: C.surfaceWarm, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.borderLight}` }}>{project.category}</span>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>About</h2>
          <p style={{ fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>{project.description}</p>
        </div>

        {/* Gallery */}
        {project.gallery.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(project.gallery.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {project.gallery.map((item, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ height: 120, background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1] || item.colors[0]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "var(--mono)" }}>{item.type}</span>
                </div>
                <div style={{ padding: "8px 12px", background: C.surface }}>
                  <span style={{ fontSize: 12, color: C.textSec }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tech stack */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>Tech Stack</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {project.stack.map((tech) => {
              const meta = STACK_META[tech];
              return (
                <span key={tech} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px", borderRadius: 8, background: meta ? `${meta.bg}10` : C.surfaceWarm, border: `1px solid ${C.borderLight}`, color: C.text, fontFamily: "var(--mono)" }}>
                  {meta && (
                    <span style={{ width: 20, height: 20, borderRadius: 4, background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{meta.icon}</span>
                  )}
                  {tech}
                </span>
              );
            })}
          </div>
        </div>

        {/* Built by */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>Built by</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.surfaceWarm, borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
              <Avatar initials={project.builder.avatar} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{project.builder.name}</span>
                  {project.builder.company && project.builder.companyColor && (
                    <span style={{ fontSize: 11, color: project.builder.companyColor, fontFamily: "var(--mono)", background: `${project.builder.companyColor}10`, padding: "1px 6px", borderRadius: 4, border: `1px solid ${project.builder.companyColor}20` }}>
                      {project.builder.company}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: C.textSec }}>{project.builder.title} &middot; {project.builder.city}</span>
              </div>
            </div>
            {project.collabs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                <Avatar initials={c.avatar} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{c.name}</span>
                    {c.company && c.companyColor && (
                      <span style={{ fontSize: 11, color: c.companyColor, fontFamily: "var(--mono)", background: `${c.companyColor}10`, padding: "1px 6px", borderRadius: 4, border: `1px solid ${c.companyColor}20` }}>
                        {c.company}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: C.textSec }}>{c.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 24 }}>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
            Comments {comments.length > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: C.textMute }}>({comments.length})</span>}
          </h2>

          {comments.length === 0 && !user && (
            <p style={{ fontSize: 14, color: C.textMute, margin: 0 }}>No comments yet. Sign in to be the first!</p>
          )}
          {comments.length === 0 && user && (
            <p style={{ fontSize: 14, color: C.textMute, margin: "0 0 16px" }}>No comments yet. Be the first!</p>
          )}

          {comments.map((c) => {
            const roleInfo = ROLES[c.authorRole] || ROLES.member;
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <Avatar initials={c.authorAvatar} size={32} role={c.authorRole} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.authorName}</span>
                    <span style={{ fontSize: 10, color: roleInfo.color, background: roleInfo.bg, padding: "1px 5px", borderRadius: 3 }}>{roleInfo.label}</span>
                    <span style={{ fontSize: 11, color: C.textMute }}>
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.5, margin: 0 }}>{c.content}</p>
                </div>
              </div>
            );
          })}

          {user && (
            <form onSubmit={handlePostComment} style={{ marginTop: comments.length > 0 ? 16 : 0, paddingTop: comments.length > 0 ? 16 : 0, borderTop: comments.length > 0 ? `1px solid ${C.borderLight}` : "none" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Avatar initials={user.avatar} size={32} role={user.role} />
                <div style={{ flex: 1 }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    style={{
                      width: "100%",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                      color: C.text,
                      background: C.surfaceWarm,
                      outline: "none",
                      fontFamily: "var(--sans)",
                      resize: "none",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={posting || !newComment.trim()}
                      style={{
                        background: C.accent,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--sans)",
                        opacity: posting || !newComment.trim() ? 0.5 : 1,
                      }}
                    >
                      {posting ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {showSignIn && (
        <SignInPicker
          builders={builders}
          onSignIn={(name) => {
            handleSignIn(name);
            setShowSignIn(false);
          }}
          onClose={() => setShowSignIn(false)}
        />
      )}
    </div>
  );
}
