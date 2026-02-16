"use client";

import { useState } from "react";
import { C } from "@/types";

interface SubmitModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = ["AI tool", "SaaS", "Developer tool", "Mobile app", "Chrome extension", "API", "Other"];

export default function SubmitModal({ onClose, onSuccess }: SubmitModalProps) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          category,
          stack: stack
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (res.status === 401) {
        setError("Please sign in first");
        return;
      }

      if (res.ok) {
        onSuccess?.();
        onClose();
      } else {
        setError("Failed to submit project");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: C.text,
    background: C.surface,
    outline: "none",
    fontFamily: "var(--sans)",
  };

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
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}
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

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "#DC2626",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

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
              Project name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ContextPilot"
              style={inputStyle}
              required
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
              Tagline *
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One sentence about your product"
              style={inputStyle}
              required
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
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
              Tech stack
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Next.js, React, Supabase (comma separated)"
              style={inputStyle}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your product..."
              rows={3}
              style={{ ...inputStyle, resize: "none" as const }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button
              type="button"
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
              type="submit"
              disabled={loading || !name.trim() || !tagline.trim()}
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
                opacity: loading || !name.trim() || !tagline.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
