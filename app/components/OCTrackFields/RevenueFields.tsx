import { C, T, type RevenueTrackData, type FormError } from "@/types";
import { ProofThumbnailGroup } from "../ProofThumbnail";

interface Props {
  value: RevenueTrackData;
  onPatch: (patch: Partial<RevenueTrackData>) => void;
  slotPrefix: string;
  errors?: FormError[];
  onClearError?: (id: string) => void;
  idPrefix?: string; // canonical id prefix, e.g. "revenue"
}

const TRACTION_OPTIONS: { value: NonNullable<RevenueTrackData["tractionStage"]>; label: string }[] = [
  { value: "", label: "Select one…" },
  { value: "none", label: "None yet" },
  { value: "waitlist_lt_50", label: "Waitlist < 50" },
  { value: "waitlist_50_500", label: "Waitlist 50 – 500" },
  { value: "first_paying_or_signed_loi", label: "First paying customer or signed LOI" },
  { value: "multiple_paying_or_contract", label: "Multiple paying customers or signed contract" },
];

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

export default function RevenueFields({ value, onPatch, slotPrefix, errors, onClearError, idPrefix = "revenue" }: Props) {
  const stage = value.tractionStage ?? "";
  const proofsRequired = stage !== "none" && stage !== "";

  const getErr = (id: string) => errors?.find((e) => e.id === id)?.message;
  const clear = (id: string) => onClearError?.(id);
  const id = (suffix: string) => `${idPrefix}.${suffix}`;

  const errPain = getErr(id("painPoint"));
  const errMarket = getErr(id("marketSize"));
  const errRight = getErr(id("rightToWin"));
  const errWhyNow = getErr(id("whyNow"));
  const errStage = getErr(id("tractionStage"));
  const errTraction = getErr(id("tractionDetails"));
  const errProofs = getErr(id("tractionProofs"));
  const errMoat = getErr(id("moat"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <label className="submit-label" htmlFor={id("painPoint")}>
          Pain point <span className="req">*</span>
        </label>
        <textarea
          id={id("painPoint")}
          className="submit-input"
          placeholder="Whose pain are you solving, and how do you know it's real?"
          value={value.painPoint ?? ""}
          onChange={(e) => { clear(id("painPoint")); onPatch({ painPoint: e.target.value }); }}
          rows={4}
          style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--sans)", ...(errPain ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errPain} />
        <div className="submit-hint">One paragraph. Concrete, not abstract.</div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("marketSize")}>
          Market size <span className="req">*</span>
        </label>
        <textarea
          id={id("marketSize")}
          className="submit-input"
          placeholder="TAM / SAM / SOM or your best bottom-up estimate"
          value={value.marketSize ?? ""}
          onChange={(e) => { clear(id("marketSize")); onPatch({ marketSize: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errMarket ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errMarket} />
        <div className="submit-hint">How big is the opportunity?</div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("rightToWin")}>
          Right to win <span className="req">*</span>
        </label>
        <textarea
          id={id("rightToWin")}
          className="submit-input"
          placeholder="Why you, why this, why now?"
          value={value.rightToWin ?? ""}
          onChange={(e) => { clear(id("rightToWin")); onPatch({ rightToWin: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errRight ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errRight} />
        <div className="submit-hint">What&rsquo;s your unfair advantage?</div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("whyNow")}>
          Why now <span className="req">*</span>
        </label>
        <textarea
          id={id("whyNow")}
          className="submit-input"
          placeholder="What changed in the world that makes this possible today?"
          value={value.whyNow ?? ""}
          onChange={(e) => { clear(id("whyNow")); onPatch({ whyNow: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errWhyNow ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errWhyNow} />
        <div className="submit-hint">Tech shift, behaviour shift, regulation — name the unlock.</div>
      </div>

      <div style={{ height: 1, background: C.borderLight }} />

      <div>
        <label className="submit-label" htmlFor={id("tractionStage")}>
          Traction stage <span className="req">*</span>
        </label>
        <select
          id={id("tractionStage")}
          className="submit-input"
          value={stage}
          onChange={(e) => { clear(id("tractionStage")); onPatch({ tractionStage: e.target.value as RevenueTrackData["tractionStage"] }); }}
          style={{ fontFamily: "var(--sans)", appearance: "auto", ...(errStage ? { borderColor: C.error } : {}) }}
        >
          {TRACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <InlineError message={errStage} />
      </div>

      <div>
        <label className="submit-label" htmlFor={id("tractionDetails")}>
          Traction details <span className="req">*</span>
        </label>
        <textarea
          id={id("tractionDetails")}
          className="submit-input"
          placeholder="Numbers, names, revenue, contract value"
          value={value.tractionDetails ?? ""}
          onChange={(e) => { clear(id("tractionDetails")); onPatch({ tractionDetails: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errTraction ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errTraction} />
        <div className="submit-hint">Judges want specifics.</div>
      </div>

      <div id={id("tractionProofs")}>
        <ProofThumbnailGroup
          label="Traction proofs"
          hint={proofsRequired
            ? "LOIs, payment screenshots, contract headers (redact as needed), waitlist dashboards. At least one required."
            : "Optional when traction stage is \u201CNone yet.\u201D"}
          value={value.tractionProofs ?? []}
          onChange={(next) => { clear(id("tractionProofs")); onPatch({ tractionProofs: next }); }}
          max={5}
          minRequired={proofsRequired ? 1 : 0}
          slotIdPrefix={`${slotPrefix}-traction`}
        />
        <InlineError message={errProofs} />
      </div>

      <div style={{ height: 1, background: C.borderLight }} />

      <div>
        <label className="submit-label" htmlFor={id("moat")}>
          Moat <span className="req">*</span>
        </label>
        <textarea
          id={id("moat")}
          className="submit-input"
          placeholder="What makes this hard to copy in 6 months?"
          value={value.moat ?? ""}
          onChange={(e) => { clear(id("moat")); onPatch({ moat: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errMoat ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errMoat} />
        <div className="submit-hint">Data, distribution, model, network effects — pick your edge.</div>
      </div>

      <style>{`
        textarea.submit-input { padding: 12px 16px; font-size: ${T.body}px; }
        select.submit-input { padding: 11px 14px; }
      `}</style>
    </div>
  );
}
