import type { MetaFunction } from "react-router";
import { C } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectListView from "@/components/ProjectListView";

export const meta: MetaFunction = () => [
  { title: "Sarvam Epoch Buildathon · Built at GrowthX" },
  {
    name: "description",
    content:
      "Sarvam Epoch Buildathon, powered by GrowthX — ~600 builders, one day, built with Sarvam AI. Projects shipped during the event.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "Sarvam Epoch Buildathon · Built at GrowthX" },
  {
    property: "og:description",
    content:
      "Sarvam Epoch Buildathon, powered by GrowthX — ~600 builders, one day, built with Sarvam AI. Projects shipped during the event.",
  },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "Sarvam Epoch Buildathon · Built at GrowthX" },
  {
    name: "twitter:description",
    content:
      "Sarvam Epoch Buildathon, powered by GrowthX — ~600 builders, one day, built with Sarvam AI. Projects shipped during the event.",
  },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/sarvam" },
];

export default function SarvamPage() {
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
            headerTitle="Sarvam Epoch Buildathon"
            headerSubtitle="One-day buildathon on 26 July 2026 — ~600 builders shipping with Sarvam AI."
            buildathonFilter="sarvam"
            featuredEnabled={false}
            emptyState={{
              icon: "🛠️",
              title: "No Sarvam Epoch projects yet",
              description: "Projects from the buildathon are being added — check back soon.",
            }}
          />
        </main>
      </div>
    </div>
  );
}
