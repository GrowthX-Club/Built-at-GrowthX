import { C, T, type ViralityTrackData, type FormError } from "@/types";
import ProofThumbnail, { ProofThumbnailGroup } from "../ProofThumbnail";

interface Props {
  value: ViralityTrackData;
  onPatch: (patch: Partial<ViralityTrackData>) => void;
  slotPrefix: string;
  errors?: FormError[];
  onClearError?: (id: string) => void;
  idPrefix?: string; // canonical id prefix, e.g. "virality"
}

const PROVIDER_OPTIONS: { value: NonNullable<ViralityTrackData["analyticsProvider"]>; label: string }[] = [
  { value: "", label: "Select one…" },
  { value: "datafast", label: "Datafast" },
  { value: "posthog", label: "PostHog" },
  { value: "plausible", label: "Plausible" },
  { value: "ga4", label: "Google Analytics (GA4)" },
  { value: "other", label: "Other" },
];

function digitsWarn(v: string | undefined): string | null {
  if (!v) return null;
  if (!/\d/.test(v)) return "Heads up — no digits here. Judges need a number.";
  return null;
}

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

export default function ViralityFields({ value, onPatch, slotPrefix, errors, onClearError, idPrefix = "virality" }: Props) {
  const provider = value.analyticsProvider ?? "";
  const impressionsWarn = digitsWarn(value.impressionsTotal);
  const reactionsWarn = digitsWarn(value.reactionsTotal);
  const visitorsWarn = digitsWarn(value.uniqueVisitors);
  const signupsWarn = digitsWarn(value.signupsCount);

  const getErr = (id: string) => errors?.find((e) => e.id === id)?.message;
  const clear = (id: string) => onClearError?.(id);

  const id = (suffix: string) => `${idPrefix}.${suffix}`;

  const errImpressions = getErr(id("impressionsTotal"));
  const errReactions = getErr(id("reactionsTotal"));
  const errAmpNotes = getErr(id("amplificationNotes"));
  const errAmpProofs = getErr(id("amplificationProofs"));
  const errProvider = getErr(id("analyticsProvider"));
  const errProviderOther = getErr(id("analyticsProviderOther"));
  const errVisitors = getErr(id("uniqueVisitors"));
  const errSignups = getErr(id("signupsCount"));
  const errSignupDef = getErr(id("signupEventDefinition"));
  const errSignupProof = getErr(id("signupsProof"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <label className="submit-label" htmlFor={id("impressionsTotal")}>
          Impressions total <span className="req">*</span>
        </label>
        <input
          id={id("impressionsTotal")}
          className="submit-input"
          placeholder="e.g. 8.2k organic + 12k ads = 20.2k"
          value={value.impressionsTotal ?? ""}
          onChange={(e) => { clear(id("impressionsTotal")); onPatch({ impressionsTotal: e.target.value }); }}
          style={errImpressions ? { borderColor: C.error } : undefined}
        />
        <InlineError message={errImpressions} />
        <div className="submit-hint" style={impressionsWarn ? { color: C.gold } : undefined}>
          {impressionsWarn
            ?? "Sum all channels. If you have separate numbers for organic and ads, add them. Impressions and views count the same."}
        </div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("reactionsTotal")}>
          Reactions / comments total <span className="req">*</span>
        </label>
        <input
          id={id("reactionsTotal")}
          className="submit-input"
          placeholder="e.g. 320 likes + 45 comments = 365"
          value={value.reactionsTotal ?? ""}
          onChange={(e) => { clear(id("reactionsTotal")); onPatch({ reactionsTotal: e.target.value }); }}
          style={errReactions ? { borderColor: C.error } : undefined}
        />
        <InlineError message={errReactions} />
        <div className="submit-hint" style={reactionsWarn ? { color: C.gold } : undefined}>
          {reactionsWarn ?? "Sum across all posts and channels. Same format as impressions."}
        </div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("amplificationNotes")}>
          Amplification notes <span className="req">*</span>
        </label>
        <textarea
          id={id("amplificationNotes")}
          className="submit-input"
          placeholder="How did it spread? Which posts / creators / communities picked it up?"
          value={value.amplificationNotes ?? ""}
          onChange={(e) => { clear(id("amplificationNotes")); onPatch({ amplificationNotes: e.target.value }); }}
          rows={4}
          style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--sans)", ...(errAmpNotes ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errAmpNotes} />
        <div className="submit-hint">Keep it concrete. Names, handles, numbers.</div>
      </div>

      <div id={id("amplificationProofs")}>
        <ProofThumbnailGroup
          label="Amplification proofs"
          hint="Screenshots of posts, retweet counts, DMs, anything that proves reach. At least one required."
          value={value.amplificationProofs ?? []}
          onChange={(next) => { clear(id("amplificationProofs")); onPatch({ amplificationProofs: next }); }}
          max={5}
          minRequired={1}
          slotIdPrefix={`${slotPrefix}-amp`}
        />
        <InlineError message={errAmpProofs} />
      </div>

      <div style={{ height: 1, background: C.borderLight }} />

      <div>
        <label className="submit-label" htmlFor={id("analyticsProvider")}>
          Analytics provider <span className="req">*</span>
        </label>
        <select
          id={id("analyticsProvider")}
          className="submit-input"
          value={provider}
          onChange={(e) => { clear(id("analyticsProvider")); onPatch({ analyticsProvider: e.target.value as ViralityTrackData["analyticsProvider"] }); }}
          style={{ fontFamily: "var(--sans)", appearance: "auto", ...(errProvider ? { borderColor: C.error } : {}) }}
        >
          {PROVIDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <InlineError message={errProvider} />
        {provider === "other" && (
          <>
            <input
              id={id("analyticsProviderOther")}
              className="submit-input"
              placeholder="Which tool?"
              value={value.analyticsProviderOther ?? ""}
              onChange={(e) => { clear(id("analyticsProviderOther")); onPatch({ analyticsProviderOther: e.target.value }); }}
              style={{ marginTop: 8, ...(errProviderOther ? { borderColor: C.error } : {}) }}
            />
            <InlineError message={errProviderOther} />
          </>
        )}
      </div>

      <div>
        <label className="submit-label">
          Analytics read-only URL <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          className="submit-input"
          placeholder="https://…"
          value={value.analyticsReadOnlyUrl ?? ""}
          onChange={(e) => onPatch({ analyticsReadOnlyUrl: e.target.value })}
        />
        <div className="submit-hint">A shareable read-only dashboard URL judges can open.</div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("uniqueVisitors")}>
          Unique visitors <span className="req">*</span>
        </label>
        <input
          id={id("uniqueVisitors")}
          className="submit-input"
          placeholder="e.g. 4,200"
          value={value.uniqueVisitors ?? ""}
          onChange={(e) => { clear(id("uniqueVisitors")); onPatch({ uniqueVisitors: e.target.value }); }}
          style={errVisitors ? { borderColor: C.error } : undefined}
        />
        <InlineError message={errVisitors} />
        <div className="submit-hint" style={visitorsWarn ? { color: C.gold } : undefined}>
          {visitorsWarn ?? "Total unique visitors to the site / demo over the measurement window."}
        </div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("signupsCount")}>
          Signups count <span className="req">*</span>
        </label>
        <input
          id={id("signupsCount")}
          className="submit-input"
          placeholder="e.g. 312"
          value={value.signupsCount ?? ""}
          onChange={(e) => { clear(id("signupsCount")); onPatch({ signupsCount: e.target.value }); }}
          style={errSignups ? { borderColor: C.error } : undefined}
        />
        <InlineError message={errSignups} />
        <div className="submit-hint" style={signupsWarn ? { color: C.gold } : undefined}>
          {signupsWarn ?? "Count of completed signups during the measurement window."}
        </div>
      </div>

      <div>
        <label className="submit-label" htmlFor={id("signupEventDefinition")}>
          Signup event definition <span className="req">*</span>
        </label>
        <textarea
          id={id("signupEventDefinition")}
          className="submit-input"
          placeholder="e.g. email submitted + verified"
          value={value.signupEventDefinition ?? ""}
          onChange={(e) => { clear(id("signupEventDefinition")); onPatch({ signupEventDefinition: e.target.value }); }}
          rows={3}
          style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)", ...(errSignupDef ? { borderColor: C.error } : {}) }}
        />
        <InlineError message={errSignupDef} />
        <div className="submit-hint">What counts as a signup? Be specific.</div>
      </div>

      <div id={id("signupsProof")}>
        <ProofThumbnail
          slotId={`${slotPrefix}-signup-proof`}
          label="Signup proof"
          hint="One screenshot showing the signup count in your analytics tool."
          value={value.signupsProof}
          onChange={(next) => { clear(id("signupsProof")); onPatch({ signupsProof: next }); }}
          required
        />
        <InlineError message={errSignupProof} />
      </div>

      <style>{`
        textarea.submit-input { padding: 12px 16px; font-size: ${T.body}px; }
        select.submit-input { padding: 11px 14px; }
      `}</style>
    </div>
  );
}
