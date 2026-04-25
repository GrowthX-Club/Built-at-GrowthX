import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { C, T } from "@/types";
import { bxApi } from "@/lib/api";
import { useResponsive } from "@/hooks/useMediaQuery";

export type EventStatus = "live" | "upcoming" | "archived";

export interface EventCardProps {
  slug: string;
  title: string;
  tagline: string;
  dateRange: string;
  status: EventStatus;
  href: string;
}

function StatusBadge({ status }: { status: EventStatus }) {
  // Color tokens by status
  const styles: Record<EventStatus, { color: string; border: string; label: string }> = {
    live: { color: C.green, border: C.green, label: "Live" },
    upcoming: { color: C.gold, border: C.goldBorder, label: "Upcoming" },
    archived: { color: C.textMute, border: C.borderLight, label: "Archived" },
  };
  const s = styles[status];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: T.badge, fontWeight: 720, letterSpacing: "0.08em",
      padding: "3px 8px", borderRadius: 4,
      color: s.color, background: "transparent",
      border: `1px solid ${s.border}`,
      fontFamily: "var(--sans)", textTransform: "uppercase", lineHeight: 1,
    }}>
      {status === "live" && (
        <span style={{
          width: 6, height: 6, borderRadius: 6,
          background: s.color, display: "inline-block",
        }} />
      )}
      {s.label}
    </span>
  );
}

export default function EventCard({
  slug, title, tagline, dateRange, status, href,
}: EventCardProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [count, setCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCount(true);
    bxApi(`/projects?buildathon=${encodeURIComponent(slug)}&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const total = typeof d?.totalCount === "number" ? d.totalCount : 0;
        setCount(total);
      })
      .catch(() => { if (!cancelled) setCount(0); })
      .finally(() => { if (!cancelled) setLoadingCount(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const projectCountLabel = loadingCount
    ? "—"
    : count === 0
      ? "No projects yet"
      : `${count!.toLocaleString()} ${count === 1 ? "project shipped" : "projects shipped"}`;

  return (
    <Link
      to={href}
      onClick={(e) => {
        // Allow modifier-clicks (cmd/ctrl/shift/middle) to use native Link behaviour;
        // otherwise prefer client-side navigation for snappier UX.
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if ((e as unknown as { button?: number }).button === 1) return;
        e.preventDefault();
        navigate(href);
      }}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: isMobile ? "20px 20px" : "24px 28px",
          marginBottom: 20,
          cursor: "pointer",
          transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = C.accent;
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = C.border;
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Meta strip — status + date */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 14, flexWrap: "wrap",
        }}>
          <StatusBadge status={status} />
          <span style={{
            fontSize: T.caption, color: C.textMute, fontWeight: 500,
            fontFamily: "var(--sans)", letterSpacing: "0.01em",
          }}>
            {dateRange}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: isMobile ? T.heading : T.headingLg,
          fontWeight: 500, color: C.text,
          fontFamily: "var(--serif)", lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {title}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: T.bodyLg, color: C.textSec,
          fontFamily: "var(--sans)", fontWeight: 400,
          lineHeight: 1.5, marginBottom: 18,
          maxWidth: 600,
        }}>
          {tagline}
        </div>

        {/* Footer — count + view link */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <div style={{
            fontSize: T.bodySm, color: C.textMute,
            fontFamily: "var(--sans)", fontWeight: 500,
          }}>
            {projectCountLabel}
          </div>
          <span
            className="event-card-cta"
            style={{
              fontSize: T.bodySm, fontWeight: 600, color: C.text,
              fontFamily: "var(--sans)",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            View projects
            <span aria-hidden="true" style={{ display: "inline-block", transition: "transform 0.18s ease" }}>{"→"}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
