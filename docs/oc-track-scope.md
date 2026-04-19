# OC Submit — Track-Data Extension (3-step → 5-step wizard)

## Context

`app/components/OCSubmitForm.tsx` is the submission flow at `/oc/submit` for the OpenCode Buildathon. It is a self-contained 3-step wizard (basics + story + ship-it) that persists draft state to `localStorage` under `oc:submit:draft:v1` / `oc:submit:step:v1`, and POSTs to `/projects` via `bxApi`.

This doc scopes extending it to a **5-step wizard** so submitters can declare a **judge-scoring track** (Virality, Revenue, or Managed-as-a-Service / MaaS) and supply the track-specific data judges need to score them. Existing steps and copy stay untouched; two new steps slot in between current Step 2 (Ship it) and the submit action.

The separate `components/SubmitWizard.tsx` flow is **not in scope** — this change is isolated to `OCSubmitForm.tsx` and its new sub-components.

## Goals

- Add a track picker (primary required, secondary optional) as Step 3.
- Add a track-data step (Step 4) that renders fields for the chosen primary track, followed by a (collapsed by default) section for the secondary track if selected.
- Ship a reusable `ProofThumbnail` primitive with zoom + confirm-delete modals, supporting single and multi-proof (up to 5) usage.
- Pass the new data through the mock API unchanged (no validation mock-side).
- Keep draft persistence working across track switches without dropping already-entered field values.

## Non-goals

- No real file upload backend changes (stays on whatever upload pipeline `MediaUpload` already uses; proofs use the same flow).
- No changes to `components/SubmitWizard.tsx` — it is a separate flow and is left alone.
- No changes to the judge-side scoring UI, leaderboard, or gallery rendering.
- No server-side validation changes (mock passes everything through).

## Step flow (after change)

| # | Step | Origin | Notes |
|---|------|--------|-------|
| 0 | The basics | existing | Build mode, name, tagline, team. Unchanged. |
| 1 | The story | existing | Description (RichTextEditor). Unchanged. |
| 2 | Ship it | existing | GitHub / demo / video / screenshots / stack. Unchanged. |
| 3 | Pick your track | **new** | Primary + optional secondary track picker. |
| 4 | Track data | **new** | Judge-scoring fields for primary track; secondary below if set. |
| Submit | submit/review | existing | Wire-up — `handleSubmitProject` now includes track payload. |

`totalSteps` moves from `3` to `5`. The submit button behaviour on the last step is unchanged; the "save as draft" escape stays available on Step 4.

## Data model

All new types go in `types/index.ts`:

```ts
export type TrackKey = "virality" | "revenue" | "maas";

export interface ProofMedia {
  url: string;
  uploadedAt: string;
  filename?: string;
}

export interface ViralityTrackData {
  impressionsTotal?: string;
  reactionsTotal?: string;
  amplificationNotes?: string;
  amplificationProofs?: ProofMedia[];
  analyticsProvider?: "datafast" | "posthog" | "plausible" | "ga4" | "other" | "";
  analyticsProviderOther?: string;
  analyticsReadOnlyUrl?: string;
  uniqueVisitors?: string;
  signupsCount?: string;
  signupEventDefinition?: string;
  signupsProof?: ProofMedia;
}

export interface RevenueTrackData {
  painPoint?: string;
  marketSize?: string;
  rightToWin?: string;
  whyNow?: string;
  tractionStage?:
    | "none"
    | "waitlist_lt_50"
    | "waitlist_50_500"
    | "first_paying_or_signed_loi"
    | "multiple_paying_or_contract"
    | "";
  tractionDetails?: string;
  tractionProofs?: ProofMedia[];
  moat?: string;
}

export interface MaasTrackData {
  taskDomain?: "growth" | "recruiting" | "support" | "sales" | "other" | "";
  taskDomainOther?: string;
  realOutputSummary?: string;
  realOutputProofs?: ProofMedia[];
  observabilityTool?: "langfuse" | "braintrust" | "arize" | "custom" | "none" | "";
  observabilityReadOnlyUrl?: string;
  observabilityProof?: ProofMedia;
  evalsSummary?: string;
  evalsProof?: ProofMedia;
  memoryArchitecture?: string;
  managementUiUrl?: string;
  managementUiCredentials?: string;
}

export interface TrackData {
  virality?: ViralityTrackData;
  revenue?: RevenueTrackData;
  maas?: MaasTrackData;
}
```

