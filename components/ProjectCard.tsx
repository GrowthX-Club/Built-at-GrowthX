import { Link } from "react-router";
import { useState } from "react";
import { type Project, teamOf, projectThumb } from "@/types";
import { sprintPill } from "@/lib/collections";

// A project card, ported from Devpost's project gallery: the product's own screenshot on top (every card has the
// same 16:10 slot; without a screenshot it shows one typographic title card), the judged result as Devpost's corner
// ribbon, name and tagline, then the makers strip with the upvote. The name's link covers the card; the upvote is
// its own button above it.

const RIBBON: Record<string, string> = { "rank-1": "1st place", "rank-2": "2nd place", "rank-3": "3rd place", "top-5": "Top 5", "top-15": "Top 15" };

export function VotePill({ count, voted, onVote, voteId, name }: { count: number; voted: boolean; onVote: () => void; voteId?: string | number; name: string }) {
  return (
    <button
      type="button"
      className={`vote-pill${voted ? " is-voted" : ""}`}
      data-vote-id={voteId}
      aria-pressed={voted}
      aria-label={`${voted ? "Remove upvote from" : "Upvote"} ${name}${count > 0 ? ` (${count})` : ""}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" />
      </svg>
      {count > 0 && <span>{count.toLocaleString()}</span>}
    </button>
  );
}

/** "udayan walvekar, Sudesh Das +1": up to two names, then how many more. */
export function makersLine(p: Project): string {
  const team = teamOf(p);
  return team.slice(0, 2).map(m => m.name).join(", ") + (team.length > 2 ? ` +${team.length - 2}` : "");
}

export function Faces({ people, max = 3 }: { people: { name: string; avatar: string; avatarUrl?: string }[]; max?: number }) {
  return (
    <span className="faces" aria-hidden="true">
      {people.slice(0, max).map((m, i) => m.avatarUrl?.startsWith("http")
        ? <img key={i} className="face" src={m.avatarUrl} alt="" loading="lazy" decoding="async" />
        : <span key={i} className="face">{m.avatar?.[0] ?? "?"}</span>)}
    </span>
  );
}

/** The host a project lives on ("smriti.app"), for the no-screenshot title card. */
export function hostOf(url?: string): string {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

/**
 * The 16:10 media slot: the product's screenshot, else a still from the maker's demo video (marked with a play
 * badge), else the same title card for every project without either. A picture that fails to load falls back too.
 */
export function ProjectMedia({ p, width = 800, eager = false }: { p: Project; width?: number; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const thumb = failed ? undefined : projectThumb(p, width);
  return thumb ? (
    <>
      <img src={thumb.src} className={thumb.video === "youtube" ? "is-yt" : undefined} alt={`${p.name} ${thumb.video ? "demo video" : "screenshot"}`}
        loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
      {thumb.video && <span className="play-badge" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>Demo</span>}
    </>
  ) : (
    <span className="pmedia-fallback" aria-hidden="true">
      <b>{p.name}</b>
      {hostOf(p.url) && <span>{hostOf(p.url)}</span>}
    </span>
  );
}

export default function ProjectCard({
  project: p, voted = false, onVote, showEvent = true, eager = false,
}: {
  project: Project;
  voted?: boolean;
  /** Without it the card has no upvote (e.g. "More from" on a project page). */
  onVote?: () => void;
  /** Off inside an event's own page, where every card is from that event. */
  showEvent?: boolean;
  /** First cards on the first screen load their image straight away. */
  eager?: boolean;
}) {
  const href = `/projects/${p.slug || p.id}`;
  const pill = showEvent ? sprintPill(p.buildathon) : null;
  const team = teamOf(p);
  const ribbon = p.accolade ? RIBBON[p.accolade] : null;

  return (
    <article className="pcard">
      <div className="pmedia">
        <ProjectMedia p={p} eager={eager} />
        {ribbon && <span className={`ribbon${p.accolade?.startsWith("rank-") ? " is-place" : ""}`}>{ribbon}</span>}
        {pill && <span className="ptag">{pill}</span>}
      </div>
      <div className="pbody">
        <h3 className="ptitle"><Link to={href} prefetch="intent">{p.name}</Link></h3>
        <p className="ptagline">{p.tagline}</p>
      </div>
      <div className="pfoot">
        {team.length > 0 && <Faces people={team} />}
        <span className="pwho">{makersLine(p) || " "}</span>
        {onVote && <VotePill count={p.weighted} voted={voted} onVote={onVote} voteId={p.id} name={p.name} />}
      </div>
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="pcard is-skeleton" aria-hidden="true">
      <div className="pmedia skeleton" style={{ borderRadius: 0 }} />
      <div className="pbody">
        <div className="skeleton" style={{ height: 18, width: "50%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: "85%" }} />
      </div>
      <div className="pfoot"><div className="skeleton" style={{ height: 14, width: 140 }} /></div>
    </div>
  );
}
