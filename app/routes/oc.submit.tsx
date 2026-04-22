import type { MetaFunction } from "react-router";
import { C, T } from "@/types";
import OCSubmitForm from "../components/OCSubmitForm";

export const meta: MetaFunction = () => [
  { title: "Submit your project — OpenCode Buildathon" },
  {
    name: "description",
    content:
      "Submit your project to India's first Open Code Buildathon. Takes under two minutes — drafts welcome.",
  },
  { property: "og:title", content: "Submit your project — OpenCode Buildathon" },
  {
    property: "og:description",
    content:
      "Submit your project to India's first Open Code Buildathon.",
  },
];

/**
 * /oc/submit — dedicated full-page submission form.
 *
 * Rendered inside the /oc layout (see app/routes/oc.tsx) so OCHeader and
 * OCFooter wrap this page automatically. Keeps the flow low-friction for
 * non-member participants by avoiding a modal + deep linking cleanly.
 */
export default function OCSubmitPage() {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px) clamp(12px, 3vw, 24px) 80px",
      }}
    >
      <header style={{ marginBottom: 20, textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Instrument Serif', var(--serif)",
            fontSize: "clamp(26px, 3.6vw, 34px)",
            fontWeight: 500,
            color: C.text,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
          }}
        >
          Submit your project
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: "var(--sans)",
            fontSize: T.bodySm,
            color: C.textMute,
            lineHeight: 1.5,
          }}
        >
          Takes under two minutes &middot; drafts welcome
        </p>
      </header>

      <OCSubmitForm />
    </div>
  );
}
