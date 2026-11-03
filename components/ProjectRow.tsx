import { Link } from "react-router";
import { type Project, teamOf } from "@/types";
import { eventFor, sprintPill } from "@/lib/collections";
import AccoladeBadge from "@/components/AccoladeBadge";

// A list row in the Product Hunt / Peerlist shape: name, one-line tagline, who built it, and the vote box in a
// fixed right column, so every row lines up. No pictures in rows; screenshots live on the project page.
// The name's link stretches over the whole row (.prow-link::after), so Try it and Upvote stay separate targets.

export function VoteBox({ count, voted, onVote, voteId }: { count: number; voted: boolean; onVote: () => void; voteId?: string | number }) {
  return (
    <button
      type="button"
      className={`vote-box${voted ? " is-voted" : ""}`}
      data-vote-id={voteId}
      aria-pressed={voted}
      aria-label={`${voted ? "Remove upvote" : "Upvote"}${count > 0 ? ` (${count})` : ""}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" />
      </svg>
      {count > 0 && <span>{count.toLocaleString()}</span>}
    </button>
  );
}

export function TryIt({ url, name }: { url: string; name: string }) {
  return (
    <a className="try-it" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Try ${name} (opens in a new tab)`}>
      Try it <span aria-hidden="true">↗</span>
    </a>
  );
}

/** "udayan walvekar, Sudesh Das +1 · GrowthX": up to two names, then how many more, then the first maker's company. */
export function makersLine(p: Project): string {
  const team = teamOf(p);
  const names = team.slice(0, 2).map(m => m.name).join(", ") + (team.length > 2 ? ` +${team.length - 2}` : "");
  return [names, team[0]?.company].filter(Boolean).join(" · ");
}

export default function ProjectRow({
  project: p, voted = false, onVote, showEvent = true,
}: {
  project: Project;
  voted?: boolean;
  /** Without it the row has no vote box (e.g. "More from" on a project page). */
  onVote?: () => void;
  /** Off inside an event's own page, where every row is from that event. */
  showEvent?: boolean;
}) {
  const href = `/projects/${p.slug || p.id}`;
  const pill = sprintPill(p.buildathon);
  const event = showEvent && !pill ? eventFor(p.buildathon) : null;

  return (
    <div className={`prow${onVote ? "" : " no-vote"}`}>
      <div className="prow-text">
        <div className="prow-title">
          <Link to={href} className="prow-link" prefetch="intent">{p.name}</Link>
          {p.accolade && <AccoladeBadge accolade={p.accolade} />}
          {pill && showEvent && <span className="pill">{pill}</span>}
        </div>
        <p className="prow-tagline">{p.tagline}</p>
      </div>
      <div className="prow-meta">
        {p.skill ? (
          <Link to={`${href}#install`} className="try-it" aria-label={`Install ${p.name}`}>Install</Link>
        ) : p.url && <TryIt url={p.url} name={p.name} />}
        <span className="prow-who">{makersLine(p)}{event ? ` · ${event.name}` : ""}</span>
      </div>
      {onVote && (
        <div className="prow-vote">
          <VoteBox count={p.weighted} voted={voted} onVote={onVote} voteId={p.id} />
        </div>
      )}
    </div>
  );
}
