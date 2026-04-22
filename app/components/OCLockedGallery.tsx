import { Link } from "react-router";
import { C, T } from "@/types";

/**
 * Locked skeleton gallery shown on /oc before the viewer has submitted.
 * Fake project cards sit behind a blurred veil; a centered lock + CTA
 * overlay invites the user to submit.
 *
 * Per scoping.md §2.1 — applies to both unauthenticated visitors AND
 * logged-in users who haven't yet submitted. Backend integration is
 * deferred; this slice is purely static placeholder content.
 */

interface FakeProject {
  name: string;
  tagline: string;
  upvotes: number;
  stack: string[];
  builderInitials: string;
  accent: string;
}

const FAKE_PROJECTS: FakeProject[] = [
  {
    name: "Helios Weather",
    tagline:
      "Hyperlocal 15-minute forecasts for Indian cities with a first-party radar mesh.",
    upvotes: 34,
    stack: ["Open Code", "Python", "React"],
    builderInitials: "AK",
    accent: "var(--c-gold)",
  },
  {
    name: "Orbit Ledger",
    tagline:
      "A double-entry bookkeeping engine that speaks plain English to small-business owners.",
    upvotes: 27,
    stack: ["Open Code", "Rust", "Postgres"],
    builderInitials: "RV",
    accent: "var(--c-blue)",
  },
  {
    name: "Neon Notes",
    tagline:
      "Voice-first meeting notes that auto-link to the project they&rsquo;re about. No setup.",
    upvotes: 18,
    stack: ["Open Code", "TypeScript", "Whisper"],
    builderInitials: "SM",
    accent: "var(--c-green)",
  },
  {
    name: "Paperboat",
    tagline:
      "A calmer RSS reader. Readable by default, no infinite feed, no engagement metrics.",
    upvotes: 12,
    stack: ["Open Code", "Swift", "Go"],
    builderInitials: "DP",
    accent: "var(--c-role-founder)",
  },
  {
    name: "Plum Pay",
    tagline:
      "Split-the-bill that actually settles — UPI, PayPal, and cash, tracked until zero.",
    upvotes: 9,
    stack: ["Open Code", "Next.js"],
    builderInitials: "IJ",
    accent: "var(--c-role-host)",
  },
  {
    name: "Dharma CLI",
    tagline:
      "A pre-commit hook that flags dark patterns in product copy before you ship them.",
    upvotes: 22,
    stack: ["Open Code", "Node.js"],
    builderInitials: "TN",
    accent: "var(--c-accent)",
  },
  {
    name: "Koi Fleet",
    tagline:
      "Delivery-rider routing that respects breaks, rain, and the physics of Indian traffic.",
    upvotes: 5,
    stack: ["Open Code", "Kotlin", "Maps"],
    builderInitials: "HR",
    accent: "var(--c-brand)",
  },
  {
    name: "Maker\u2019s Clock",
    tagline:
      "A calendar that protects deep-work blocks and politely nudges meetings to the margin.",
    upvotes: 15,
    stack: ["Open Code", "TypeScript"],
    builderInitials: "VS",
    accent: "var(--c-gold)",
  },
  {
    name: "Bazaar Index",
    tagline:
      "Open, versioned price data for APMC mandis, scraped and normalised every morning.",
    upvotes: 41,
    stack: ["Open Code", "Python", "DuckDB"],
    builderInitials: "MC",
    accent: "var(--c-green)",
  },
];

function FakeCard({ p }: { p: FakeProject }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 180,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: p.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--sans)",
            fontSize: T.bodySm,
            fontWeight: 700,
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
        >
          {p.builderInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.bodyLg,
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.25,
              marginBottom: 4,
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.label,
              color: C.textSec,
              lineHeight: 1.45,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: p.tagline }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.stack.slice(0, 2).map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.micro,
                color: C.textSec,
                background: C.accentSoft,
                padding: "3px 8px",
                borderRadius: 6,
                letterSpacing: "0.02em",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            fontFamily: "var(--sans)",
            fontSize: T.label,
            fontWeight: 600,
            color: C.textSec,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.6 7.4a1.6 1.6 0 0 1 2.8 0l6.4 10.8A1.6 1.6 0 0 1 18.4 20H5.6a1.6 1.6 0 0 1-1.4-2.4L10.6 7.4Z" />
          </svg>
          {p.upvotes}
        </div>
      </div>
    </div>
  );
}

export default function OCLockedGallery() {
  return (
    <section
      style={{
        position: "relative",
        marginTop: 32,
      }}
    >
      {/* Skeleton grid — visually dim + non-interactive */}
      <div
        aria-hidden
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          filter: "blur(2px) grayscale(0.35)",
          opacity: 0.55,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {FAKE_PROJECTS.map((p) => (
          <FakeCard key={p.name} p={p} />
        ))}
      </div>

      {/* Lock overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "clamp(60px, 12vh, 140px)",
          background:
            "linear-gradient(to bottom, var(--c-bg) 0%, color-mix(in srgb, var(--c-bg) 85%, transparent) 40%, color-mix(in srgb, var(--c-bg) 60%, transparent) 100%)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "32px 28px",
            textAlign: "center",
            maxWidth: 420,
            width: "calc(100% - 32px)",
            boxShadow:
              "0 1px 2px rgba(24,23,16,0.04), 0 12px 32px rgba(24,23,16,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            aria-hidden
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: C.accentSoft,
              color: C.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: T.subtitle,
              fontWeight: 500,
              color: C.text,
              lineHeight: 1.25,
              letterSpacing: "-0.005em",
            }}
          >
            Submit your project to view others who have submitted
          </div>

          <div
            style={{
              fontFamily: "var(--sans)",
              fontSize: T.bodySm,
              color: C.textSec,
              lineHeight: 1.5,
              maxWidth: 340,
            }}
          >
            The gallery unlocks once your build is in. Share what you&rsquo;re
            working on &mdash; draft or ready.
          </div>

          <Link
            to="/oc/submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 10,
              background: C.accent,
              color: C.accentFg,
              fontFamily: "var(--sans)",
              fontSize: T.bodySm,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.005em",
              transition: "transform 0.12s, box-shadow 0.12s",
              marginTop: 4,
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(24,23,16,0.18)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Submit your project
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
