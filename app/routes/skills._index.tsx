import { Link, type MetaFunction } from "react-router";
import { C, T } from "@/types";
import { useResponsive } from "@/hooks/useMediaQuery";
import ProjectListView from "@/components/ProjectListView";
import { ConnectCard } from "@/components/SkillUse";

const DESCRIPTION =
  "Skills GrowthX members built to teach AI a job they know. Add any of them to Claude, ChatGPT, Claude Code or Codex.";

export const meta: MetaFunction = () => [
  { title: "Skills — Built at GrowthX" },
  { name: "description", content: DESCRIPTION },
  { property: "og:title", content: "Skills — Built at GrowthX" },
  { property: "og:description", content: DESCRIPTION },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:title", content: "Skills — Built at GrowthX" },
  { name: "twitter:description", content: DESCRIPTION },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/skills" },
];

// Primary button, as "Submit your first project" in my-projects.tsx. /skills/new asks signed-out visitors to sign in.
function UploadSkillButton() {
  return (
    <Link
      to="/skills/new"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10,
        background: C.accent, color: C.accentFg, fontSize: T.bodySm, fontWeight: 600, fontFamily: "var(--sans)",
        textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, transition: "opacity 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      Upload a skill
    </Link>
  );
}

// Same frame as the home page (_index.tsx): list on the left, side column on desktop.
export default function SkillsPage() {
  const { isMobile, isTablet } = useResponsive();
  const narrow = isMobile || isTablet;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <div style={{
        maxWidth: narrow ? 960 : 1280,
        margin: "0 auto",
        display: narrow ? "block" : "flex",
        gap: 40,
        padding: narrow ? "0" : "0 32px",
      }}>
        <main className="responsive-main" style={{ flex: 1, maxWidth: 960, padding: isMobile ? "20px 16px 80px" : isTablet ? "32px 32px 100px" : "32px 0 100px" }}>
          <ProjectListView
            headerTitle="Skills the community built"
            headerSubtitle="Each one teaches your AI a job, the way a GrowthX member does it. GrowthX checks every skill before it's listed."
            skillsOnly
            featuredEnabled={false}
            defaultSort="installs"
            headerAction={<UploadSkillButton />}
            emptyState={{
              icon: "🧰",
              title: "No skills yet",
              description: "Skills members upload show up here once GrowthX has checked them.",
            }}
          />
          {narrow && <div style={{ marginTop: 32 }}><ConnectCard /></div>}
        </main>

        {!narrow && (
          <aside style={{ width: 280, flexShrink: 0 }}>
            <div style={{ paddingTop: 32, position: "sticky", top: 96 }}>
              <ConnectCard />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
