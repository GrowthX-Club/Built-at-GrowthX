import { useState } from "react";
import { C, T, type MaasTier, type FormError } from "@/types";

interface TierAccordionProps {
  paramId: string;                    // e.g. "maas.realOutput"
  title: string;                      // e.g. "Working product shipping real output"
  subtitle?: string;                  // e.g. "Root parameter · 20x weight · 80 max"
  weight?: string;                    // optional chip text, e.g. "20x"
  tier: MaasTier | undefined;
  onTierChange: (t: MaasTier) => void;
  tierDescriptions: Record<MaasTier, string>;
  children?: React.ReactNode;         // proof inputs, shown when tier is set
  errors?: FormError[];
  defaultOpen?: boolean;
}

const TIERS: MaasTier[] = ["L1", "L2", "L3", "L4", "L5"];

export default function TierAccordion({
  paramId,
  title,
  subtitle,
  weight,
  tier,
  onTierChange,
  tierDescriptions,
  children,
  errors,
  defaultOpen = false,
}: TierAccordionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  const tierError = errors?.find((e) => e.id === `${paramId}.tier`);

  return (
    <div
      id={paramId}
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        background: C.surface,
        overflow: "hidden",
      }}
    >
      {/* Header — click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${paramId}.body`}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: T.bodyLg, fontWeight: 600, color: C.text,
              fontFamily: "var(--serif)", letterSpacing: "-0.01em", lineHeight: 1.3,
            }}>
              {title}
            </span>
            {weight && (
              <span style={{
                fontSize: T.caption, fontWeight: 650, color: C.textSec,
                background: C.surfaceWarm, border: `1px solid ${C.borderLight}`,
                padding: "2px 8px", borderRadius: 999,
                fontFamily: "var(--sans)", letterSpacing: "0.02em",
              }}>
                {weight}
              </span>
            )}
            {tier ? (
              <span style={{
                fontSize: T.caption, fontWeight: 700, color: C.accentFg,
                background: C.accent, padding: "2px 8px", borderRadius: 999,
                fontFamily: "var(--sans)", letterSpacing: "0.02em",
              }}>
                {tier} claimed
              </span>
            ) : (
              <span style={{
                fontSize: T.caption, fontWeight: 500, color: C.textMute,
                fontFamily: "var(--sans)", letterSpacing: "0.02em",
              }}>
                Not picked yet
              </span>
            )}
          </div>
          {subtitle && (
            <span style={{
              fontSize: T.caption, color: C.textMute,
              fontFamily: "var(--sans)", lineHeight: 1.45,
            }}>
              {subtitle}
            </span>
          )}
        </div>
        {/* Chevron */}
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
          id={`${paramId}.body`}
          style={{
            padding: "4px 18px 20px",
            borderTop: `1px solid ${C.borderLight}`,
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          <div
            id={`${paramId}.tier`}
            role="radiogroup"
            aria-label={`${title} tier`}
            style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}
          >
            {TIERS.map((t) => {
              const selected = tier === t;
              return (
                <button
                  key={t}
                  id={`${paramId}.tier.${t}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onTierChange(t)}
                  style={{
                    padding: "12px 14px", borderRadius: 14,
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
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: T.bodySm, color: C.text, lineHeight: 1.45, fontWeight: selected ? 600 : 500 }}>
                      {tierDescriptions[t]}
                    </span>
                  </span>
                  <span style={{
                    fontSize: T.caption, color: C.textMute, fontWeight: 600,
                    letterSpacing: "0.04em", flexShrink: 0, marginTop: 3,
                  }}>
                    {t}
                  </span>
                </button>
              );
            })}
          </div>

          {tierError && (
            <div style={{
              fontSize: T.caption, color: C.errorText, fontFamily: "var(--sans)",
              lineHeight: 1.4,
            }}>
              {tierError.message}
            </div>
          )}

          {tier && children && (
            <>
              <div style={{ height: 1, background: C.borderLight, marginTop: 4 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {children}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
