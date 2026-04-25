import type { MetaFunction } from "react-router";
import { C } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectListView from "@/components/ProjectListView";

export const meta: MetaFunction = () => [
  { title: "India's First OpenCode Buildathon · Built at GrowthX" },
  {
    name: "description",
    content:
      "Projects shipped at India's First OpenCode Buildathon by GrowthX — open source, in a weekend.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "India's First OpenCode Buildathon · Built at GrowthX" },
  {
    property: "og:description",
    content:
      "Projects shipped at India's First OpenCode Buildathon by GrowthX — open source, in a weekend.",
  },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "India's First OpenCode Buildathon · Built at GrowthX" },
  {
    name: "twitter:description",
    content:
      "Projects shipped at India's First OpenCode Buildathon by GrowthX — open source, in a weekend.",
  },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/opencode" },
];

export default function OpenCodePage() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <div style={{
        maxWidth: isMobile || isTablet ? 960 : 960,
        margin: "0 auto",
        padding: isMobile ? "0" : isTablet ? "0" : "0 32px",
      }}>
        <main className="responsive-main" style={{ padding: isMobile ? "20px 16px 80px" : isTablet ? "32px 32px 100px" : "32px 0 100px" }}>
          <ProjectListView
            headerTitle="India's First OpenCode Buildathon"
            headerSubtitle="Open source, shipped in a weekend. By GrowthX."
            buildathonFilter="opencode"
            emptyState={{
              icon: "🛠️",
              title: "No OpenCode projects yet",
              description: "Backfill in progress — check back soon.",
            }}
          />
        </main>
      </div>
    </div>
  );
}
