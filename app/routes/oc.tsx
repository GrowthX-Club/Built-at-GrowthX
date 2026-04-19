import { Outlet } from "react-router";
import type { MetaFunction } from "react-router";
import { C } from "@/types";
import OCHeader from "../components/OCHeader";
import OCFooter from "../components/OCFooter";

export const meta: MetaFunction = () => [
  { title: "OpenCode Buildathon — Built at GrowthX" },
  {
    name: "description",
    content:
      "India's first Open Code Buildathon — projects shipped by the GrowthX community in a single weekend.",
  },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "OpenCode Buildathon — Built at GrowthX" },
  {
    property: "og:description",
    content:
      "India's first Open Code Buildathon — projects shipped by the GrowthX community in a single weekend.",
  },
  { name: "twitter:card", content: "summary" },
  { tagName: "link", rel: "canonical", href: "https://built.growthx.club/oc" },
];

/**
 * Layout route for all /oc/* pages.
 * Global AppNav + banner are conditionally omitted in app/root.tsx for /oc/*.
 */
export default function OCLayout() {
  return (
    <div
      className="oc-layout"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
      }}
    >
      <OCHeader />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <OCFooter />
    </div>
  );
}
