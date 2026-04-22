import { useState } from "react";
import { C, T, TRACK_LABELS, type TrackKey, type TrackData, type ViralityTrackData, type RevenueTrackData, type MaasTrackData, type SecondaryTrackClaim, type FormError } from "@/types";
import ViralityFields from "./OCTrackFields/ViralityFields";
import RevenueFields from "./OCTrackFields/RevenueFields";
import MaasFields from "./OCTrackFields/MaasFields";
import SecondaryTrackBlock from "./OCTrackFields/SecondaryTrackBlock";

interface Props {
  primary: TrackKey;
  secondaries: TrackKey[];
  trackData: TrackData;
  onChange: (next: TrackData) => void;
  onSecondariesChange?: (next: TrackKey[]) => void;
  errors?: FormError[];
  onClearError?: (id: string) => void;
}

const ALL_TRACKS: TrackKey[] = ["virality", "revenue", "maas"];

function renderPrimaryFields(
  track: TrackKey,
  trackData: TrackData,
  onChange: (next: TrackData) => void,
  errors: FormError[] | undefined,
  onClearError: ((id: string) => void) | undefined,
) {
  if (track === "virality") {
    const value: ViralityTrackData = trackData.virality ?? {};
    return (
      <ViralityFields
        value={value}
        onPatch={(patch) => onChange({ ...trackData, virality: { ...value, ...patch } })}
        slotPrefix="primary-virality"
        errors={errors}
        onClearError={onClearError}
        idPrefix="virality"
      />
    );
  }
  if (track === "revenue") {
    const value: RevenueTrackData = trackData.revenue ?? {};
    return (
      <RevenueFields
        value={value}
        onPatch={(patch) => onChange({ ...trackData, revenue: { ...value, ...patch } })}
        slotPrefix="primary-revenue"
        errors={errors}
        onClearError={onClearError}
        idPrefix="revenue"
      />
    );
  }
  const value: MaasTrackData = trackData.maas ?? {};
  return (
    <MaasFields
      value={value}
      onPatch={(patch) => onChange({ ...trackData, maas: { ...value, ...patch } })}
      slotPrefix="primary-maas"
      errors={errors}
      onClearError={onClearError}
    />
  );
}

