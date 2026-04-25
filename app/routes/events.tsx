import type { MetaFunction } from "react-router";
import { C, T } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import EventCard, { type EventCardProps } from "@/components/EventCard";

export const meta: MetaFunction = () => [
  { title: "Events · Built at GrowthX" },
  {
    name: "description",
    content:
      "Buildathons, summits, and other things the GrowthX community ships at. Discover the next event to join.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "Events · Built at GrowthX" },
  {
    property: "og:description",
    content:
      "Buildathons, summits, and other things the GrowthX community ships at. Discover the next event to join.",
  },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "Events · Built at GrowthX" },
  {
    name: "twitter:description",
    content:
      "Buildathons, summits, and other things the GrowthX community ships at. Discover the next event to join.",
  },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/events" },
];

const EVENTS: EventCardProps[] = [
  {
    slug: "ai-weekender",
    title: "AI Weekender Buildathon",
    tagline: "Ship an AI product over the weekend. Build, prove, win.",
    dateRange: "April 2026",
    status: "live",
    href: "/ai-weekender",
  },
  {
    slug: "opencode",
    title: "OpenCode Buildathon",
    tagline: "India's first OpenCode Buildathon, powered by GrowthX.",
    dateRange: "April 2026",
    status: "archived",
    href: "/opencode",
  },
];

export default function EventsPage() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <main className="responsive-main" style={{
        maxWidth: 960, margin: "0 auto",
        padding: isMobile ? "20px 16px 80px" : isTablet ? "32px 32px 100px" : "32px 32px 100px",
      }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1 className="responsive-h1" style={{
            fontSize: 44, fontWeight: 400, color: C.text,
            fontFamily: "var(--serif)", lineHeight: 1.15, marginBottom: 10,
          }}>
            Events
          </h1>
          <p style={{
            fontSize: T.bodyLg, color: C.textSec,
            fontFamily: "var(--sans)", fontWeight: 400, maxWidth: 560,
          }}>
            Buildathons, summits, and other things the GrowthX community ships at.
          </p>
        </div>

        {/* Events list */}
        {EVENTS.length === 0 ? (
          <div className="fade-up stagger-2" style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{"\u{1F5D3}\u{FE0F}"}</div>
            <div style={{
              fontSize: T.title, fontWeight: 500, color: C.text,
              fontFamily: "var(--serif)", marginBottom: 8,
            }}>
              No events yet
            </div>
            <div style={{
              fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
              fontWeight: 400, maxWidth: 360, lineHeight: 1.5,
            }}>
              The next buildathon drops soon.
            </div>
          </div>
        ) : (
          <div>
            {EVENTS.map((e, i) => (
              <div key={e.slug} className={`fade-up stagger-${Math.min(i + 1, 6)}`}>
                <EventCard {...e} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
