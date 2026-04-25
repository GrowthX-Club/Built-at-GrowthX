import { C, T } from "@/types";

export interface TrackChipProps {
  track: 'virality' | 'revenue' | 'maas';
}

// Subtle warm pill that labels a project's track. Sits next to the more
// prominent AccoladeBadge — should NOT compete with it visually.
const TRACK_STYLES: Record<TrackChipProps['track'], { label: string; color: string; bg: string; border: string }> = {
  virality: {
    label: "Virality",
    color: C.gold,
    bg: C.goldSoft,
    border: C.goldBorder,
  },
  revenue: {
    label: "Revenue",
    color: C.green,
    bg: C.greenSoft,
    border: C.greenSoft,
  },
  maas: {
    label: "MaaS",
    color: C.blue,
    bg: C.blueSoft,
    border: C.blueSoft,
  },
};

export default function TrackChip({ track }: TrackChipProps) {
  const s = TRACK_STYLES[track];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: T.badge,
        fontWeight: 500,
        fontFamily: "var(--sans)",
        letterSpacing: "0.02em",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}
