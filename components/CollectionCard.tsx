import { Link } from "react-router";
import { type Collection, type CollectionStats, collectionStat, dateRange, isOpen, sitePhoto } from "@/lib/collections";

// An event card: the event's real photo or cover on top (every card without one gets the same typographic cover),
// then name, newest season, dates and count. The name's link covers the card; the season chip is its own link.
export default function CollectionCard({ c, stats, blurb = false, flagship = false, mosaic = [] }: { c: Collection; stats: CollectionStats; blurb?: boolean; flagship?: boolean; mosaic?: string[] }) {
  const s = collectionStat(c, stats);
  const when = dateRange(s.firstAt, s.lastAt);
  const seasons = (c.seasons ?? []).filter(x => (stats.tags[x.tag]?.count ?? 0) > 0);
  return (
    <article className={`coll-card${flagship ? " is-flagship" : ""}`}>
      {c.cover
        ? <img className="coll-cover" src={sitePhoto(c.cover, 800)} alt="" loading="lazy" decoding="async" />
        : mosaic.length >= 4
          ? <div className="coll-mosaic" aria-hidden="true">{mosaic.map(src => <img key={src} src={src} alt="" loading="lazy" decoding="async" />)}</div>
          : <div className="coll-mark" aria-hidden="true">{c.mark ?? c.name}</div>}
      <div className="coll-body">
        <h3 className="coll-name"><Link to={c.path} prefetch="intent">{c.name}</Link></h3>
        {blurb && <p className="coll-blurb">{c.blurb}</p>}
        {seasons.length > 0 && (
          <div className="coll-seasons">
            {seasons.map((x, i) => <Link key={x.key} to={`${c.path}?season=${x.key}`} className="chip">{i === 0 ? `${x.label} · ${x.when}` : x.label}</Link>)}
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