All fields are `?:` so the object can be partially filled during wizard progression. `TrackData` is always present on wizard state as an object (never undefined) so switching primary/secondary tracks mid-wizard doesn't wipe the field values the user already typed — prior entries are preserved and re-surface if the user switches back.

### Wizard state additions

`SubmitData` (in `OCSubmitForm.tsx`) gains three fields:

```ts
primaryTrack: TrackKey;        // default: "virality"
secondaryTrack: TrackKey | null; // default: null
trackData: TrackData;          // default: {}
```

`INITIAL_DATA` is extended accordingly. `loadDraft` merges these in the same spread pattern already used for the existing fields; `saveDraft` is unchanged in shape.

## Track picker (Step 3)

Radio-style buttons, styled to match the existing build-mode picker on Step 0 (same `role="radio"` buttons, same `C.accent`-on-select visual). Primary and Secondary are two separate radio groups stacked vertically.

- **Primary track**: `Virality` | `Revenue` | `MaaS`. Pre-selected: `Virality`. Required.
- **Secondary track**: primary options minus whatever primary is set to, plus a `None` option. Required = no (default `None` → `null`).

Switching primary: if the new primary equals the current secondary, reset secondary to `null` (don't auto-swap — surprise bad). Field values in `trackData[oldPrimary]` are preserved.

## Track data (Step 4)

Renders:

1. Header "Primary track: <label>"
2. **Full** field block for the primary track (see tables below)
3. If `secondaryTrack !== null`: a divider, header "Secondary track: <label>", and a **minimised** secondary section (see "Secondary section" below — not the full field block)

Primary-track field blocks are implemented as three components under `app/components/OCTrackFields/`:
`ViralityFields.tsx`, `RevenueFields.tsx`, `MaasFields.tsx`. Each takes `{ value, onChange }`.

The secondary section is a single shared component (`SecondaryTrackBlock.tsx`) — not a reuse of the primary field block — because secondary is opt-in and we don't want to punish teams with a full duplicate form.

### Virality fields

Used when `primaryTrack === "virality"` or `secondaryTrack === "virality"`. Stored under `trackData.virality`.

| Field | Type | Required | Help text |
|---|---|---|---|
| Impressions total | text (single field) | yes | "Sum all channels. If you have separate numbers for organic and ads, add them. Impressions and views count the same. Example: `8.2k organic + 12k ads = 20.2k` or just `20,200`." |
| Reactions / comments total | text (single field) | yes | "Sum across all posts and channels. Same format as impressions." |
| Amplification notes | textarea | yes | "How did it spread? Which posts / creators / communities picked it up? Keep it concrete." |
| Amplification proofs | multi-ProofThumbnail (1–5) | yes, ≥1 | "Screenshots of posts, retweet counts, DMs, anything that proves reach." |
| Analytics provider | select (Datafast / PostHog / Plausible / GA4 / Other) | yes | — |
| Analytics provider (other) | text | when Analytics provider = Other | — |
| Analytics read-only URL | url | no | "A shareable read-only dashboard URL judges can open." |
| Unique visitors | text | yes | "Total unique visitors to the project site / demo over the measurement window." |
| Signups count | text | yes | "Count of completed signups during the measurement window." |
| Signup event definition | textarea | yes | "What counts as a signup? e.g. `email submitted + verified`, `account created with OAuth`. Be specific." |
| Signup proof | single ProofThumbnail | yes | "One screenshot showing the signup count in your analytics tool." |

Text fields for impressions / reactions / visitors / signups are free-form on purpose — they need to accept things like `"8.2k organic + 12k ads"`. Validation warns (not blocks) if the input contains no digits.

### Revenue fields

Used when `primaryTrack === "revenue"` or `secondaryTrack === "revenue"`. Stored under `trackData.revenue`.

| Field | Type | Required | Help text |
|---|---|---|---|
| Pain point | textarea | yes | "Whose pain are you solving, and how do you know it's real? One paragraph." |
| Market size | textarea | yes | "How big is the opportunity? TAM / SAM / SOM if you have it, otherwise your best bottom-up estimate." |
| Right to win | textarea | yes | "Why you, why this, why now? What's your unfair advantage?" |
| Why now | textarea | yes | "What changed in the world (tech, market, regulation, behaviour) that makes this possible today but not 2 years ago?" |
| Traction stage | select (None / Waitlist <50 / Waitlist 50–500 / First paying or signed LOI / Multiple paying or contract) | yes | — |
| Traction details | textarea | yes | "Numbers, names, revenue, contract value. Judges want specifics." |
| Traction proofs | multi-ProofThumbnail (1–5) | yes, ≥1 when `tractionStage !== "none"` | "LOIs, payment screenshots, contract headers (redact as needed), waitlist dashboards." |
| Moat | textarea | yes | "What makes this hard to copy in 6 months — data, distribution, model, network effects?" |

### MaaS fields  `[REVIEW]`

**MaaS content needs a review pass before ship.** User flagged that the content "needs to change" — fields below are a first-pass draft; items marked `[REVIEW]` are specifically open for judgment calls about list contents, wording, and whether structured-vs-free-form makes sense.

Used when `primaryTrack === "maas"` or `secondaryTrack === "maas"`. Stored under `trackData.maas`.

| Field | Type | Required | Help text |
|---|---|---|---|
| Task domain `[REVIEW]` | select (Growth / Recruiting / Support / Sales / Other) | yes | "What job is the agent doing?" *(list needs confirmation — see open questions)* |
| Task domain (other) | text | when Task domain = Other | — |
| Real output summary | textarea | yes | "Describe real work the agent has done in production-like settings. What, for whom, with what result?" |
| Real output proofs | multi-ProofThumbnail (1–5) | yes, ≥1 | "Screenshots of the agent doing the real task end-to-end." |
| Observability tool `[REVIEW]` | select (Langfuse / Braintrust / Arize / Custom / None) | yes | "What are you using to watch the agent in the wild?" *(list needs confirmation)* |
| Observability read-only URL | url | no | "Shareable read-only link to your traces / logs." |
| Observability proof | single ProofThumbnail | yes | "One screenshot showing traces / logs for a real run." |
| Evals summary | textarea | yes | "What do you measure, how often, and what's the current score?" |
| Evals proof | single ProofThumbnail | yes | "One screenshot of your eval run / dashboard." |
| Memory architecture `[REVIEW]` | textarea | yes | "How does the agent remember? Describe your stack — embedding store, graph, cache layers, invalidation, etc." *(textarea may be too open-ended; see open questions)* |
| Management UI URL | url | yes | "Where do humans configure / supervise the agent?" |
| Management UI credentials | text | no | "Test login judges can use. Free-form. Leave blank if you send separately." |

## Secondary section (minimised)

When `secondaryTrack !== null`, render a single compact block for the chosen secondary track. Not a duplicate of the full field block — just rubric claim + proofs.

```ts
export interface SecondaryTrackClaim {
  tier?: string;         // free text, one short line e.g. "L3 — first paying customer"
  summary?: string;      // one-line context
  proofs?: ProofMedia[]; // 1–5 proofs, required ≥1
}

// stored at top level of TrackData:
export interface TrackData {
  virality?: ViralityTrackData;
  revenue?: RevenueTrackData;
  maas?: MaasTrackData;
  secondary?: SecondaryTrackClaim;
}
```

Fields rendered in the secondary block:

| Field | Type | Required | Help text |
|---|---|---|---|
| What did you hit? | text (one line) | yes | "Short rubric tier / milestone you hit. e.g. `L3 — first paying customer` or `Viral post, 50k impressions`." |
| Summary | textarea (2–3 lines) | no | "One-sentence context if needed." |
| Proofs | multi-ProofThumbnail (1–5) | yes, ≥1 | "Screenshots that prove it." |

Why minimised: secondary is an opt-in declaration that a team also made progress on another rubric. Judges score it from proofs + a one-line tier claim — they don't need the full Virality / Revenue / MaaS questionnaire repeated.

Switching `secondaryTrack` to `null` does **not** wipe `trackData.secondary` — it's preserved in case the user re-selects.

## ProofThumbnail primitive

New file: `app/components/ProofThumbnail.tsx`.

### Visual spec

- 250 × 250 px slot.
- Empty state: dashed 1.5px `C.border` border, `C.surfaceWarm` bg, centred "+ Upload proof" label, optional `hint` below (one line, `C.textMute`).
- Filled state: image (or video thumbnail) object-cover, rounded corners matching the existing `MediaUpload` primitive, small `×` icon top-right of the thumbnail.
- Clicking the thumbnail body → opens a zoom modal (full-size view, click-outside or ESC to close).
- Clicking the `×` icon → opens a confirm-delete modal.

### Confirm-delete modal

Two buttons:
- **Yes, delete** — calls `onChange(undefined)` and closes both modals.
- **No, go back** — closes the confirm modal, keeps the file, stays on the form.

Uses the same modal styling as the existing `MediaUpload` remove confirmation if one exists; otherwise implements a minimal overlay matching `responsive-modal` styles already in the file.

### Props

```ts
interface ProofThumbnailProps {
  label: string;                              // visible label above the slot
  hint?: string;                              // help copy under the slot
  value: ProofMedia | undefined;
  onChange: (next: ProofMedia | undefined) => void;
  required?: boolean;                         // shows * in label
  disabled?: boolean;
  slotId: string;                             // stable id for <input type=file>
}
```

### Multi-proof usage

For the three multi-proof fields (`amplificationProofs`, `tractionProofs`, `realOutputProofs`) we compose `ProofThumbnail` inside a wrapper that renders up to 5 slots in a wrap-flow. The wrapper takes `{ label, hint?, value: ProofMedia[], onChange: (next: ProofMedia[]) => void, max?: number = 5, minRequired?: number }`. It renders the filled proofs, then one empty trailing slot while count < max, and propagates array mutations through a single `onChange`.

No dedicated `MultiProofField` component is required if we can keep the wrapper inline; if three copies become repetitive, lift it into `app/components/OCTrackFields/MultiProofField.tsx`.

### Upload behaviour

In mock mode, uploads go through whatever pipeline `MediaUpload` currently uses (blob URL or fake URL — see open question 7). The `ProofMedia` shape is intentionally aligned with what `MediaFile` already produces, so we can reuse the upload hook/component if practical.

## Mock API pass-through

`lib/mock-api/projects.ts` — extend the `POST /projects` and `PUT /projects/:id` handlers to accept and echo back three optional fields on the body: `primaryTrack`, `secondaryTrack`, `trackData`. No validation, no shape enforcement — the mock is a pass-through. Extend `MockSubmittedProject` with these three fields (all optional) so `GET /my-projects` returns them too.

The existing mock project list (`seedProjects`) doesn't need to gain track fields — gallery rendering is unchanged.

## Validation matrix

### Step 3 (picker)

- `primaryTrack` required. Because we default to `"virality"` this step can't actually be submitted in an invalid state, so no error path.
- `secondaryTrack` optional; no validation.

### Step 4 (track data)

Required fields per track below. Text fields that should be numeric (impressions, reactions, unique visitors, signups count) **warn** (do not block) when they contain zero digits — surface a `C.textMute` hint under the input like "Heads up — we didn't see any digits here. Judges need a number."

Proof requirements:

- **Virality**: `signupsProof` required; `amplificationProofs.length >= 1` required.
- **Revenue**: `tractionProofs.length >= 1` required *unless* `tractionStage === "none"`.
- **MaaS**: `realOutputProofs.length >= 1` required; `observabilityProof` and `evalsProof` required.

If `secondaryTrack` is set, the **secondary section** validates as: `trackData.secondary.tier` required, `trackData.secondary.proofs.length >= 1` required. Primary required-field set never applies to the secondary block.

Bonus criteria (50-pt cap in rubric) and anti-spoof ratio checks are **judge-side only** — no submitter input, no inline warnings.

"Save as draft" continues to bypass all step-4 validation, just like today's Step 2 draft path.

## Draft persistence

- Keys stay `oc:submit:draft:v1` and `oc:submit:step:v1`.
- `loadStep`'s upper bound moves from `2` to `4`.
- `loadDraft` merges the three new fields into `INITIAL_DATA` with the same partial-spread pattern used today; invalid `primaryTrack` values (not one of the three keys) fall back to `"virality"`.
- We do **not** bump the draft version key unless the `trackData` shape proves to be lossy across a mid-flight refactor — flagged inline in the PR if it happens.
- `initialDraftRestored` gains a check for any non-empty track-data string so switching into a track and filling fields, then closing, still shows the "restored" banner next time.

## Implementation order

1. **Types** — add `TrackKey`, `ProofMedia`, the three track-data interfaces, and `TrackData` to `types/index.ts`.
2. **`ProofThumbnail`** primitive + confirm-delete modal + zoom modal.
3. **Per-track field components** in `app/components/OCTrackFields/`:
   - `ViralityFields.tsx`
   - `RevenueFields.tsx`
   - `MaasFields.tsx`
   - `SecondaryTrackBlock.tsx` (shared minimised block)
4. **`OCTrackPickStep.tsx`** — primary + secondary radio groups.
5. **`OCTrackDataStep.tsx`** — composes primary fields + optional secondary block.
6. **Wire into `OCSubmitForm.tsx`** — extend `SubmitData`, extend `INITIAL_DATA`, extend `loadDraft`, extend `loadStep`'s bound, bump `totalSteps` to 5, add the two new step blocks, extend the Continue-button validation switch for steps 3 and 4, extend the final POST body.
7. **Mock API pass-through** — extend `MockSubmittedProject` and both handlers in `lib/mock-api/projects.ts`.
8. **QA pass**: create flow (all three tracks as primary); edit flow via `/my-projects`; track-switch mid-wizard preserves prior fields; secondary track render and unrender; draft close-and-return restores step + all track fields; proof delete confirm + cancel both paths.

## Open questions

1. MaaS task domain — is the list `Growth / Recruiting / Support / Sales / Other` what judges actually expect, or is there a canonical list elsewhere (e.g. in the OpenCode judging rubric)?
2. MaaS observability tools — is `Langfuse / Braintrust / Arize / Custom / None` the right set? Missing anything common (Helicone, LangSmith, Weights & Biases)?
3. MaaS memory architecture — is a free-text textarea enough, or should we collect structured data (e.g. a select: `vector store / graph / hybrid / custom` + sub-text)?
4. Analytics provider options for Virality — is `Datafast / PostHog / Plausible / GA4 / Other` complete? Should we add Mixpanel, Amplitude, Umami, Fathom?
5. Do we need an "I don't have analytics yet" escape hatch for Virality, or do we require a provider to be selected? (Related: what if someone's virality lives purely on Twitter/LinkedIn and never touches a site?)
6. Proof upload size/type limits — match `MediaUpload`'s existing limits, or tighter (e.g. images-only for proofs, no video)?
7. Where do proofs actually upload to in mock mode — data URL, blob URL, or a fake CDN-style URL? Does the existing `MediaUpload` pipeline already resolve this?
8. Should the **secondary** track have a reduced-required-field set (e.g. only the headline numbers), or exactly the same required set as primary? Rationale to loosen: secondary is opt-in, we don't want to punish teams for declaring it.
9. Anti-spoof — if reactions/impressions ratio is >X% (say >30%), do we warn inline on Step 4 or silently record for judge side only? Same for `signupsCount / uniqueVisitors > 100%`.
10. Bonus criteria (the 50-pt cap in the rubric) — do we collect any submitter-supplied data for it, or is it entirely judge-side? If any submitter input is needed, does it belong on Step 4 or a new Step 4b?