export default function OCTrackDataStep({ primary, secondaries, trackData, onChange, onSecondariesChange, errors, onClearError }: Props) {
  const claims = trackData.secondaryClaims ?? {};
  const [pickerOpen, setPickerOpen] = useState(false);

  const patchSecondary = (track: TrackKey, patch: Partial<SecondaryTrackClaim>) => {
    const prev: SecondaryTrackClaim = claims[track] ?? {};
    onChange({
      ...trackData,
      secondaryClaims: { ...claims, [track]: { ...prev, ...patch } },
    });
  };

  const primaryHeaderLabel =
    primary === "maas" ? "Evaluate yourself" : `Primary track · ${TRACK_LABELS[primary]}`;
  const primaryIntro =
    primary === "maas"
      ? "Walk through each dimension, read the descriptions, pick where you are. Under-claiming is fine — judges verify with your proofs."
      : "Fill what you have. Be specific. Judges score off this data.";

  const canEditSecondaries = typeof onSecondariesChange === "function";
  const availableToAdd = ALL_TRACKS.filter(
    (t) => t !== primary && !secondaries.includes(t),
  );
  const showAddButton = canEditSecondaries && availableToAdd.length > 0;

  const handleRemove = (track: TrackKey) => {
    if (!onSecondariesChange) return;
    onSecondariesChange(secondaries.filter((t) => t !== track));
  };

  const handleAdd = (track: TrackKey) => {
    if (!onSecondariesChange) return;
    onSecondariesChange([...secondaries, track]);
    setPickerOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{
          fontSize: T.caption, fontWeight: 650, color: C.textMute,
          fontFamily: "var(--sans)", letterSpacing: "0.04em",
          textTransform: "uppercase", marginBottom: 6,
        }}>
          {primaryHeaderLabel}
        </div>
        <div style={{
          fontSize: T.body, color: C.textSec, fontFamily: "var(--sans)",
          fontWeight: 400, lineHeight: 1.55, marginBottom: 20,
        }}>
          {primaryIntro}
        </div>
        {renderPrimaryFields(primary, trackData, onChange, errors, onClearError)}
      </div>

      {(secondaries.length > 0 || showAddButton) && (
        <div>
          <div style={{ height: 1, background: C.borderLight, marginBottom: 24 }} />

          {/* Secondaries section intro */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: T.subtitle, fontWeight: 700, color: C.text,
              fontFamily: "var(--serif)", letterSpacing: "-0.01em",
              lineHeight: 1.25, marginBottom: 6,
            }}>
              Secondary tracks
            </div>
            <div style={{
              fontSize: T.bodySm, color: C.textSec, fontFamily: "var(--sans)",
              fontWeight: 400, lineHeight: 1.55,
            }}>
              Claim extra rubrics where you also made progress. Judges see a one-line claim + proofs — no full questionnaire.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {secondaries.map((track) => (
              <div
                key={track}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  background: C.surface,
                  overflow: "hidden",
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                  borderBottom: `1px solid ${C.borderLight}`,
                }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: T.bodyLg, fontWeight: 600, color: C.text,
                      fontFamily: "var(--serif)", letterSpacing: "-0.01em",
                      lineHeight: 1.3,
                    }}>
                      {TRACK_LABELS[track]}
                    </span>
                    <span style={{
                      fontSize: T.caption, fontWeight: 650, color: C.textSec,
                      background: C.surfaceWarm, border: `1px solid ${C.borderLight}`,
                      padding: "2px 8px", borderRadius: 999,
                      fontFamily: "var(--sans)", letterSpacing: "0.02em",
                    }}>
                      Secondary
                    </span>
                  </div>
                  {canEditSecondaries && (
                    <button
                      type="button"
                      onClick={() => handleRemove(track)}
                      style={{
                        fontSize: T.caption, fontWeight: 600, color: C.textSec,
                        fontFamily: "var(--sans)", letterSpacing: "0.02em",
                        background: "transparent",
                        border: `1px solid ${C.borderLight}`,
                        padding: "6px 10px", borderRadius: 8,
                        cursor: "pointer", flexShrink: 0,
                      }}
                      aria-label={`Remove ${TRACK_LABELS[track]} secondary track`}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: "18px" }}>
                  <SecondaryTrackBlock
                    track={track}
                    value={claims[track] ?? {}}
                    onPatch={(patch) => patchSecondary(track, patch)}
                    slotPrefix={`secondary-${track}`}
                    errors={errors}
                    onClearError={onClearError}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add another secondary track */}
          {showAddButton && (
            <div style={{ marginTop: 16 }}>
              {!pickerOpen ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px dashed ${C.border}`,
                    background: "transparent",
                    color: C.textSec,
                    fontFamily: "var(--sans)",
                    fontSize: T.bodySm,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <span aria-hidden style={{ fontSize: T.body, lineHeight: 1 }}>+</span>
                  Add another secondary track
                </button>
              ) : (
                <div style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  background: C.surfaceWarm,
                  padding: "14px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{
                    fontSize: T.caption, fontWeight: 650, color: C.textMute,
                    fontFamily: "var(--sans)", letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    Pick a track to add
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableToAdd.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleAdd(t)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 999,
                          border: `1.5px solid ${C.border}`,
                          background: C.surface,
                          color: C.text,
                          fontFamily: "var(--sans)",
                          fontSize: T.bodySm,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {TRACK_LABELS[t]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPickerOpen(false)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "none",
                        background: "transparent",
                        color: C.textMute,
                        fontFamily: "var(--sans)",
                        fontSize: T.bodySm,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
