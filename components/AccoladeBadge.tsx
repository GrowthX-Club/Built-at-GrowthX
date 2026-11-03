import { C } from "@/types";

export interface AccoladeBadgeProps {
  accolade: 'rank-1' | 'rank-2' | 'rank-3' | 'top-5' | 'top-15';
}

// One quiet pill for every accolade; the star marks the three places. Text stays in the body colour on the
// soft gold fill so it reads at 4.5:1+ in both themes.
const LABELS: Record<AccoladeBadgeProps['accolade'], string> = {
  'rank-1': "1st place",
  'rank-2': "2nd place",
  'rank-3': "3rd place",
  'top-5': "Top 5",
  'top-15': "Top 15",
};

export default function AccoladeBadge({ accolade }: AccoladeBadgeProps) {
  const place = accolade.startsWith("rank-");
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 999,
        background: C.goldSoft, color: C.text, border: `1px solid ${C.goldBorder}`,
        fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)", lineHeight: 1.3, whiteSpace: "nowrap",
      }}
    >
      {place && <span aria-hidden="true" style={{ color: C.gold }}>★</span>}
      {LABELS[accolade]}
    </span>
  );
}
