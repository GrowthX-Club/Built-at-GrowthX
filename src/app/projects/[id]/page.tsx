"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  C,
  T,
  ROLES,
  CUSTOM_EMOJIS,
  type Project,
  type BuilderProfile,
  type ThreadData,
  type Reaction,
  type Comment,
  normalizeComment,
  normalizeProject,
  normalizeUser,
  normalizeThread,
  getCompanyLogoUrl,
  getStackLogoUrl,
  STACK_META,
} from "@/types";
import { bxApi } from "@/lib/api";
import { useLoginDialog } from "@/context/LoginDialogContext";
import { useNavOverride } from "@/context/NavContext";
import { useResponsive } from "@/hooks/useMediaQuery";
import RichTextDisplay from "@/components/RichTextDisplay";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Av({ initials, size = 32, highlight, role, src }: { initials: string; size?: number; highlight?: boolean; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img src={src} alt={initials} style={{
        width: size, height: size, borderRadius: size,
        border: highlight ? `2px solid ${C.gold}` : `1px solid ${C.borderLight}`,
        flexShrink: 0, objectFit: "cover",
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size,
      background: highlight ? C.accent : (r?.bg || C.accentSoft),
      color: highlight ? C.bg : (r?.color || C.textSec),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 650,
      fontFamily: "var(--sans)", letterSpacing: "0.01em",
      border: highlight ? `2px solid ${C.gold}` : `1px solid ${C.borderLight}`,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ role, size = "sm" }: { role: string; size?: "sm" | "md" }) {
  const r = ROLES[role];
  if (!r) return null;
  const s = size === "sm" ? { fs: T.badge, px: 6, py: 2 } : { fs: T.caption, px: 8, py: 3 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: s.fs, fontWeight: 650, letterSpacing: "0.04em",
      padding: `${s.py}px ${s.px}px`, borderRadius: 4,
      color: r.color, background: r.bg,
      fontFamily: "var(--sans)", textTransform: "uppercase", lineHeight: 1,
    }}>
      {r.label}
    </span>
  );
}

function CompanyTag({ title, company, companyColor, companyLogo }: { title?: string; company?: string; companyColor?: string; companyLogo?: string }) {
  if (!company) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 450,
    }}>
      {title && <span>{title}</span>}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <span style={{
          width: 14, height: 14, borderRadius: 4,
          background: companyColor || C.accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: T.micro, fontWeight: 800, color: "#fff",
          fontFamily: "var(--sans)", letterSpacing: "-0.02em", flexShrink: 0,
          overflow: "hidden", position: "relative",
        }}>
          {company[0]}
          <img src={getCompanyLogoUrl(company, companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </span>
        <span style={{ fontWeight: 520, color: C.textSec }}>{company}</span>
      </span>
    </span>
  );
}

