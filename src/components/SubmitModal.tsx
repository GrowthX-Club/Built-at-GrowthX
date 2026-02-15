"use client";

import { C } from "@/types";

interface SubmitModalProps {
  onClose: () => void;
}

export default function SubmitModal({ onClose }: SubmitModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: C.surface,
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: 600,
                margin: 0,
                color: C.text,
              }}
            >
              Submit a project
            </h2>
            <p style={{ fontSize: 13, color: C.textSec, margin: "4px 0 0" }}>
              Share what you&apos;ve built with the community
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: C.textMute,
              cursor: "pointer",
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                marginBottom: 6,
              }}
            >
              Project name
            </label>
            <input
              type="text"
              placeholder="e.g. ContextPilot"
              style={{
                width: "100%",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: C.text,
                background: C.surface,
                outline: "none",
                fontFamily: "var(--sans)",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                marginBottom: 6,
              }}
            >
              Tagline
            </label>
            <input
              type="text"
              placeholder="One sentence about your product"
              style={{
                width: "100%",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: C.text,
                background: C.surface,
                outline: "none",
                fontFamily: "var(--sans)",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Tell us about your product..."
              rows={3}
              style={{
                width: "100%",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: C.text,
                background: C.surface,
                outline: "none",
                fontFamily: "var(--sans)",
                resize: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                color: C.textSec,
                background: C.surface,
                cursor: "pointer",
                fontFamily: "var(--sans)",
              }}
            >
              Cancel
            </button>
            <button
              style={{
                flex: 1,
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: C.accent,
                cursor: "pointer",
                fontFamily: "var(--sans)",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
