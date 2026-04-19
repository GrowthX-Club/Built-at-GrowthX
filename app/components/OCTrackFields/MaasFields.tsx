import { useState } from "react";
import {
  C, T,
  type MaasTrackData,
  type MaasTaskDomain,
  type MaasRealOutputClaim,
  type MaasOrgStructureClaim,
  type MaasObservabilityClaim,
  type MaasEvalsClaim,
  type MaasMemoryClaim,
  type MaasCostLatencyClaim,
  type MaasManagementUiClaim,
  type FormError,
} from "@/types";
import { ProofThumbnailGroup } from "../ProofThumbnail";

interface Props {
  value: MaasTrackData;
  onPatch: (patch: Partial<MaasTrackData>) => void;
  slotPrefix: string;
  errors?: FormError[];
  onClearError?: (id: string) => void;
}

const TASK_DOMAIN_OPTIONS: { value: MaasTaskDomain | ""; label: string }[] = [
  { value: "", label: "Select one…" },
  { value: "marketing", label: "Marketing" },
  { value: "hiring", label: "Hiring" },
  { value: "sales", label: "Sales" },
  { value: "legal", label: "Legal" },
  { value: "support", label: "Support" },
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "other", label: "Other" },
];

function findErr(errors: FormError[] | undefined, id: string): FormError | undefined {
  return errors?.find((e) => e.id === id);
}

function FieldError({ error }: { error: FormError | undefined }) {
  if (!error) return null;
  return (
    <div style={{
      fontSize: T.caption, color: C.errorText,
      fontFamily: "var(--sans)", lineHeight: 1.4, marginTop: 6,
    }}>
      {error.message}
    </div>
  );
}

type SectionKey =
  | "realOutput"
  | "orgStructure"
  | "observability"
  | "evals"
  | "memory"
  | "costLatency"
  | "managementUi";

