import { C, T, TRACK_LABELS, type TrackKey, type FormError } from "@/types";

const TRACK_DESC: Record<TrackKey, string> = {
  virality: "People heard about it, used it, shared it.",
  revenue: "Paying customers, LOIs, or a clear path to revenue.",
  maas: "Agent does real work in the wild, observed and evaluated.",
};

const TRACK_ORDER: TrackKey[] = ["virality", "revenue", "maas"];

interface Props {
  primary: TrackKey;
  secondaries: TrackKey[];
  onChange: (next: { primary: TrackKey; secondaries: TrackKey[] }) => void;
  errors?: FormError[];
}

const MAX_SECONDARIES = 2;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function OCTrackPickStep({ primary, secondaries, onChange, errors: _errors }: Props) {
  const availableSecondaries = TRACK_ORDER.filter((t) => t !== primary);

  const toggleSecondary = (track: TrackKey) => {
    const exists = secondaries.includes(track);
    if (exists) {
      onChange({ primary, secondaries: secondaries.filter((t) => t !== track) });
    } else {
      if (secondaries.length >= MAX_SECONDARIES) return;
      onChange({ primary, secondaries: [...secondaries, track] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div style={{
        fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
        fontWeight: 400, lineHeight: 1.55,
      }}>
        Judges score one track deeply, and optionally give you credit for up to two more. Pick the one where you have the strongest story first.
      </div>

      <div>
        <div style={{
          fontSize: T.caption, fontWeight: 650, color: C.textMute,
          fontFamily: "var(--sans)", letterSpacing: "0.04em",
          textTransform: "uppercase", marginBottom: 10,
        }}>
          Primary track
        </div>
        <div role="radiogroup" aria-label="Primary track" style={{
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {TRACK_ORDER.map((key) => {
            const selected = primary === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  const nextSecondaries = secondaries.filter((t) => t !== key);
                  onChange({ primary: key, secondaries: nextSecondaries });
                }}
                style={{
                  padding: "14px 16px", borderRadius: 14,
                  border: `1.5px solid ${selected ? C.accent : C.border}`,
                  background: selected ? C.accentSoft : C.surface,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "flex-start", gap: 12,
                  transition: "all 0.15s", fontFamily: "var(--sans)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 18, height: 18, borderRadius: 18, flexShrink: 0,
                    border: `1.5px solid ${selected ? C.accent : C.border}`,
                    background: C.surface,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  {selected && (
                    <span style={{ width: 9, height: 9, borderRadius: 9, background: C.accent }} />
                  )}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.text }}>
                    {TRACK_LABELS[key]}
                  </span>
                  <span style={{ fontSize: T.caption, color: C.textMute, lineHeight: 1.4 }}>
                    {TRACK_DESC[key]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: T.caption, fontWeight: 650, color: C.textMute,
          fontFamily: "var(--sans)", letterSpacing: "0.04em",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          Secondary tracks <span style={{ color: C.textMute, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional, pick up to 2)</span>
        </div>
        <div style={{
          fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
          fontWeight: 400, lineHeight: 1.55, marginBottom: 14,
        }}>
          Claim extra rubrics where you also made progress. Judges see a one-line claim + proofs — no full questionnaire.
        </div>
        <div aria-label="Secondary tracks" style={{
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {availableSecondaries.map((key) => {
            const selected = secondaries.includes(key);
            const atCap = !selected && secondaries.length >= MAX_SECONDARIES;
            return (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={selected}
                aria-disabled={atCap}
                onClick={() => { if (!atCap) toggleSecondary(key); }}
                style={{
                  padding: "14px 16px", borderRadius: 14,
                  border: `1.5px solid ${selected ? C.accent : C.border}`,
                  background: selected ? C.accentSoft : C.surface,
                  cursor: atCap ? "not-allowed" : "pointer", textAlign: "left",
                  display: "flex", alignItems: "flex-start", gap: 12,
                  transition: "all 0.15s", fontFamily: "var(--sans)",
                  opacity: atCap ? 0.45 : 1,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${selected ? C.accent : C.border}`,
                    background: selected ? C.accent : C.surface,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  {selected && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.accentFg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: T.body, fontWeight: 600, color: C.text }}>
                    {TRACK_LABELS[key]}
                  </span>
                  <span style={{ fontSize: T.caption, color: C.textMute, lineHeight: 1.4 }}>
                    {TRACK_DESC[key]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {secondaries.length >= MAX_SECONDARIES && (
          <div style={{
            marginTop: 10, fontSize: T.caption, color: C.textMute,
            fontFamily: "var(--sans)", lineHeight: 1.5,
          }}>
            You&rsquo;ve picked the max of two secondary tracks. Deselect one to change.
          </div>
        )}
      </div>
    </div>
  );
}
