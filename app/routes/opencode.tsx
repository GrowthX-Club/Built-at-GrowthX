import type { MetaFunction } from "react-router";
import { C, type Project } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectListView, { type FilterTab } from "@/components/ProjectListView";

const OPENCODE_FILTERS: FilterTab[] = [
  { key: "all", label: "All projects", predicate: () => true },
  { key: "top-15", label: "Top 15", predicate: (p: Project) => !!p.accolade },
  { key: "top-5", label: "Top 5", predicate: (p: Project) => !!p.accolade && p.accolade !== "top-15" },
  { key: "virality", label: "Virality", predicate: (p: Project) => p.track === "virality" },
  { key: "revenue", label: "Revenue", predicate: (p: Project) => p.track === "revenue" },
  { key: "maas", label: "MaaS", predicate: (p: Project) => p.track === "maas" },
];

export const meta: MetaFunction = () => [
  { title: "OpenCode Buildathon · Built at GrowthX" },
  {
    name: "description",
    content:
      "India's first OpenCode Buildathon, powered by GrowthX. Projects shipped during the event.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "OpenCode Buildathon · Built at GrowthX" },
  {
    property: "og:description",
    content:
      "India's first OpenCode Buildathon, powered by GrowthX. Projects shipped during the event.",
  },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "OpenCode Buildathon · Built at GrowthX" },
  {
    name: "twitter:description",
    content:
      "India's first OpenCode Buildathon, powered by GrowthX. Projects shipped during the event.",
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
            headerTitle="OpenCode Buildathon"
            headerSubtitle="India's first OpenCode Buildathon, powered by GrowthX."
            buildathonFilter="opencode"
            featuredEnabled={false}
            customFilters={OPENCODE_FILTERS}
            emptyState={{
              icon: "🛠️",
              title: "No projects in this filter",
              description: "Pick another tab above to see more.",
            }}
          />
        </main>
      </div>
    </div>
  );
}
