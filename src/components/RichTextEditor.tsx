"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { C } from "@/types";
import { descriptionCharCount, extractPlainText, getEditorState } from "@/lib/editor-utils";

const Editor = dynamic(
  () => import("@growthx-club/gx-editor/richtext/Editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: 200, background: C.bg, borderRadius: 10,
          border: `1px solid ${C.borderLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.textMute, fontSize: 13, fontFamily: "var(--sans)",
        }}
      >
        Loading editor…
      </div>
    ),
  }
);

const CHAR_LIMIT = 1500;

interface RichTextEditorProps {
  value: string;
  onChange: (json: string) => void;
  maxChars?: number;
}

export default function RichTextEditor({ value, onChange, maxChars = CHAR_LIMIT }: RichTextEditorProps) {
  const [charCount, setCharCount] = useState(() => descriptionCharCount(value));

  const editorState = value ? getEditorState(value) : null;

  const handleChange = (state: { toJSON: () => unknown }) => {
    const json = JSON.stringify(state.toJSON());
    const count = extractPlainText(json).length;
    setCharCount(count);
    onChange(json);
  };

  const isNearLimit = charCount >= maxChars - 150;
  const isAtLimit = charCount >= maxChars;

  return (
    <div>
      <Editor
        editorState={editorState}
        theme="light"
        toolbarPosition="top"
        onError={(error: Error) => console.error("Editor error:", error)}
        onChange={handleChange}
        sx={{
          "&.editor-container": {
            backgroundColor: C.bg,
            color: C.text,
            borderRadius: "10px",
            border: `1px solid ${isAtLimit ? C.error : C.borderLight}`,
            minHeight: "200px",
            maxHeight: "400px",
            fontFamily: "var(--sans)",
            fontSize: "14px",
            transition: "border-color 0.15s",
          },
          ".editor-inner": {
            padding: "12px 16px",
            background: "transparent",
            position: "relative",
          },
          ".editor-input": {
            minHeight: "140px",
            outline: "none",
          },
          ".editor-placeholder": {
            color: C.textMute,
            fontFamily: "var(--sans)",
            fontSize: "14px",
            position: "absolute",
            top: "12px",
            left: "16px",
            pointerEvents: "none",
          },
          ".editor-toolbar": {
            backgroundColor: C.surface,
            borderBottom: `1px solid ${C.borderLight}`,
            borderTop: "none",
            borderRadius: "10px 10px 0 0",
            height: "auto",
            padding: "8px 12px",
            gap: "4px",
          },
          ".editor-toolbar button": {
            background: C.surface,
            color: C.textSec,
            borderRadius: "6px",
            padding: "4px 8px",
          },
          ".editor-toolbar button:hover": {
            background: C.accentSoft,
            color: C.text,
          },
          ".editor-toolbar button.active": {
            background: C.accent,
            color: C.accentFg,
          },
          ".editor-toolbar button.active:hover": {
            background: C.accent,
            opacity: 0.9,
          },
          // Hide the Normal/Heading dropdown
          ".toolbar-select": {
            display: "none !important",
          },
          // List icon colors (override dark theme defaults)
          ".editor-toolbar button svg": {
            "--primary-stroke": C.textSec,
            "--primary-fill": C.textSec,
          },
          ".editor-toolbar button.active svg": {
            "--primary-stroke": C.accentFg,
            "--primary-fill": C.accentFg,
          },
          ".paragraph": {
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: "14px",
            lineHeight: 1.6,
            paddingTop: "6px",
          },
          ".h1, .h2, .h3": {
            color: C.text,
            fontFamily: "var(--serif)",
          },
          ".listitem": {
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: "14px",
          },
          ".quote": {
            color: C.textSec,
            borderLeftColor: C.accent,
          },
          ".link": { color: C.blue },
          ul: { listStyle: "initial" },
          ol: { listStyle: "number" },
        }}
      />
      <div
        style={{
          fontSize: 11, marginTop: 4, textAlign: "right", fontFamily: "var(--sans)",
          color: isAtLimit ? C.error : isNearLimit ? C.gold : C.textMute,
          fontWeight: isAtLimit ? 600 : 400,
        }}
      >
        {charCount}/{maxChars}{isAtLimit && " \u2014 limit reached"}
      </div>
    </div>
  );
}
