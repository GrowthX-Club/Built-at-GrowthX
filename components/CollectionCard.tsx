import { Link } from "react-router";
import { type Collection, type CollectionStats, collectionStat, dateRange, isOpen } from "@/lib/collections";

// An event card: the event's real photo or cover on top (every card without one gets the same typographic cover),
// then name, newest season, dates and count. The name's link covers the card; the season chip is its own link.
export default function CollectionCard({ c, stats, blurb = false }: { c: Collection; stats: CollectionStats; blurb?: boolean }) {
  const s = collectionStat(c, stats);
  const when = dateRange(s.firstAt, s.lastAt);
  const seasons = (c.seasons ?? []).filter(x => (stats.tags[x.tag]?.count ?? 0) > 0);
  return (
    <article className="coll-card">
      {c.cover
        ? <img className="coll-cover" src={c.cover} alt="" loading="lazy" decoding="async" />
        : <div className="coll-mark" aria-hidden="true">{c.mark ?? c.name}</div>}
      <div className="coll-body">
        <h3 className="coll-name"><Link to={c.path} prefetch="intent">{c.name}</Link></h3>
        {blurb && <p className="coll-blurb">{c.blurb}</p>}
        {seasons.length > 0 && (
          <div className="coll-seasons">
            <Link to={`${c.path}?season=${seasons[0].key}`} className="chip">{seasons[0].label} · {seasons[0].when}</Link>
            {seasons.length > 1 && <Link to={c.path} className="chip" aria-label={`${seasons.length - 1} more seasons`}>+{seasons.length - 1}</Link>}
          </div>
        )}
        <div className="coll-meta">
          {isOpen(s.lastAt) ? <span className="open-pill">Open now</span> : when && <span>{when}</span>}
          {s.count > 0 && <span>{when || isOpen(s.lastAt) ? "· " : ""}{s.count.toLocaleString()} {s.count === 1 ? "project" : "projects"}</span>}
        </div>
      </div>
    </article>
  );
}
