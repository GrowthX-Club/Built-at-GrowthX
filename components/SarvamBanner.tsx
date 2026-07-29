import { useEffect, useState } from "react";
import { Link } from "react-router";
import { C } from "@/types";

// Home-page banner for the Sarvam Epoch Buildathon showcase. Time-boxed:
// renders only until BANNER_EXPIRES (7 days from launch, IST), after which it
// disappears without a deploy. Dismissable per-browser via localStorage.
const BANNER_EXPIRES = new Date("2026-08-05T23:59:59+05:30");
const DISMISS_KEY = "bx_sarvam_banner_dismissed";

export default function SarvamBanner({ isMobile }: { isMobile?: boolean }) {
  // Start hidden on both server and client so SSR + hydration match; the
  // mount effect reveals it (or not) based on the expiry and the dismissal.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (new Date() > BANNER_EXPIRES) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* storage unavailable — show anyway */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — banner just returns next visit */
    }
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        background: C.goldSoft,
        border: `1px solid ${C.goldBorder}`,
        borderRadius: 12,
        padding: isMobile ? "14px 40px 14px 16px" : "16px 48px 16px 20px",
        marginBottom: 24,
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: isMobile ? 17 : 19,
            color: C.text,
            marginBottom: 2,
          }}
        >
          Sarvam Epoch Buildathon by GrowthX
        </div>
        <div style={{ fontSize: 13.5, color: C.textMute, lineHeight: 1.45 }}>
          ~600 builders, one day, shipping with Sarvam AI — the projects are in.
        </div>
      </div>
      <Link
        to="/sarvam"
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: C.gold,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        See the projects →
      </Link>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: 8,
          color: C.textMute,
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
