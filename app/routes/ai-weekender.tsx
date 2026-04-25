import type { MetaFunction } from "react-router";
import { C } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectListView from "@/components/ProjectListView";

export const meta: MetaFunction = () => [
  { title: "AI Weekender Buildathon · Built at GrowthX" },
  {
    name: "description",
    content:
      "Projects shipped during the AI Weekender Buildathon — built by the GrowthX community in a weekend.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "AI Weekender Buildathon · Built at GrowthX" },
  {
    property: "og:description",
    content:
      "Projects shipped during the AI Weekender Buildathon — built by the GrowthX community in a weekend.",
  },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "AI Weekender Buildathon · Built at GrowthX" },
  {
    name: "twitter:description",
    content:
      "Projects shipped during the AI Weekender Buildathon — built by the GrowthX community in a weekend.",
  },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/ai-weekender" },
];

export default function AiWeekenderPage() {
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
            headerTitle="AI Weekender Buildathon"
            headerSubtitle="Projects built during the AI Weekender Buildathon."
            buildathonFilter="ai-weekender"
            emptyState={{
              icon: "🛠️",
              title: "No AI Weekender projects yet",
              description: "Submissions opened recently — check back soon.",
            }}
          />
        </main>
      </div>
    </div>
  );
}