interface SectionProps {
  id: string;
  title: string;
  helper: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ id, title, helper, open, onToggle, children }: SectionProps) {
  return (
    <div
      id={id}
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.surface,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}.body`}
        style={{
          width: "100%",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--sans)",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{
            fontSize: T.bodyLg, fontWeight: 600, color: C.text,
            fontFamily: "var(--serif)", letterSpacing: "-0.01em", lineHeight: 1.3,
          }}>
            {title}
          </span>
          <span style={{
            fontSize: T.caption, color: C.textMute,
            fontFamily: "var(--sans)", lineHeight: 1.45,
          }}>
            {helper}
          </span>
        </div>
        <span
          aria-hidden
          style={{
            width: 22, height: 22, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            color: C.textMute, flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          id={`${id}.body`}
          style={{
            padding: "4px 18px 20px",
            borderTop: `1px solid ${C.borderLight}`,
            display: "flex", flexDirection: "column", gap: 20,
            marginTop: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 14 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaasFields({ value, onPatch, slotPrefix, errors, onClearError }: Props) {
  const clear = (id: string) => onClearError?.(id);
  const realOutput: MaasRealOutputClaim = value.realOutput ?? {};
  const orgStructure: MaasOrgStructureClaim = value.orgStructure ?? {};
  const observability: MaasObservabilityClaim = value.observability ?? {};
  const evals: MaasEvalsClaim = value.evals ?? {};
  const memory: MaasMemoryClaim = value.memory ?? {};
  const costLatency: MaasCostLatencyClaim = value.costLatency ?? {};
  const managementUi: MaasManagementUiClaim = value.managementUi ?? {};

  const patchRealOutput = (patch: Partial<MaasRealOutputClaim>) =>
    onPatch({ realOutput: { ...realOutput, ...patch } });
  const patchOrgStructure = (patch: Partial<MaasOrgStructureClaim>) =>
    onPatch({ orgStructure: { ...orgStructure, ...patch } });
  const patchObservability = (patch: Partial<MaasObservabilityClaim>) =>
    onPatch({ observability: { ...observability, ...patch } });
  const patchEvals = (patch: Partial<MaasEvalsClaim>) =>
    onPatch({ evals: { ...evals, ...patch } });
  const patchMemory = (patch: Partial<MaasMemoryClaim>) =>
    onPatch({ memory: { ...memory, ...patch } });
  const patchCostLatency = (patch: Partial<MaasCostLatencyClaim>) =>
    onPatch({ costLatency: { ...costLatency, ...patch } });
  const patchManagementUi = (patch: Partial<MaasManagementUiClaim>) =>
    onPatch({ managementUi: { ...managementUi, ...patch } });

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    realOutput: true,
    orgStructure: false,
    observability: false,
    evals: false,
    memory: false,
    costLatency: false,
    managementUi: false,
  });

  const toggle = (k: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Section
        id="maas.realOutput"
        title="Working product shipping real output"
        helper="Judges look for: a real live surface where the agent is doing real work end-to-end."
        open={openSections.realOutput}
        onToggle={() => toggle("realOutput")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.realOutput.taskDomain">
            Task domain <span className="req">*</span>
          </label>
          <select
            id="maas.realOutput.taskDomain"
            className="submit-input"
            value={realOutput.taskDomain ?? ""}
            onChange={(e) => {
              clear("maas.realOutput.taskDomain");
              patchRealOutput({ taskDomain: (e.target.value || undefined) as MaasTaskDomain | undefined });
            }}
            style={{ fontFamily: "var(--sans)", appearance: "auto" }}
          >
            {TASK_DOMAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {realOutput.taskDomain === "other" && (
            <input
              id="maas.realOutput.taskDomainOther"
              className="submit-input"
              placeholder="Which domain?"
              value={realOutput.taskDomainOther ?? ""}
              onChange={(e) => {
                clear("maas.realOutput.taskDomainOther");
                patchRealOutput({ taskDomainOther: e.target.value });
              }}
              style={{ marginTop: 8 }}
            />
          )}
          <div className="submit-hint">What job is the agent doing end-to-end?</div>
          <FieldError error={findErr(errors, "maas.realOutput.taskDomain")} />
          {realOutput.taskDomain === "other" && (
            <FieldError error={findErr(errors, "maas.realOutput.taskDomainOther")} />
          )}
        </div>

        <div>
          <label className="submit-label" htmlFor="maas.realOutput.surfaceUrl">
            Live surface URL <span className="req">*</span>
          </label>
          <input
            id="maas.realOutput.surfaceUrl"
            className="submit-input"
            placeholder="https://… (where the output actually lands)"
            value={realOutput.surfaceUrl ?? ""}
            onChange={(e) => {
              clear("maas.realOutput.surfaceUrl");
              patchRealOutput({ surfaceUrl: e.target.value });
            }}
          />
          <div className="submit-hint">
            The real surface judges can open — the website, the Slack channel, the ticket queue, the CRM.
          </div>
          <FieldError error={findErr(errors, "maas.realOutput.surfaceUrl")} />
        </div>

        <div id="maas.realOutput.proofs">
          <ProofThumbnailGroup
            label="Real output proofs"
            hint="Screenshots / recordings of the agent doing the real task end-to-end on the real surface."
            value={realOutput.proofs ?? []}
            onChange={(next) => {
              clear("maas.realOutput.proofs");
              patchRealOutput({ proofs: next });
            }}
            max={5}
            minRequired={1}
            slotIdPrefix={`${slotPrefix}-real`}
          />
          <FieldError error={findErr(errors, "maas.realOutput.proofs")} />
        </div>

        <div>
          <label className="submit-label" htmlFor="maas.realOutput.overflowCount">
            Tasks completed autonomously during the judging window
            <span style={{ color: C.textMute, fontWeight: 400 }}> (optional)</span>
          </label>
          <input
            id="maas.realOutput.overflowCount"
            className="submit-input"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={realOutput.overflowCount ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                patchRealOutput({ overflowCount: undefined });
                return;
              }
              const n = Math.max(0, Math.floor(Number(raw)));
              patchRealOutput({ overflowCount: Number.isFinite(n) ? n : undefined });
            }}
            style={{ fontFamily: "var(--sans)" }}
          />
          <div className="submit-hint">
            Only count tasks completed fully autonomously, on the real surface, during the judging window.
          </div>
          <FieldError error={findErr(errors, "maas.realOutput.overflowCount")} />
        </div>

        <div>
          <label className="submit-label" htmlFor="maas.realOutput.overflowNotes">
            Notes on those runs <span style={{ color: C.textMute, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="maas.realOutput.overflowNotes"
            className="submit-input"
            placeholder="Briefly describe those runs — what, when, and where they landed."
            value={realOutput.overflowNotes ?? ""}
            onChange={(e) => patchRealOutput({ overflowNotes: e.target.value })}
            rows={3}
            style={{ resize: "vertical", minHeight: 72, fontFamily: "var(--sans)" }}
          />
        </div>
      </Section>

      <Section
        id="maas.orgStructure"
        title="Agent org structure"
        helper="Judges look for: how many agents, who manages whom, how routing is decided."
        open={openSections.orgStructure}
        onToggle={() => toggle("orgStructure")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.orgStructure.notes">
            Architecture description <span className="req">*</span>
          </label>
          <textarea
            id="maas.orgStructure.notes"
            className="submit-input"
            placeholder="How many agents, who's the manager, how is routing decided, when do subagents get spawned?"
            value={orgStructure.notes ?? ""}
            onChange={(e) => {
              clear("maas.orgStructure.notes");
              patchOrgStructure({ notes: e.target.value });
            }}
            rows={4}
            style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--sans)" }}
          />
          <div className="submit-hint">Concrete. Names of agents, tools they each have, who calls whom.</div>
          <FieldError error={findErr(errors, "maas.orgStructure.notes")} />
        </div>

        <div id="maas.orgStructure.proofs">
          <ProofThumbnailGroup
            label="Architecture diagram"
            hint="Optional — a diagram, chart, or screenshot showing how your agents are organised."
            value={orgStructure.proofs ?? []}
            onChange={(next) => patchOrgStructure({ proofs: next })}
            max={3}
            minRequired={0}
            slotIdPrefix={`${slotPrefix}-org`}
          />
          <FieldError error={findErr(errors, "maas.orgStructure.proofs")} />
        </div>
      </Section>

      <Section
        id="maas.observability"
        title="Observability"
        helper="Judges look for: a trace of a real run — what each agent did, step by step."
        open={openSections.observability}
        onToggle={() => toggle("observability")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.observability.tool">
            Tool <span className="req">*</span>
          </label>
          <input
            id="maas.observability.tool"
            className="submit-input"
            placeholder="e.g. Langfuse, Braintrust, Arize, Helicone, custom-built"
            value={observability.tool ?? ""}
            onChange={(e) => {
              clear("maas.observability.tool");
              patchObservability({ tool: e.target.value });
            }}
          />
          <div className="submit-hint">Whatever you&rsquo;re using to watch runs — name it.</div>
          <FieldError error={findErr(errors, "maas.observability.tool")} />
        </div>

        <div id="maas.observability.proofs">
          <ProofThumbnailGroup
            label="Observability proofs"
            hint="Screenshot(s) of traces / logs for a real run."
            value={observability.proofs ?? []}
            onChange={(next) => {
              clear("maas.observability.proofs");
              patchObservability({ proofs: next });
            }}
            max={5}
            minRequired={1}
            slotIdPrefix={`${slotPrefix}-obs`}
          />
          <FieldError error={findErr(errors, "maas.observability.proofs")} />
        </div>
      </Section>

      <Section
        id="maas.evals"
        title="Evaluation and iteration"
        helper="Judges look for: a named eval set and evidence you run it when you ship changes."
        open={openSections.evals}
        onToggle={() => toggle("evals")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.evals.notes">
            Eval set description <span className="req">*</span>
          </label>
          <textarea
            id="maas.evals.notes"
            className="submit-input"
            placeholder="What's in your eval set? How big, how chosen, what do you score, what's the current pass rate?"
            value={evals.notes ?? ""}
            onChange={(e) => {
              clear("maas.evals.notes");
              patchEvals({ notes: e.target.value });
            }}
            rows={4}
            style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--sans)" }}
          />
          <FieldError error={findErr(errors, "maas.evals.notes")} />
        </div>

        <div>
          <label className="submit-label" htmlFor="maas.evals.ciUrl">
            CI / eval pipeline URL
            <span style={{ color: C.textMute, fontWeight: 400 }}> (optional)</span>
          </label>
          <input
            id="maas.evals.ciUrl"
            className="submit-input"
            placeholder="https://…"
            value={evals.ciUrl ?? ""}
            onChange={(e) => patchEvals({ ciUrl: e.target.value })}
          />
          <div className="submit-hint">Link to a CI run, eval dashboard, or version-diff view.</div>
          <FieldError error={findErr(errors, "maas.evals.ciUrl")} />
        </div>

        <div id="maas.evals.proofs">
          <ProofThumbnailGroup
            label="Eval proofs"
            hint="Screenshot(s) of an eval run or dashboard."
            value={evals.proofs ?? []}
            onChange={(next) => {
              clear("maas.evals.proofs");
              patchEvals({ proofs: next });
            }}
            max={5}
            minRequired={1}
            slotIdPrefix={`${slotPrefix}-evals`}
          />
          <FieldError error={findErr(errors, "maas.evals.proofs")} />
        </div>
      </Section>

      <Section
        id="maas.memory"
        title="Agent handoffs and memory"
        helper="Judges look for: how context moves between agents and across tasks."
        open={openSections.memory}
        onToggle={() => toggle("memory")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.memory.architecture">
            Memory architecture <span className="req">*</span>
          </label>
          <textarea
            id="maas.memory.architecture"
            className="submit-input"
            placeholder="How does the agent remember across steps or tasks? Stores, schemas, invalidation, retrieval."
            value={memory.architecture ?? ""}
            onChange={(e) => {
              clear("maas.memory.architecture");
              patchMemory({ architecture: e.target.value });
            }}
            rows={4}
            style={{ resize: "vertical", minHeight: 90, fontFamily: "var(--sans)" }}
          />
          <FieldError error={findErr(errors, "maas.memory.architecture")} />
        </div>
      </Section>

      <Section
        id="maas.costLatency"
        title="Cost and latency per task"
        helper="Judges look for: wall-clock time and all-in cost of one completed task."
        open={openSections.costLatency}
        onToggle={() => toggle("costLatency")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.costLatency.timePerTask">
            Time per task <span className="req">*</span>
          </label>
          <input
            id="maas.costLatency.timePerTask"
            className="submit-input"
            placeholder="e.g. 42s, or 3 min average"
            value={costLatency.timePerTask ?? ""}
            onChange={(e) => {
              clear("maas.costLatency.timePerTask");
              patchCostLatency({ timePerTask: e.target.value });
            }}
          />
          <div className="submit-hint">Wall-clock end-to-end, not just LLM time.</div>
          <FieldError error={findErr(errors, "maas.costLatency.timePerTask")} />
        </div>

        <div>
          <label className="submit-label" htmlFor="maas.costLatency.costPerTask">
            Cost per task <span className="req">*</span>
          </label>
          <input
            id="maas.costLatency.costPerTask"
            className="submit-input"
            placeholder="e.g. $0.07, or ₹6"
            value={costLatency.costPerTask ?? ""}
            onChange={(e) => {
              clear("maas.costLatency.costPerTask");
              patchCostLatency({ costPerTask: e.target.value });
            }}
          />
          <div className="submit-hint">All-in: model + tools + infra, per completed task.</div>
          <FieldError error={findErr(errors, "maas.costLatency.costPerTask")} />
        </div>
      </Section>

      <Section
        id="maas.managementUi"
        title="Management UI"
        helper="Judges look for: a live URL where a human can configure or supervise the agent."
        open={openSections.managementUi}
        onToggle={() => toggle("managementUi")}
      >
        <div>
          <label className="submit-label" htmlFor="maas.managementUi.url">
            Management UI URL <span className="req">*</span>
          </label>
          <input
            id="maas.managementUi.url"
            className="submit-input"
            placeholder="https://… (where humans configure / supervise the agent)"
            value={managementUi.url ?? ""}
            onChange={(e) => {
              clear("maas.managementUi.url");
              patchManagementUi({ url: e.target.value });
            }}
          />
          <div className="submit-hint">A live URL. Test creds if needed can go in your submission notes.</div>
          <FieldError error={findErr(errors, "maas.managementUi.url")} />
        </div>

        <div id="maas.managementUi.proofs">
          <ProofThumbnailGroup
            label="UI video / screenshots"
            hint="Optional — a short walkthrough or screenshots showing a non-engineer using it."
            value={managementUi.proofs ?? []}
            onChange={(next) => patchManagementUi({ proofs: next })}
            max={5}
            minRequired={0}
            slotIdPrefix={`${slotPrefix}-mgmt`}
          />
          <FieldError error={findErr(errors, "maas.managementUi.proofs")} />
        </div>
      </Section>

      <style>{`
        textarea.submit-input { padding: 12px 16px; font-size: ${T.body}px; }
        select.submit-input { padding: 11px 14px; }
      `}</style>
    </div>
  );
}
