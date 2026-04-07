import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
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
import MediaGallery from "@/components/MediaGallery";
import ProjectIcon from "@/components/ProjectIcon";

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

function renderContentWithMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span key={i} style={{
          color: C.blue, fontWeight: 600,
          background: C.blueSoft, borderRadius: 4,
          padding: "0 3px",
        }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function Av({ initials, size = 32, highlight, role, src }: { initials: string; size?: number; highlight?: boolean; role?: string; src?: string }) {
  const r = role ? ROLES[role] : undefined;
  if (src && src.startsWith("http")) {
    return (
      <img src={src} alt={initials} style={{
        width: size, height: size, borderRadius: size,
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
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ role, size = "sm" }: { role: string; size?: "sm" | "md" }) {
  if (role === "member") return null;
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
      fontSize: T.label, color: C.textSec, fontFamily: "var(--sans)", fontWeight: 450,
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
        <span style={{ fontWeight: 520 }}>{company}</span>
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
  return (
    <div style={{ padding: "24px 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ display: "flex", gap: 14 }}>
        <Av initials={thread.author.avatar} size={52} role={thread.author.role} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: T.body, fontWeight: 620, color: C.text, fontFamily: "var(--sans)" }}>{thread.author.name}</span>
              <Badge role={thread.author.role} />
              <span style={{ fontSize: T.label, color: C.textMute }}>{thread.time}</span>
            </div>
            <CompanyTag title={thread.author.title} company={thread.author.company} companyColor={thread.author.companyColor} companyLogo={thread.author.companyLogo} />
          </div>
          <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, fontFamily: "var(--sans)", margin: "0 0 14px", fontWeight: 400 }}>{thread.content}</p>
          <Reactions reactions={thread.reactions} />
        </div>
      </div>

      {/* Replies — indented under parent */}
      {/* Replies with curved connectors */}
      {thread.replies.map((reply, i) => {
        const isLast = i === thread.replies.length - 1;
        return (
          <div key={i} style={{ position: "relative", paddingTop: 14, paddingLeft: 66 }}>
            {!isLast && (
              <div style={{ position: "absolute", left: 25, top: 0, bottom: 0, width: 2, background: C.borderLight }} />
            )}
            <div style={{
              position: "absolute", left: 25, top: 0, width: 30, height: 40,
              borderLeft: `2px solid ${C.borderLight}`, borderBottom: `2px solid ${C.borderLight}`,
              borderBottomLeftRadius: 12, borderRight: "none", borderTop: "none",
            }} />
            <div style={{ display: "flex", gap: 12 }}>
              <Av initials={reply.author.avatar} size={52} role={reply.author.role} />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: T.body, fontWeight: 620, color: C.text }}>{reply.author.name}</span>
                    {reply.author.isCreator && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: C.creatorBg, color: C.creator, letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                    )}
                    <Badge role={reply.author.role} />
                    <span style={{ fontSize: T.caption, color: C.textMute }}>{reply.time}</span>
                  </div>
                  <CompanyTag title={reply.author.title} company={reply.author.company} companyColor={reply.author.companyColor} companyLogo={reply.author.companyLogo} />
                </div>
                <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400 }}>{reply.content}</p>
                <Reactions reactions={reply.reactions} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { openLoginDialog } = useLoginDialog();
  const { setNavOverride, clearNavOverride, setVoteState, setShowVoteInNav } = useNavOverride();
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
  const voteBtnRef = useRef<HTMLDivElement>(null);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Array<{_id: string; name: string; avatar: string; avatarUrl?: string; company?: string}>>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionTarget, setMentionTarget] = useState<"comment" | "reply" | null>(null);
  const [pendingMentions, setPendingMentions] = useState<Array<{userId: string; name: string}>>([]);
  const mentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bxApi(`/projects/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.project) return;
        const p = normalizeProject(d.project);
        setProject(p);
        const pid = p._id || p.id;
        bxApi(`/comments?projectId=${pid}`)
          .then((r) => r.json())
          .then((d) => setComments((d.comments || []).map(normalizeComment)));
        bxApi("/projects?limit=100")
          .then((r) => r.json())
          .then((d) => {
            const voted = d.votedProjectIds || d.votedIds || d.voted_ids || [];
            setHasVoted(voted.includes(String(pid)) || voted.includes(Number(pid)));
          });
      });
    bxApi("/threads")
      .then((r) => r.json())
      .then((d) => setThreads((d.threads || []).map((t: Record<string, unknown>) => normalizeThread(t))));
    bxApi("/me")
      .then((r) => r.json())
      .then((d) => setUser(normalizeUser(d.user)));
  }, [params.id]);

  useEffect(() => {
    if (project) {
      setNavOverride({ title: project.name, backHref: "/" });
    }
    return () => clearNavOverride();
  }, [project, setNavOverride, clearNavOverride]);

  // Keep nav vote state in sync
  const handleVoteRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (project) {
      setVoteState({ hasVoted, count: project.weighted, onVote: () => handleVoteRef.current() });
    }
    return () => setVoteState(null);
  }, [project, hasVoted, setVoteState]);

  // IntersectionObserver: show vote button in nav when hero vote button scrolls out (desktop only)
  useEffect(() => {
    if (isMobile) { setShowVoteInNav(false); return; }
    const el = voteBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowVoteInNav(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); setShowVoteInNav(false); };
  }, [project, setShowVoteInNav, isMobile]);

  const reloadUser = () => {
    bxApi("/me").then((r) => r.json()).then((d) => setUser(normalizeUser(d.user)));
    bxApi("/projects?limit=100").then((r) => r.json()).then((d) => {
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
    setTimeout(() => setVoteAnim(false), 500);
    // Burst particles
    const btn = document.querySelector(isMobile ? "[data-vote-float]" : "[data-vote-detail]") as HTMLElement;
    if (btn && !hasVoted) {
      const rect = btn.getBoundingClientRect();
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
    const res = await bxApi("/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project?._id || project?.id || params.id }),
    });
    if (!res.ok) return;
    const result = await res.json();
    setHasVoted(result.voted);
    const w = result.weighted ?? result.weighted_votes ?? result.weightedVotes ?? 0;
    const r = result.raw ?? result.raw_votes ?? result.rawVotes ?? 0;
    setProject((p) => p ? { ...p, weighted: w, raw: r } : p);
  };
  handleVoteRef.current = handleVote;

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
        body: JSON.stringify({ projectId: project?._id || project?.id || params.id, content: comment.trim(), mentions: pendingMentions.length > 0 ? pendingMentions : undefined }),
      });
      if (res.ok) {
        setComment("");
        setPendingMentions([]);
        reloadComments();
      }
    } finally {
      setPostingComment(false);
    }
  };

  const reloadComments = () => {
    bxApi(`/comments?projectId=${project?._id || project?.id || params.id}`)
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
        body: JSON.stringify({ projectId: project?._id || project?.id || params.id, content: replyText.trim(), parentId, mentions: pendingMentions.length > 0 ? pendingMentions : undefined }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyingTo(null);
        setPendingMentions([]);
        reloadComments();
      }
    } finally {
      setPostingComment(false);
    }
  };

  // @mention helpers
  const handleMentionSearch = (query: string, target: "comment" | "reply") => {
    setMentionTarget(target);
    if (query.length < 1) { setMentionQuery(null); setMentionResults([]); return; }
    setMentionQuery(query);
    if (mentionTimer.current) clearTimeout(mentionTimer.current);
    if (query.length < 2) { setMentionResults([]); return; }
    setMentionLoading(true);
    mentionTimer.current = setTimeout(() => {
      bxApi(`/users/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(d => {
          setMentionResults((d.users || []).slice(0, 5).map((u: Record<string, unknown>) => ({
            _id: u._id as string,
            name: u.name as string,
            avatar: (u.initials ?? u.avatar ?? "?") as string,
            avatarUrl: (u.avatar_url ?? undefined) as string | undefined,
            company: (u.company ?? "") as string,
          })));
        })
        .finally(() => setMentionLoading(false));
    }, 200);
  };

  const handleTextChangeWithMention = (
    value: string,
    cursorPos: number,
    setter: (v: string) => void,
    target: "comment" | "reply"
  ) => {
    setter(value);
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(^|\s)@([^\s@]*)$/);
    if (mentionMatch) {
      handleMentionSearch(mentionMatch[2], target);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  };

  const handlePickMention = (pickedUser: { _id: string; name: string }) => {
    const insertName = pickedUser.name;
    if (mentionTarget === "comment") {
      const el = commentTextareaRef.current;
      if (!el) return;
      const cursorPos = el.selectionStart ?? comment.length;
      const textBeforeCursor = comment.slice(0, cursorPos);
      const mentionStart = textBeforeCursor.lastIndexOf("@");
      const newValue = comment.slice(0, mentionStart) + "@" + insertName + " " + comment.slice(cursorPos);
      setComment(newValue);
      setTimeout(() => {
        const newCursor = mentionStart + insertName.length + 2;
        el.setSelectionRange(newCursor, newCursor);
        el.focus();
      }, 0);
    } else if (mentionTarget === "reply") {
      const el = replyInputRef.current;
      if (!el) return;
      const cursorPos = el.selectionStart ?? replyText.length;
      const textBeforeCursor = replyText.slice(0, cursorPos);
      const mentionStart = textBeforeCursor.lastIndexOf("@");
      const newValue = replyText.slice(0, mentionStart) + "@" + insertName + " " + replyText.slice(cursorPos);
      setReplyText(newValue);
      setTimeout(() => {
        const newCursor = mentionStart + insertName.length + 2;
        el.setSelectionRange(newCursor, newCursor);
        el.focus();
      }, 0);
    }
    // Track mention for backend notification
    setPendingMentions(prev => {
      if (prev.some(m => m.userId === pickedUser._id)) return prev;
      return [...prev, { userId: pickedUser._id, name: pickedUser.name }];
    });
    setMentionQuery(null);
    setMentionResults([]);
    setMentionTarget(null);
  };

  const dismissMention = () => {
    setTimeout(() => { setMentionQuery(null); setMentionResults([]); }, 150);
  };

  const MentionDropdown = () => {
    if (mentionQuery === null || (mentionResults.length === 0 && !mentionLoading)) return null;
    return (
      <div style={{
        position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200,
        overflow: "hidden", maxHeight: 220, overflowY: "auto",
      }}>
        {mentionLoading && mentionResults.length === 0 && (
          <div style={{ padding: "10px 14px", fontSize: T.bodySm, color: C.textMute, fontFamily: "var(--sans)" }}>
            Searching...
          </div>
        )}
        {mentionResults.map(u => (
          <button
            key={u._id}
            onMouseDown={e => { e.preventDefault(); handlePickMention(u); }}
            style={{
              width: "100%", padding: "9px 14px", border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              textAlign: "left", fontFamily: "var(--sans)", transition: "background 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <Av initials={u.avatar} size={26} src={u.avatarUrl} />
            <div>
              <div style={{ fontSize: T.bodySm, fontWeight: 600, color: C.text }}>{u.name}</div>
              {u.company && <div style={{ fontSize: T.caption, color: C.textMute }}>{u.company}</div>}
            </div>
          </button>
        ))}
      </div>
    );
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
  const isOwner = user?._id && (user._id === p.builder._id || p.creators?.some(c => c._id === user._id));

  return (
    <div className="responsive-main" style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "48px 32px 140px" : "48px 32px 100px", fontFamily: "var(--sans)" }}>
        {/* Hero */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <ProjectIcon title={p.name} description={p.tagline} size={72} iconId={p.icon} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2, flexWrap: "wrap" }}>
                  <h1 className="responsive-h1" style={{ fontSize: T.heading, fontWeight: 400, color: C.text, fontFamily: "var(--serif)", lineHeight: 1.1 }}>{p.name}</h1>
                  {p.featured && (
                    <span style={{
                      fontSize: T.badge, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
                      background: C.goldSoft, color: C.gold, border: `1px solid ${C.goldBorder}`,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>{"\u2726"} Featured</span>
                  )}
                </div>
                <p style={{ fontSize: T.bodyLg, color: C.textSec, fontFamily: "var(--serif)", fontWeight: 400, lineHeight: 1.4, fontStyle: "italic", margin: "0 0 6px" }}>{p.tagline}</p>
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
            </div>
            <div ref={voteBtnRef} style={{ flexShrink: 0, display: isMobile ? "none" : "flex", gap: 10, alignItems: "center" }}>
              <button data-vote-detail onClick={handleVote}
              className={voteAnim ? "vote-pop-active" : ""}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 28px", borderRadius: 12,
                border: "1.5px solid transparent",
                background: C.accent,
                cursor: "pointer", fontSize: T.bodyLg, fontWeight: 700,
                fontFamily: "var(--sans)", color: C.accentFg,
                transition: "opacity 0.2s, transform 0.2s",
                position: "relative", overflow: "visible",
                boxShadow: hasVoted ? `0 0 0 3px ${C.accentSoft}` : "none",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
                  <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" fill="currentColor" stroke="none" />
                </svg>
                <span style={{ lineHeight: 1 }}>{hasVoted ? "Voted" : "Upvote"} {"\u00B7"} {p.weighted.toLocaleString()}</span>
              </button>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "none", background: "transparent", color: C.textSec,
                  fontSize: T.bodySm, fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--sans)", transition: "color 0.15s",
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textSec; }}
                >
                  Try it {"\u2192"}
                </a>
              )}
              {isOwner && (
                <Link to="/my-projects" style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "none", background: "transparent", color: C.textSec,
                  fontSize: T.bodySm, fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--sans)", transition: "color 0.15s",
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textSec; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Manage
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Draft banner */}
        {p.isDraft && (
          <div className="fade-up stagger-1" style={{
            padding: "14px 20px", borderRadius: 12, marginBottom: 24,
            background: C.goldSoft, border: `1px solid ${C.goldBorder}`,
            display: "flex", alignItems: "center", gap: 10,
            fontSize: T.bodySm, fontFamily: "var(--sans)", color: C.text,
          }}>
            <span style={{ fontSize: T.bodyLg }}>&#9998;</span>
            <div>
              <span style={{ fontWeight: 600 }}>Draft</span>
              <span style={{ color: C.textSec, fontWeight: 400 }}> — This project is not yet published. {isOwner ? "Add a product URL and publish to make it visible." : "The creator hasn\u2019t published it yet."}</span>
            </div>
          </div>
        )}

        {/* Media gallery */}
        {p.media && p.media.length > 0 && (
          <div className="fade-up stagger-2" style={{ marginBottom: 0 }}>
            <MediaGallery media={p.media} />
          </div>
        )}

        {/* Product info */}
        <div className="fade-up stagger-2" style={{ marginBottom: 0 }}>
          <RichTextDisplay description={p.description} />

          {/* Build process */}
          {p.buildProcess && (
            <div style={{ marginTop: 28 }}>
              <div style={{
                fontSize: T.badge, fontWeight: 700, color: C.textMute, letterSpacing: "0.08em",
                textTransform: "uppercase", marginBottom: 14, fontFamily: "var(--sans)",
              }}>
                How it was built
              </div>
              <RichTextDisplay description={p.buildProcess} />
            </div>
          )}

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
                const meta = STACK_META[t] || { icon: t[0], bg: C.accent, color: C.accentFg };
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
              <div style={{ position: "relative" }}>
                <textarea
                  ref={commentTextareaRef}
                  value={comment}
                  onChange={e => handleTextChangeWithMention(e.target.value, e.target.selectionStart ?? e.target.value.length, setComment, "comment")}
                  placeholder="Ask a question or share your thoughts..."
                  onKeyDown={e => {
                    if (e.key === "Escape" && mentionQuery !== null) { e.stopPropagation(); setMentionQuery(null); setMentionResults([]); return; }
                  }}
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
                  onBlur={e => { e.currentTarget.style.borderColor = C.borderLight; dismissMention(); }}
                />
                {mentionTarget === "comment" && <MentionDropdown />}
              </div>
              {comment.trim() && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handlePostComment}
                    disabled={postingComment}
                    style={{
                      padding: "7px 18px", borderRadius: 8,
                      border: "none", background: C.accent, color: C.accentFg,
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

          {/* Comments -- threaded */}
          {commentTree.map(({ root, replies }) => {
            const rootInitials = root.authorAvatar || (root.authorName ? root.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?");
            const isRootOP = p.builder?.name && root.authorName === p.builder.name;
            return (
              <div key={root.id} style={{ padding: "24px 0", borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Av initials={rootInitials} size={52} role={root.authorRole || "member"} src={root.authorAvatarUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: T.body, fontWeight: 620, color: C.text, fontFamily: "var(--sans)" }}>
                          {root.authorName || "Anonymous"}
                        </span>
                        {isRootOP && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: C.creatorBg, color: C.creator, letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                        )}
                        <Badge role={root.authorRole || "member"} />
                        <span style={{ fontSize: T.label, color: C.textMute, fontFamily: "var(--sans)" }}>
                          {timeAgo(root.createdAt)}
                        </span>
                      </div>
                      <CompanyTag title={root.authorTitle || (isRootOP ? p.builder.title : undefined)} company={root.authorCompany || (isRootOP ? p.builder.company : undefined)} companyColor={root.authorCompanyColor || (isRootOP ? p.builder.companyColor : undefined)} companyLogo={root.authorCompanyLogo || (isRootOP ? p.builder.companyLogo : undefined)} />
                    </div>
                    <p style={{
                      fontSize: T.body, lineHeight: 1.65, color: C.text,
                      fontFamily: "var(--sans)", margin: "0 0 14px", fontWeight: 400,
                      whiteSpace: "pre-wrap",
                    }}>
                      {renderContentWithMentions(root.content)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <Reactions reactions={root.reactions} onReact={(code) => handleReact(root.id, code)} />
                      <button onClick={() => {
                        if (!user) { openLoginDialog(() => { reloadUser(); reloadComments(); }); return; }
                        setReplyingTo(replyingTo === root.id ? null : root.id);
                      }} style={{
                        padding: "5px 12px", borderRadius: 8, border: "none",
                        background: replyingTo === root.id ? C.accentSoft : "transparent",
                        cursor: "pointer", fontSize: T.label, fontWeight: 500,
                        color: replyingTo === root.id ? C.blue : C.textMute, fontFamily: "var(--sans)",
                      }}>Reply</button>
                    </div>

                  </div>
                </div>

                {/* Replies — indented with curved connectors */}
                {replies.map((reply, i) => {
                  const replyInitials = reply.authorAvatar || (reply.authorName ? reply.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?");
                  const isReplyOP = p.builder?.name && reply.authorName === p.builder.name;
                  const isLast = i === replies.length - 1;
                  return (
                    <div key={reply.id} style={{ position: "relative", paddingTop: 14, paddingLeft: 66 }}>
                      {!isLast && (
                        <div style={{ position: "absolute", left: 25, top: 0, bottom: 0, width: 2, background: C.borderLight }} />
                      )}
                      <div style={{
                        position: "absolute", left: 25, top: 0, width: 30, height: 40,
                        borderLeft: `2px solid ${C.borderLight}`, borderBottom: `2px solid ${C.borderLight}`,
                        borderBottomLeftRadius: 12, borderRight: "none", borderTop: "none",
                      }} />
                      <div style={{ display: "flex", gap: 12 }}>
                      <Av initials={replyInitials} size={52} role={reply.authorRole || "member"} src={reply.authorAvatarUrl} />
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: T.body, fontWeight: 620, color: C.text }}>{reply.authorName}</span>
                            {isReplyOP && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: T.badge, fontWeight: 650, padding: "2px 8px", borderRadius: 4, background: C.creatorBg, color: C.creator, letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{"\u2666"} Creator</span>
                            )}
                            <Badge role={reply.authorRole || "member"} />
                            <span style={{ fontSize: T.caption, color: C.textMute }}>{timeAgo(reply.createdAt)}</span>
                          </div>
                          <CompanyTag title={isReplyOP ? (reply.authorTitle || p.builder.title) : reply.authorTitle} company={isReplyOP ? (reply.authorCompany || p.builder.company) : reply.authorCompany} companyColor={isReplyOP ? (reply.authorCompanyColor || p.builder.companyColor) : reply.authorCompanyColor} companyLogo={isReplyOP ? (reply.authorCompanyLogo || p.builder.companyLogo) : reply.authorCompanyLogo} />
                        </div>
                        <p style={{ fontSize: T.body, lineHeight: 1.65, color: C.text, margin: "0 0 10px", fontWeight: 400, whiteSpace: "pre-wrap" }}>{renderContentWithMentions(reply.content)}</p>
                        <Reactions reactions={reply.reactions} onReact={(code) => handleReact(reply.id, code)} />
                      </div>
                      </div>
                    </div>
                  );
                })}

                {/* Reply compose */}
                {replyingTo === root.id && user && (
                  <div style={{ position: "relative", paddingTop: 14, paddingLeft: 66 }}>
                    <div style={{
                      position: "absolute", left: 25, top: 0, width: 30, height: 28,
                      borderLeft: `2px solid ${C.borderLight}`, borderBottom: `2px solid ${C.borderLight}`,
                      borderBottomLeftRadius: 12, borderRight: "none", borderTop: "none",
                    }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <Av initials={user.avatar || "U"} size={28} role={user.role || "member"} src={user.avatarUrl} />
                    <div style={{ flex: 1, display: "flex", gap: 8, position: "relative" }}>
                      <input
                        ref={replyInputRef}
                        value={replyText}
                        onChange={e => handleTextChangeWithMention(e.target.value, e.target.selectionStart ?? e.target.value.length, setReplyText, "reply")}
                        placeholder="Write a reply..."
                        onKeyDown={e => {
                          if (e.key === "Escape" && mentionQuery !== null) { e.stopPropagation(); setMentionQuery(null); setMentionResults([]); return; }
                          if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) { e.preventDefault(); handlePostReply(root.id); }
                        }}
                        onBlur={() => dismissMention()}
                        style={{
                          flex: 1, padding: "8px 14px", borderRadius: 8,
                          border: `1px solid ${C.borderLight}`, fontSize: T.body,
                          color: C.text, fontFamily: "var(--sans)",
                          background: "transparent", outline: "none",
                        }}
                      />
                      {mentionTarget === "reply" && <MentionDropdown />}
                      {replyText.trim() && (
                        <button
                          onClick={() => handlePostReply(root.id)}
                          disabled={postingComment}
                          style={{
                            padding: "7px 14px", borderRadius: 8,
                            border: "none", background: C.accent, color: C.accentFg,
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
                  </div>
                )}
              </div>
            );
          })}

          {threads.map(t => <ThreadBlock key={t.id} thread={t} />)}
        </div>

        {/* Mobile floating bottom bar */}
        {isMobile && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
            background: C.bg, borderTop: `1px solid ${C.border}`,
            padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            display: "flex", gap: 10,
            boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
          }}>
            <button
              data-vote-float
              onClick={handleVote}
              className={voteAnim ? "vote-pop-active" : ""}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 20px", borderRadius: 12, border: "none",
                background: C.accent, cursor: "pointer",
                fontSize: T.body, fontWeight: 700, fontFamily: "var(--sans)",
                color: C.accentFg, transition: "opacity 0.2s",
                position: "relative", overflow: "visible",
                boxShadow: hasVoted ? `0 0 0 3px ${C.accentSoft}` : "none",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
                <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" fill="currentColor" stroke="none" />
              </svg>
              <span style={{ lineHeight: 1 }}>{hasVoted ? "Voted" : "Upvote"} {"\u00B7"} {p.weighted.toLocaleString()}</span>
            </button>
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                padding: "13px 20px", borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                fontSize: T.body, fontWeight: 600, fontFamily: "var(--sans)",
                textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap",
              }}>
                Try it {"\u2192"}
              </a>
            )}
            {isOwner && (
              <Link to="/my-projects" style={{
                padding: "13px 20px", borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                fontSize: T.body, fontWeight: 600, fontFamily: "var(--sans)",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Manage
              </Link>
            )}
          </div>
        )}
    </div>
  );
}
