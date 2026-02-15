"use client";

import { C } from "@/types";

const TABS = [
  { key: "built", label: "Built", count: 6 },
  { key: "building", label: "Building", count: 4 },
  { key: "builders", label: "Builders", count: 10 },
  { key: "cities", label: "Cities", count: 11 },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export default function Navigation({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <nav
      style={{
        display: "flex",
        gap: 0,
        padding: "0 24px",
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "12px 20px",
            fontSize: 13,
            fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? C.text : C.textMute,
            background: "none",
            border: "none",
            borderBottom:
              active === tab.key
                ? `2px solid ${C.text}`
                : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "var(--sans)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          {tab.label}
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: active === tab.key ? C.textSec : C.textMute,
              background: active === tab.key ? C.accentSoft : C.surfaceWarm,
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </nav>
  );
}
