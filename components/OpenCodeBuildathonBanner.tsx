import { Link, useLocation } from "react-router";
import { C, T } from "@/types";

/**
 * Slim top-of-viewport banner that nudges Open Code Buildathon participants
 * toward /oc. Renders on all routes EXCEPT /oc/*.
 *
 * Per scoping.md §3 / requirements.md §3.1:
 *  - Visible to everyone (auth + anon).
 *  - Full-width, single-line, subtle but visible.
 *  - Entire strip links to /oc.
 *  - No dismiss (TBD, scoping.md §8).
 */
export default function OpenCodeBuildathonBanner() {
  const { pathname } = useLocation();
  if (pathname === "/oc" || pathname.startsWith("/oc/")) return null;

  return (
    <Link
      to="/oc"
      aria-label="Open Code Buildathon — go to /oc"
      style={{
        display: "block",
        width: "100%",
        textDecoration: "none",
        background: C.accent,
        color: C.accentFg,
        borderBottom: `1px solid ${C.border}`,
        fontFamily: "var(--sans)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: T.label,
          fontWeight: 500,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.4,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 6,
            background: C.gold,
            flexShrink: 0,
          }}
        />
        <span>
          Participating in the Open Code Buildathon?{" "}
          <span style={{ opacity: 0.85 }}>Click here</span>{" "}
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
