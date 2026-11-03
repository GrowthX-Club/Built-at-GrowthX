import { useRef } from "react";
import { getLoomVideoId, getYouTubeVideoId, cdnImage, detectMediaType, type MediaItem, type Project } from "@/types";
import { ProjectMedia, hostOf } from "@/components/ProjectCard";

/**
 * A safe embed URL for a video media item, or null when no video id can be extracted (never iframe the raw URL).
 */
function getEmbedSrc(item: MediaItem): string | null {
  if (item.type === "loom") {
    const id = getLoomVideoId(item.url);
    return id ? `https://www.loom.com/embed/${id}` : null;
  }
  if (item.type === "youtube") {
    const id = getYouTubeVideoId(item.url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  return null;
}

/** Pictures we can show: images on our CDN or any https image file; Drive/Docs links are not pictures. */
const isPicture = (m: MediaItem) => m.type === "image" && /^https:\/\/\S+\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(m.url);

// Product Hunt's launch gallery: one row of screenshots and demo videos at the same height, scrolled sideways,
// with round arrows on desktop. A project without any keeps the same slot with its title card, linked to the product.
export default function MediaGallery({ project: p }: { project: Project }) {
  const track = useRef<HTMLDivElement>(null);
  const own = (p.media ?? []).filter(m => getEmbedSrc(m) || isPicture(m));
  // No picture or video of its own: the demo video the maker linked in the description, if any.
  const items = own.length || !p.demo ? own : [{ type: detectMediaType(p.demo), url: p.demo }].filter(m => getEmbedSrc(m));
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  // A skill's install box is its picture; a title card above it would say nothing.
  if (items.length === 0 && p.skill) return null;
  if (items.length === 0) {
    const inner = <div className="pmedia" style={{ borderBottom: 0, height: "100%", aspectRatio: "auto" }}><ProjectMedia p={p} eager /></div>;
    return (
      <div className="gallery">
        <div className="gallery-track">
          {p.url ? (
            <a className="gallery-item only is-fallback" href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${hostOf(p.url) || p.name} (opens in a new tab)`}>{inner}</a>
          ) : <div className="gallery-item only is-fallback">{inner}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-track" ref={track}>
        {items.map((m, i) => {
          const embed = getEmbedSrc(m);
          return (
            <div key={i} className={`gallery-item${embed ? " is-video" : ""}${items.length === 1 ? " only" : ""}`}>
              {embed ? (
                <iframe src={embed} loading="lazy" allowFullScreen allow="autoplay; fullscreen; picture-in-picture" title={`${p.name} demo video`} />
              ) : (
                <img src={cdnImage(m.url, 1200)} alt={`${p.name} screenshot ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} decoding="async"
                  onError={e => { e.currentTarget.style.visibility = "hidden"; }} />
              )}
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" className="gallery-arrow prev" aria-label="Previous" onClick={() => scroll(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button type="button" className="gallery-arrow next" aria-label="Next" onClick={() => scroll(1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
