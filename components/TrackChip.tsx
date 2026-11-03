import { C } from "@/types";

export interface TrackChipProps {
  track: 'virality' | 'revenue' | 'maas';
}

// Quiet outline pill for an OpenCode track; sits beside the AccoladeBadge without competing with it.
const LABELS: Record<TrackChipProps['track'], string> = { virality: "Virality track", revenue: "Revenue track", maas: "MaaS track" };

export default function TrackChip({ track }: TrackChipProps) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 28, padding: "0 10px", borderRadius: 999,
        color: C.textSec, border: `1px solid ${C.border}`,
        fontSize: 14, fontWeight: 500, fontFamily: "var(--sans)", lineHeight: 1.3, whiteSpace: "nowrap",
      }}
    >
      {LABELS[track]}
    </span>
  );
}
