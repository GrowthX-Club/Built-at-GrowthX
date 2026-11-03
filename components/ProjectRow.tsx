import { Link } from "react-router";
import { type Project, projectImage } from "@/types";
import { eventFor } from "@/lib/collections";
import AccoladeBadge from "@/components/AccoladeBadge";

// A list row in the Product Hunt / Peerlist shape: name, one-line tagline, who built it, and the actions on the
// right. Text-led: the project's own screenshot sits on the right when it has one (Medium-style), never a made-up icon.
// The name's link stretches over the whole row (.prow-link::after), so Try it and Upvote stay separate targets.

export function VoteBox({ count, voted, onVote, voteId }: { count: number; voted: boolean; onVote: () => void; voteId?: string | number }) {
  return (
    <button
      type="button"
      className={`vote-box${voted ? " is-voted" : ""}`}
      data-vote-id={voteId}
      aria-pressed={voted}
      aria-label={`${voted ? "Remove upvote" : "Upvote"} (${count})`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote(); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M10.6 4.4a1.6 1.6 0 0 1 2.8 0l8.4 14.2A1.6 1.6 0 0 1 20.4 21H3.6a1.6 1.6 0 0 1-1.4-2.4L10.6 4.4Z" fill={voted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={voted ? 0 : 2} strokeLinejoin="round" />
      </svg>
      <span>{count.toLocaleString()}</span>
    </button>
  );
}

export function TryIt({ url, name }: { url: string; name: string }) {
  return (
    <a className="try-it" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Try ${name} (opens in a new tab)`} onClick={e => e.stopPropagation()}>
      Try it <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function ProjectRow({
  project: p, voted, onVote, showEvent = true,
}: {
  project: Project;
  voted: boolean;
  onVote: () => void;
  /** Off inside an event's own page, where every row is from that event. */
  showEvent?: boolean;
}) {
  const href = `/projects/${p.slug || p.id}`;
  const thumb = projectImage(p, 320);
  const event = showEvent ? eventFor(p.buildathon) : null;
  const who = [p.builder.name, p.builder.company].filter(Boolean).join(" · ");

  return (
    <div className={`prow${thumb ? "" : " no-thumb"}`}>
      <div className="prow-text">
        <div className="prow-title">
          <Link to={href} className="prow-link" prefetch="intent">{p.name}</Link>
          {p.accolade && <AccoladeBadge accolade={p.accolade} />}
        </div>
        <p className="prow-tagline">{p.tagline}</p>
      </div>
      <div className="prow-meta">
        {p.url && <TryIt url={p.url} name={p.name} />}
        <span className="prow-who">{who}{event ? ` · ${event.name}` : ""}</span>
      </div>
      {thumb && <img className="prow-thumb" src={thumb} alt={`${p.name} screenshot`} loading="lazy" decoding="async" width={136} height={85} />}
      <div className="prow-vote">
        <VoteBox count={p.weighted} voted={voted} onVote={onVote} voteId={p.id} />
      </div>
    </div>
  );
}
