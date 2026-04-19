import { C, T, type SecondaryTrackClaim, type TrackKey, type FormError } from "@/types";
import { ProofThumbnailGroup } from "../ProofThumbnail";

interface Props {
  track: TrackKey;
  value: SecondaryTrackClaim;
  onPatch: (patch: Partial<SecondaryTrackClaim>) => void;
  slotPrefix: string;
  errors?: FormError[];
  onClearError?: (id: string) => void;
}

const PLACEHOLDER_BY_TRACK: Record<TrackKey, string> = {
  virality: "e.g. Viral post, 50k impressions",
  revenue: "e.g. L3 — first paying customer",
  maas: "e.g. Agent ran 200 tasks autonomously",
};

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{
      fontSize: T.caption, color: C.error, marginTop: 4,
      fontFamily: "var(--sans)", lineHeight: 1.4,
    }}>
      {message}
    </div>
  );
}

export default function SecondaryTrackBlock({ track, value, onPatch, slotPrefix, errors, onClearError }: Props) {
  const tierId = `secondary.${track}.tier`;
  const proofsId = `secondary.${track}.proofs`;
  const errTier = errors?.find((e) => e.id === tierId)?.message;
  const errProofs = errors?.find((e) => e.id === proofsId)?.message;

  const clear = (id: string) => onClearError?.(id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label className="submit-label" htmlFor={tierId}>
          What did you hit? <span className="req">*</span>
        </label>
        <input
          id={tierId}
          className="submit-input"
          placeholder={PLACEHOLDER_BY_TRACK[track]}
          value={value.tier ?? ""}
          onChange={(e) => { clear(tierId); onPatch({ tier: e.target.value }); }}
          style={errTier ? { borderColor: C.error } : undefined}
        />
        <InlineError message={errTier} />
        <div className="submit-hint">One short line — the rubric tier or milestone you reached.</div>
      </div>

      <div>
        <label className="submit-label">
          Summary <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          className="submit-input"
          placeholder="One-sentence context if needed"
          value={value.summary ?? ""}
          onChange={(e) => onPatch({ summary: e.target.value })}
          rows={2}
          style={{ resize: "vertical", minHeight: 56, fontFamily: "var(--sans)" }}
        />
      </div>

      <div id={proofsId}>
        <ProofThumbnailGroup
          label="Proofs"
          hint="Screenshots that prove it. At least one required."
          value={value.proofs ?? []}
          onChange={(next) => { clear(proofsId); onPatch({ proofs: next }); }}
          max={5}
          minRequired={1}
          slotIdPrefix={`${slotPrefix}-secondary`}
        />
        <InlineError message={errProofs} />
      </div>

      <style>{`
        textarea.submit-input { padding: 12px 16px; font-size: ${T.body}px; }
      `}</style>
    </div>
  );
}