function Reactions({ reactions: initialReactions, onReact }: { reactions: Reaction[]; onReact?: (emojiCode: string) => boolean }) {
  const { isMobile } = useResponsive();
  const [local, setLocal] = useState(initialReactions.map(r => ({ ...r })));
  const [picker, setPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(initialReactions.map(r => ({ ...r })));
  }, [initialReactions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = (emojiCode: string) => {
    const allowed = onReact?.(emojiCode);
    if (allowed === false) return;
    setLocal(prev => prev.map(x => x.emoji.code === emojiCode ? { ...x, mine: !x.mine, count: x.mine ? x.count - 1 : x.count + 1 } : x));
  };

  const handlePick = (e: typeof CUSTOM_EMOJIS[number]) => {
    const allowed = onReact?.(e.code);
    if (allowed === false) return;
    const exists = local.find(x => x.emoji.code === e.code);
    if (exists) {
      if (!exists.mine) {
        setLocal(prev => prev.map(x => x.emoji.code === e.code ? { ...x, mine: true, count: x.count + 1 } : x));
      }
    } else {
      setLocal(prev => [...prev, { emoji: e, count: 1, mine: true }]);
    }
    setPicker(false);
  };

  return (
    <div ref={ref} style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center", position: "relative" }}>
      {local.map((r, i) => (
        <button key={i} onClick={() => handleToggle(r.emoji.code)} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 20,
          border: r.mine ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
          background: r.mine ? C.accentSoft : C.surface,
          cursor: "pointer", fontSize: T.bodySm, fontFamily: "var(--sans)",
          color: C.text, transition: "all 0.12s",
        }}>
          <span style={{ fontSize: T.body, color: r.emoji.special ? C.gold : "inherit", fontWeight: r.emoji.special ? 700 : 400 }}>{r.emoji.display}</span>
          <span style={{ fontSize: T.caption, fontWeight: 600, color: C.textSec, minWidth: 8, textAlign: "center" }}>{r.count}</span>
        </button>
      ))}
      <div style={{ position: "relative" }}>
        <button onClick={() => setPicker(!picker)} style={{
          width: 30, height: 30, borderRadius: 20,
          border: `1px dashed ${C.border}`, background: "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.12s", position: "relative",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentSoft; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: T.body, lineHeight: 1, opacity: 0.55 }}>{"\u{1F642}"}</span>
          <span style={{
            position: "absolute", bottom: -1, right: -1,
            width: 12, height: 12, borderRadius: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: C.textMute, lineHeight: 1,
          }}>+</span>
        </button>
        {picker && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 6px)",
            left: isMobile ? 0 : "50%",
            transform: isMobile ? "none" : "translateX(-50%)",
            padding: 10, background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2,
            zIndex: 100, minWidth: 220,
          }}>
            {CUSTOM_EMOJIS.map((e, i) => (
              <button key={i} onClick={() => handlePick(e)} title={e.label} style={{
                padding: 7, borderRadius: 8, border: "none",
                background: "transparent", cursor: "pointer",
                fontSize: T.subtitle, transition: "all 0.1s",
                color: e.special ? C.gold : "inherit",
                fontWeight: e.special ? 700 : 400,
              }}
              onMouseEnter={ev => (ev.target as HTMLElement).style.background = C.accentSoft}
              onMouseLeave={ev => (ev.target as HTMLElement).style.background = "transparent"}
              >
                {e.display}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadBlock({ thread }: { thread: ThreadData }) {
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "24px 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ display: "flex", gap: 14 }}>
        <Av initials={thread.author.avatar} size={38} role={thread.author.role} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: T.body, fontWeight: 620, color: C.text, fontFamily: "var(--sans)" }}>{thread.author.name}</span>
            <CompanyTag title={thread.author.title} company={thread.author.company} companyColor={thread.author.companyColor} companyLogo={thread.author.companyLogo} />
            <Badge role={thread.author.role} />
            <span style={{ fontSize: T.label, color: C.textMute }}>{thread.time}</span>
          </div>
          <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, fontFamily: "var(--sans)", margin: "0 0 14px", fontWeight: 400 }}>{thread.content}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Reactions reactions={thread.reactions} />
            {thread.replies.length > 0 && (
              <button onClick={() => setOpen(!open)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 8,
                border: "none", background: open ? C.accentSoft : "transparent",
                cursor: "pointer", fontSize: T.bodySm, fontWeight: 600,
                color: C.blue, fontFamily: "var(--sans)",
              }}>
                {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
                <span style={{ fontSize: 9, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>{"\u25BC"}</span>
              </button>
            )}
            {thread.replies.length === 0 && (
              <button style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: T.label, fontWeight: 500, color: C.textMute, fontFamily: "var(--sans)" }}>Reply</button>
            )}
          </div>
          {open && (
            <div style={{ marginTop: 16, borderLeft: `2px solid ${C.borderLight}`, paddingLeft: isMobile ? 12 : 20, marginLeft: 2 }}>
              {thread.replies.map((reply, i) => (
                <div key={i} style={{ padding: "16px 0", borderBottom: i < thread.replies.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                  {reply.author.isCreator ? (
                    <div style={{
                      background: `linear-gradient(90deg, ${C.goldSoft} 0%, transparent 100%)`,
                      margin: "-16px -16px 0 -20px", padding: "16px 16px 16px 20px",
                      borderRadius: "0 10px 10px 0",
                    }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Av initials={reply.author.avatar} size={30} highlight role={reply.author.role} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: T.bodySm, fontWeight: 650, color: C.text }}>{reply.author.name}</span>
                            <CompanyTag title={reply.author.title} company={reply.author.company} companyColor={reply.author.companyColor} companyLogo={reply.author.companyLogo} />
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#059669", letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                            <Badge role={reply.author.role} />
                            <span style={{ fontSize: T.caption, color: C.textMute }}>{reply.time}</span>
                          </div>
                          <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400 }}>{reply.content}</p>
                          <Reactions reactions={reply.reactions} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <Av initials={reply.author.avatar} size={30} role={reply.author.role} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: T.bodySm, fontWeight: 620, color: C.text }}>{reply.author.name}</span>
                          <CompanyTag title={reply.author.title} company={reply.author.company} companyColor={reply.author.companyColor} companyLogo={reply.author.companyLogo} />
                          <Badge role={reply.author.role} />
                          <span style={{ fontSize: T.caption, color: C.textMute }}>{reply.time}</span>
                        </div>
                        <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400 }}>{reply.content}</p>
                        <Reactions reactions={reply.reactions} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride } = useNavOverride();
  const { isMobile } = useResponsive();
  const [project, setProject] = useState<Project | null>(null);
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [user, setUser] = useState<BuilderProfile | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteAnim, setVoteAnim] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    bxApi(`/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.project) return;
        setProject(normalizeProject(d.project));
      });
    bxApi("/threads")
      .then((r) => r.json())
      .then((d) => setThreads((d.threads || []).map((t: Record<string, unknown>) => normalizeThread(t))));
    bxApi(`/comments?projectId=${params.id}`)
      .then((r) => r.json())
      .then((d) => setComments((d.comments || []).map(normalizeComment)));
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)));
    bxApi("/projects")
      .then((r) => r.json())
      .then((d) => {
        const voted = d.votedProjectIds || d.votedIds || d.voted_ids || [];
        setHasVoted(voted.includes(params.id) || voted.includes(Number(params.id)));
      });
  }, [params.id]);

  useEffect(() => {
    if (project) {
      setNavOverride({ title: project.name, backHref: "/" });
    }
    return () => clearNavOverride();
  }, [project, setNavOverride, clearNavOverride]);

  const reloadUser = () => {
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    bxApi("/projects").then((r) => r.json()).then((d) => {
      const voted = d.votedProjectIds || d.votedIds || d.voted_ids || [];
      setHasVoted(voted.includes(params.id) || voted.includes(Number(params.id)));
    });
  };

  const handleVote = async () => {
    if (!user) {
      openLoginDialog(() => { reloadUser(); reloadComments(); });
      return;
    }
    setVoteAnim(true);
    setTimeout(() => setVoteAnim(false), 800);
    const res = await bxApi("/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: params.id }),
    });
    if (!res.ok) return;
    const result = await res.json();
    setHasVoted(result.voted);
    const w = result.weighted ?? result.weighted_votes ?? result.weightedVotes ?? 0;
    const r = result.raw ?? result.raw_votes ?? result.rawVotes ?? 0;
    setProject((p) => p ? { ...p, weighted: w, raw: r } : p);
  };

  const handlePostComment = async () => {
    if (!comment.trim() || postingComment) return;
    if (!user) {
      openLoginDialog(() => { reloadUser(); reloadComments(); });
      return;
    }
    setPostingComment(true);
    try {
      const res = await bxApi("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, content: comment.trim() }),
      });
      if (res.ok) {
        setComment("");
        reloadComments();
      }
    } finally {
      setPostingComment(false);
    }
  };

  const reloadComments = () => {
    bxApi(`/comments?projectId=${params.id}`)
      .then((r) => r.json())
      .then((d) => setComments((d.comments || []).map(normalizeComment)));
  };

  const handleReact = (commentId: string, emojiCode: string): boolean => {
    if (!user) {
      openLoginDialog(() => { reloadUser(); reloadComments(); });
      return false;
    }
    bxApi(`/comments/${commentId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emojiCode }),
    }).then(res => { if (res.ok) reloadComments(); });
    return true;
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim() || postingComment) return;
    if (!user) {
      openLoginDialog(() => { reloadUser(); reloadComments(); });
      return;
    }
    setPostingComment(true);
    try {
      const res = await bxApi("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, content: replyText.trim(), parentId }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyingTo(null);
        reloadComments();
      }
    } finally {
      setPostingComment(false);
    }
  };

  const buildCommentTree = (allComments: Comment[]) => {
    const roots = allComments.filter(c => !c.parentId);
    const replies = allComments.filter(c => c.parentId);
    return roots.map(root => ({
      root,
      replies: replies.filter(r => r.parentId === root.id),
    }));
  };

  const commentTree = buildCommentTree(comments);

  if (!project) {
    return (
      <main className="responsive-main" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 32px 100px", fontFamily: "var(--sans)" }}>
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 20 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 36 }} />
            <div>
              <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 11, width: 70 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 24, width: 75, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 24, width: 55, borderRadius: 6 }} />
          </div>
        </div>
        <div className="fade-up stagger-2">
          <div className="skeleton" style={{ height: 14, width: "100%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "95%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "85%", marginBottom: 24 }} />
        </div>
        <div className="fade-up stagger-3" style={{
          padding: "24px 28px", background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 14, marginTop: 32,
        }}>
          <div className="skeleton" style={{ height: 18, width: 120, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 60, width: "100%", borderRadius: 10 }} />
        </div>
      </main>
    );
  }

  const p = project;

  return (
    <div className="responsive-main" style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 100px", fontFamily: "var(--sans)" }}>
        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 className="responsive-h1" style={{ fontSize: T.pageTitle, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.1 }}>{p.name}</h1>
                {p.featured && (
                  <span style={{
                    fontSize: T.badge, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                    background: C.goldSoft, color: C.gold, border: `1px solid ${C.goldBorder}`,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>{"\u2726"} Featured</span>
                )}
              </div>
              <p style={{ fontSize: T.subtitle, color: C.textSec, fontFamily: "var(--serif)", fontWeight: 400, lineHeight: 1.4, fontStyle: "italic", margin: "0 0 10px" }}>{p.tagline}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 450 }}>
                <span>{p.date}</span>
                {p.buildathon && (
                  <>
                    <span style={{ opacity: 0.4 }}>{"\u00B7"}</span>
                    <span>{p.buildathon}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", gap: 8, ...(isMobile ? { width: "100%" } : {}) }}>
              <button onClick={handleVote} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 10,
                border: hasVoted ? `1.5px solid ${C.brand}` : `1.5px solid ${C.accent}`,
                background: hasVoted ? C.brandSoft : C.surface,
                cursor: "pointer", fontSize: T.bodyLg, fontWeight: 650,
                fontFamily: "var(--sans)", color: hasVoted ? C.brand : C.text,
                transition: "border 0.25s, background 0.25s, color 0.25s",
                position: "relative", overflow: "visible",
              }}
              onMouseEnter={e => { if (!hasVoted) { e.currentTarget.style.background = C.brand; e.currentTarget.style.borderColor = C.brand; e.currentTarget.style.color = "#fff"; }}}
              onMouseLeave={e => { if (!hasVoted) { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}}
              >
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block", transition: "all 0.2s" }}>
                    <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={hasVoted ? 0 : 2} strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <span
                    className={`vote-ghost${voteAnim ? " active" : ""}`}
                    style={{ color: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
                      <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
                <span style={{ lineHeight: 1 }}>{p.weighted.toLocaleString()}</span>
              </button>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  padding: "10px 24px", borderRadius: 10,
                  border: "none", background: C.accent, color: "#fff",
                  fontSize: T.body, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--sans)", transition: "opacity 0.15s",
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Try it {"\u2192"}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="fade-up stagger-2" style={{ marginBottom: 0 }}>
          <RichTextDisplay description={p.description} />

          {/* Creators */}
          <div style={{ marginBottom: (p.collabs.length > 0) ? 20 : 28 }}>
            <div style={{ fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)" }}>
              {(p.creators || []).length > 0 ? "Creators" : "Creator"}
            </div>
            <div style={{ position: "relative", ...(isMobile ? { margin: "0 -16px" } : {}) }}>
            {isMobile && <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 32, background: `linear-gradient(to left, ${C.bg}, transparent)`, zIndex: 1, pointerEvents: "none" }} />}
            <div style={{ display: "flex", gap: 10, ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "0 16px" } : { flexWrap: "wrap" }) }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderRadius: 12,
                background: C.surface, border: `1px solid ${C.border}`, flexShrink: 0,
              }}>
                <Av initials={p.builder.avatar} size={34} src={p.builder.avatarUrl} />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.text, fontFamily: "var(--sans)", lineHeight: 1.2 }}>{p.builder.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 450, lineHeight: 1.2 }}>
                    <span>{p.builder.title}</span>
                    {p.builder.company && (
                      <>
                        <span style={{
                          width: 14, height: 14, borderRadius: 4,
                          background: p.builder.companyColor || C.accent,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: T.micro, fontWeight: 800, color: "#fff", fontFamily: "var(--sans)", flexShrink: 0,
                          overflow: "hidden", position: "relative",
                        }}>
                          {p.builder.company[0]}
                          <img src={getCompanyLogoUrl(p.builder.company, p.builder.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        </span>
                        <span style={{ fontWeight: 520, color: C.textSec }}>{p.builder.company}</span>
                      </>
                    )}
                    <span style={{ opacity: 0.35, margin: "0 2px" }}>{"\u00B7"}</span>
                    <span>{p.builder.city}</span>
                  </div>
                </div>
              </div>
              {(p.creators || []).map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", borderRadius: 12,
                  background: C.surface, border: `1px solid ${C.border}`, flexShrink: 0,
                }}>
                  <Av initials={c.avatar} size={30} src={c.avatarUrl} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: T.bodySm, fontWeight: 580, color: C.text, fontFamily: "var(--sans)", lineHeight: 1.2 }}>{c.name}</span>
                    {c.title && c.company && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 450, lineHeight: 1.2 }}>
                        <span>{c.title}</span>
                        <span style={{
                          width: 13, height: 13, borderRadius: 3,
                          background: c.companyColor || C.accent,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: T.micro, fontWeight: 800, color: "#fff", fontFamily: "var(--sans)", flexShrink: 0,
                          overflow: "hidden", position: "relative",
                        }}>
                          {c.company[0]}
                          <img src={getCompanyLogoUrl(c.company, c.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        </span>
                        <span style={{ fontWeight: 520, color: C.textSec }}>{c.company}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* Collaborators */}
          {p.collabs.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)" }}>Collaborators</div>
              <div style={{ position: "relative", ...(isMobile ? { margin: "0 -16px" } : {}) }}>
              {isMobile && <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 32, background: `linear-gradient(to left, ${C.bg}, transparent)`, zIndex: 1, pointerEvents: "none" }} />}
              <div style={{ display: "flex", gap: 10, ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "0 16px" } : { flexWrap: "wrap" }) }}>
                {p.collabs.map((c, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", borderRadius: 12,
                    background: C.surface, border: `1px solid ${C.border}`, flexShrink: 0,
                  }}>
                    <Av initials={c.avatar} size={30} src={c.avatarUrl} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: T.bodySm, fontWeight: 580, color: C.text, fontFamily: "var(--sans)", lineHeight: 1.2 }}>{c.name}</span>
                      {c.title && c.company && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)", fontWeight: 450, lineHeight: 1.2 }}>
                          <span>{c.title}</span>
                          <span style={{
                            width: 13, height: 13, borderRadius: 3,
                            background: c.companyColor || C.accent,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: T.micro, fontWeight: 800, color: "#fff", fontFamily: "var(--sans)", flexShrink: 0,
                            overflow: "hidden", position: "relative",
                          }}>
                            {c.company[0]}
                            <img src={getCompanyLogoUrl(c.company, c.companyLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          </span>
                          <span style={{ fontWeight: 520, color: C.textSec }}>{c.company}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          {/* Tech stack */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontFamily: "var(--sans)" }}>Tech stack</div>
            <div style={{ position: "relative", ...(isMobile ? { margin: "0 -16px" } : {}) }}>
            {isMobile && <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 32, background: `linear-gradient(to left, ${C.bg}, transparent)`, zIndex: 1, pointerEvents: "none" }} />}
            <div style={{ display: "flex", gap: 8, ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "0 16px" } : { flexWrap: "wrap" }) }}>
              {p.stack.map((t, i) => {
                const meta = STACK_META[t] || { icon: t[0], bg: C.accent, color: "#fff" };
                const logoUrl = getStackLogoUrl(t);
                return (
                  <div key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "6px 16px 6px 8px", borderRadius: 40,
                    background: C.surface, border: `1px solid ${C.border}`, flexShrink: 0,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: meta.bg, color: meta.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: T.badge, fontWeight: 750, fontFamily: "var(--sans)",
                      flexShrink: 0, letterSpacing: "-0.02em",
                      position: "relative", overflow: "hidden",
                    }}>
                      {meta.icon}
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt={t}
                          style={{
                            position: "absolute", top: 0, left: 0,
                            width: 22, height: 22, borderRadius: 6,
                            objectFit: "contain", background: "#fff",
                          }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                    <span style={{ fontSize: T.bodySm, color: C.text, fontWeight: 500, fontFamily: "var(--sans)", whiteSpace: "nowrap" }}>{t}</span>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* DISCUSSION */}
        <div className="fade-up stagger-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: T.headingLg, fontWeight: 400, color: C.text, fontFamily: "var(--serif)" }}>Discussion</h2>
          </div>

          <div style={{
            display: "flex", gap: 14, padding: "18px 20px",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, marginBottom: 4,
          }}>
            <Av initials={user?.avatar || "U"} size={36} role={user?.role || "founder"} src={user?.avatarUrl} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ask a question or share your thoughts..."
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostComment(); }}}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: 10,
                  border: `1px solid ${C.borderLight}`, fontSize: T.body,
                  color: C.text, fontFamily: "var(--sans)",
                  background: "transparent", outline: "none",
                  resize: "none", minHeight: 44, lineHeight: 1.5,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = C.borderLight; }}
                onFocus={e => { e.currentTarget.style.borderColor = C.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.borderLight; }}
              />
              {comment.trim() && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handlePostComment}
                    disabled={postingComment}
                    style={{
                      padding: "7px 18px", borderRadius: 8,
                      border: "none", background: C.accent, color: "#fff",
                      fontSize: T.bodySm, fontWeight: 600, cursor: "pointer",
                      fontFamily: "var(--sans)", opacity: postingComment ? 0.6 : 1,
                    }}
                  >
                    {postingComment ? "Posting..." : "Post"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments — threaded */}
          {commentTree.map(({ root, replies }) => {
            const rootInitials = root.authorAvatar || (root.authorName ? root.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?");
            const isRootOP = p.builder?.name && root.authorName === p.builder.name;
            return (
              <div key={root.id} style={{ padding: "24px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Av initials={rootInitials} size={38} highlight={!!isRootOP} role={root.authorRole || "member"} src={root.authorAvatarUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: T.body, fontWeight: 620, color: C.text, fontFamily: "var(--sans)" }}>
                        {root.authorName || "Anonymous"}
                      </span>
                      <CompanyTag title={root.authorTitle || (isRootOP ? p.builder.title : undefined)} company={root.authorCompany || (isRootOP ? p.builder.company : undefined)} companyColor={root.authorCompanyColor || (isRootOP ? p.builder.companyColor : undefined)} companyLogo={root.authorCompanyLogo || (isRootOP ? p.builder.companyLogo : undefined)} />
                      {isRootOP && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#059669", letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                      )}
                      <Badge role={root.authorRole || "member"} />
                      <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                        {timeAgo(root.createdAt)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: T.body, lineHeight: 1.65, color: C.text,
                      fontFamily: "var(--sans)", margin: "0 0 14px", fontWeight: 400,
                      whiteSpace: "pre-wrap",
                    }}>
                      {root.content}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <Reactions reactions={root.reactions} onReact={(code) => handleReact(root.id, code)} />
                      {replies.length > 0 && (
                        <button onClick={() => setReplyingTo(replyingTo === root.id ? null : root.id)} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 12px", borderRadius: 8,
                          border: "none", background: replyingTo === root.id ? C.accentSoft : "transparent",
                          cursor: "pointer", fontSize: T.bodySm, fontWeight: 600,
                          color: C.blue, fontFamily: "var(--sans)",
                        }}>
                          {replies.length} {replies.length === 1 ? "reply" : "replies"}
                          <span style={{ fontSize: 9, transform: replyingTo === root.id ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>{"\u25BC"}</span>
                        </button>
                      )}
                      {replies.length === 0 && (
                        <button onClick={() => {
                          if (!user) { openLoginDialog(() => { reloadUser(); reloadComments(); }); return; }
                          setReplyingTo(replyingTo === root.id ? null : root.id);
                        }} style={{
                          padding: "5px 12px", borderRadius: 8, border: "none",
                          background: "transparent", cursor: "pointer",
                          fontSize: T.label, fontWeight: 500, color: C.textMute, fontFamily: "var(--sans)",
                        }}>Reply</button>
                      )}
                    </div>

                    {/* Nested replies */}
                    {(replyingTo === root.id || replies.length > 0) && replyingTo === root.id && (
                      <div style={{ marginTop: 16, borderLeft: `2px solid ${C.borderLight}`, paddingLeft: isMobile ? 12 : 20, marginLeft: 2 }}>
                        {replies.map((reply, i) => {
                          const replyInitials = reply.authorAvatar || (reply.authorName ? reply.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?");
                          const isReplyOP = p.builder?.name && reply.authorName === p.builder.name;
                          return (
                            <div key={reply.id} style={{ padding: "16px 0", borderBottom: i < replies.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                              {isReplyOP ? (
                                <div style={{
                                  background: `linear-gradient(90deg, ${C.goldSoft} 0%, transparent 100%)`,
                                  margin: "-16px -16px 0 -20px", padding: "16px 16px 16px 20px",
                                  borderRadius: "0 10px 10px 0",
                                }}>
                                  <div style={{ display: "flex", gap: 10 }}>
                                    <Av initials={replyInitials} size={30} highlight role={reply.authorRole || "member"} src={reply.authorAvatarUrl} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: T.bodySm, fontWeight: 650, color: C.text }}>{reply.authorName}</span>
                                        <CompanyTag title={reply.authorTitle || p.builder.title} company={reply.authorCompany || p.builder.company} companyColor={reply.authorCompanyColor || p.builder.companyColor} companyLogo={reply.authorCompanyLogo || p.builder.companyLogo} />
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#059669", letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                                        <Badge role={reply.authorRole || "member"} />
                                        <span style={{ fontSize: T.caption, color: C.textMute }}>{timeAgo(reply.createdAt)}</span>
                                      </div>
                                      <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400, whiteSpace: "pre-wrap" }}>{reply.content}</p>
                                      <Reactions reactions={reply.reactions} onReact={(code) => handleReact(reply.id, code)} />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 10 }}>
                                  <Av initials={replyInitials} size={30} role={reply.authorRole || "member"} src={reply.authorAvatarUrl} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                      <span style={{ fontSize: T.bodySm, fontWeight: 620, color: C.text }}>{reply.authorName}</span>
                                      <CompanyTag title={reply.authorTitle} company={reply.authorCompany} companyColor={reply.authorCompanyColor} companyLogo={reply.authorCompanyLogo} />
                                      <Badge role={reply.authorRole || "member"} />
                                      <span style={{ fontSize: T.caption, color: C.textMute }}>{timeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400, whiteSpace: "pre-wrap" }}>{reply.content}</p>
                                    <Reactions reactions={reply.reactions} onReact={(code) => handleReact(reply.id, code)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Reply compose */}
                        {user && (
                          <div style={{ display: "flex", gap: 10, paddingTop: 14 }}>
                            <Av initials={user.avatar || "U"} size={28} role={user.role || "member"} src={user.avatarUrl} />
                            <div style={{ flex: 1, display: "flex", gap: 8 }}>
                              <input
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePostReply(root.id); }}}
                                style={{
                                  flex: 1, padding: "8px 14px", borderRadius: 8,
                                  border: `1px solid ${C.borderLight}`, fontSize: T.body,
                                  color: C.text, fontFamily: "var(--sans)",
                                  background: "transparent", outline: "none",
                                }}
                              />
                              {replyText.trim() && (
                                <button
                                  onClick={() => handlePostReply(root.id)}
                                  disabled={postingComment}
                                  style={{
                                    padding: "7px 14px", borderRadius: 8,
                                    border: "none", background: C.accent, color: "#fff",
                                    fontSize: T.label, fontWeight: 600, cursor: "pointer",
                                    fontFamily: "var(--sans)", opacity: postingComment ? 0.6 : 1,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {threads.map(t => <ThreadBlock key={t.id} thread={t} />)}
        </div>
    </div>
  );
}
