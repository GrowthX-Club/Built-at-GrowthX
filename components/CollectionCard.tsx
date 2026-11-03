import { Link } from "react-router";
import { type Collection, type CollectionStats, collectionStat, dateRange, isOpen } from "@/lib/collections";

// A framed card with an arrow (Clay University's section cards, in Built's palette). The name's link covers the
// card; season chips sit above it as their own links. Dates and "open" come from the projects' own dates.
export default function CollectionCard({ c, stats, feature = false }: { c: Collection; stats: CollectionStats; feature?: boolean }) {
  const s = collectionStat(c, stats);
  const when = dateRange(s.firstAt, s.lastAt);
  const seasons = (c.seasons ?? []).filter(x => (stats.tags[x.tag]?.count ?? 0) > 0);
  return (
    <article className={`coll-card${feature ? " is-feature" : ""}`}>
      <h3 className="coll-name"><Link to={c.path} prefetch="intent">{c.name}</Link></h3>
      <p className="coll-blurb">{c.blurb}</p>
      {seasons.length > 0 && (
        <div className="coll-seasons">
          {seasons.map(x => (
            <Link key={x.key} to={`${c.path}?season=${x.key}`} className="chip">{x.label} · {x.when}</Link>
          ))}
        </div>
      )}
      <div className="coll-meta">
        <span>
          {isOpen(s.lastAt) ? <span className="open-pill">Open now</span> : when}
          {s.count > 0 && <>{when || isOpen(s.lastAt) ? " · " : ""}{s.count.toLocaleString()} {s.count === 1 ? "project" : "projects"}</>}
        </span>
        <span className="coll-arrow" aria-hidden="true">→</span>
      </div>
    </article>
  );
}
