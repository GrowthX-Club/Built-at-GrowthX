export interface AccoladeBadgeProps {
  accolade: 'rank-1' | 'rank-2' | 'rank-3' | 'top-5' | 'top-15';
}

// One quiet pill for every accolade (.pill, shared with the Build Sprint season pill); the star marks the three places.
const LABELS: Record<AccoladeBadgeProps['accolade'], string> = {
  'rank-1': "1st place",
  'rank-2': "2nd place",
  'rank-3': "3rd place",
  'top-5': "Top 5",
  'top-15': "Top 15",
};

export default function AccoladeBadge({ accolade }: AccoladeBadgeProps) {
  return (
    <span className="pill">
      {accolade.startsWith("rank-") && <span aria-hidden="true" className="pill-star">★</span>}
      {LABELS[accolade]}
    </span>
  );
}
