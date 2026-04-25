import { C, T } from "@/types";

export interface AccoladeBadgeProps {
  accolade: 'rank-1' | 'rank-2' | 'rank-3' | 'top-5' | 'top-15';
}

// Tiered, slightly more prominent pill. Designed to feel earned but not
// gaudy on the warm cream surface (~#F8F7F4). Top-5 / Top-15 are
// informational tones, not gold/silver/bronze.
type Tier = {
  label: string;
  bg: string;
  color: string;
  border?: string;
  weight: number;
  letterSpacing: string;
};

// Inline silver/bronze tones — tokens don't include them. Picked to sit
// quietly on the warm cream palette without screaming for attention.
const SILVER = "#9CA0A4";
const BRONZE = "#B07746";

const TIERS: Record<AccoladeBadgeProps['accolade'], Tier> = {
  'rank-1': {
    label: "1st",
    bg: C.gold,
    color: "#FFFFFF",
    weight: 700,
    letterSpacing: "0.06em",
  },
  'rank-2': {
    label: "2nd",
    bg: SILVER,
    color: "#FFFFFF",
    weight: 700,
    letterSpacing: "0.06em",
  },
  'rank-3': {
    label: "3rd",
    bg: BRONZE,
    color: "#FFFFFF",
    weight: 700,
    letterSpacing: "0.06em",
  },
  'top-5': {
    label: "Top 5",
    bg: C.text,
    color: "#FFFFFF",
    weight: 600,
    letterSpacing: "0.04em",
  },
  'top-15': {
    label: "Top 15",
    bg: "transparent",
    color: C.textSec,
    border: C.borderLight,
    weight: 600,
    letterSpacing: "0.04em",
  },
};

export default function AccoladeBadge({ accolade }: AccoladeBadgeProps) {
  const t = TIERS[accolade];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        border: t.border ? `1px solid ${t.border}` : "none",
        fontSize: T.badge,
        fontWeight: t.weight,
        fontFamily: "var(--sans)",
        letterSpacing: t.letterSpacing,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {accolade === 'rank-1' && (
        <span aria-hidden="true" style={{ fontSize: T.badge, lineHeight: 1 }}>{"★"}</span>
      )}
      {t.label}
    </span>
  );
}
