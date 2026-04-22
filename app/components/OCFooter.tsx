import { C, T } from "@/types";

/**
 * Subtle single-line footer for /oc/*.
 * Copy is placeholder — treat as easy-to-edit.
 */
export default function OCFooter() {
  return (
    <footer
      style={{
        padding: "32px 24px 40px",
        textAlign: "center",
        borderTop: `1px solid ${C.borderLight}`,
        marginTop: 64,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--sans)",
          fontSize: T.label,
          color: C.textMute,
          fontWeight: 400,
          letterSpacing: "0.005em",
        }}
      >
        Built at GrowthX — where India&rsquo;s best operators learn and build.{" "}
        <a
          href="https://growthx.club"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: C.textSec,
            textDecoration: "none",
            borderBottom: `1px solid ${C.border}`,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.borderBottomColor = C.textSec;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.textSec;
            e.currentTarget.style.borderBottomColor = C.border;
          }}
        >
          Learn more &rarr;
        </a>
      </p>
    </footer>
  );
}
