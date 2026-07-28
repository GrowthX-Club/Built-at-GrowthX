import { useState } from "react";
import { C, T, getYouTubeVideoId, isVideoMedia, type MediaItem } from "@/types";

/** Convert a loom.com/share URL to an embeddable URL */
function toLoomEmbed(url: string): string {
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  return `https://www.loom.com/embed/${match[1]}`;
}

/** Convert a YouTube watch/short URL to a privacy-enhanced embed URL */
function toYouTubeEmbed(url: string): string {
  const id = getYouTubeVideoId(url);
  if (!id) return url;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

interface MediaGalleryProps {
  media: MediaItem[];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [active, setActive] = useState(0);

  if (!media.length) return null;

  const current = media[active];
  const hasMultiple = media.length > 1;
  const currentIsVideo = isVideoMedia(current);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Main display — 16:9 for video embeds, 5:3 for images (Product Hunt style) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: currentIsVideo ? "56.25%" : "60%", // 9/16 for video, 3/5 for images
          borderRadius: 12,
          overflow: "hidden",
          background: C.surfaceWarm,
          border: `1px solid ${C.border}`,
        }}
      >
        {currentIsVideo ? (
          <iframe
            src={current.type === "loom" ? toLoomEmbed(current.url) : toYouTubeEmbed(current.url)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: "none",
            }}
            loading="lazy"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            title={current.type === "loom" ? "Loom video" : "YouTube video"}
          />
        ) : (
          <img
            src={current.url}
            alt={`Screenshot ${active + 1}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Prev / Next arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + media.length) % media.length)}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: 36,
                border: "none",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: T.bodyLg,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
                transition: "opacity 0.15s",
              }}
              aria-label="Previous"
            >
              &#8249;
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % media.length)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 36,
                height: 36,
                borderRadius: 36,
                border: "none",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: T.bodyLg,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
                transition: "opacity 0.15s",
              }}
              aria-label="Next"
            >
              &#8250;
            </button>
          </>
        )}

        {/* Counter pill */}
        {hasMultiple && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: T.caption,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 12,
              fontFamily: "var(--sans)",
              backdropFilter: "blur(4px)",
            }}
          >
            {active + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 64,
                height: 40,
                borderRadius: 6,
                overflow: "hidden",
                border: i === active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                background: C.surfaceWarm,
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
                position: "relative",
                opacity: i === active ? 1 : 0.6,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              {isVideoMedia(item) ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: C.accent,
                    color: C.accentFg,
                    fontSize: T.caption,
                    fontWeight: 700,
                  }}
                >
                  &#9654;
                </div>
              ) : (
                <img
                  src={item.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
