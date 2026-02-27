"use client";

import dynamic from "next/dynamic";
import { C } from "@/types";
import { isLexicalJson } from "@/lib/editor-utils";

const Editor = dynamic(
  () => import("@growthx-club/gx-editor/richtext/Editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: 40 }} />,
  }
);

interface RichTextDisplayProps {
  description: string;
}

export default function RichTextDisplay({ description }: RichTextDisplayProps) {
  // Legacy plain text — render as <p> tag (zero JS overhead, identical to current)
  if (!isLexicalJson(description)) {
    return (
      <p
        style={{
          fontSize: 16, lineHeight: 1.7, color: C.text,
          fontFamily: "var(--sans)", fontWeight: 400,
          margin: "0 0 28px", maxWidth: 620,
          whiteSpace: "pre-wrap",
        }}
      >
        {description}
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 620, marginBottom: 28 }}>
      <Editor
        editorState={description}
        readOnly
        key={description}
        theme="light"
        onError={() => {}}
        sx={{
          "&.editor-container": {
            backgroundColor: "transparent",
            color: C.text,
            borderRadius: 0,
            border: "none",
            minHeight: "auto",
            maxHeight: "none",
            fontFamily: "var(--sans)",
            overflow: "visible",
          },
          ".editor-inner": {
            padding: 0,
            background: "transparent",
          },
          ".editor-input": {
            minHeight: "auto",
          },
          ".paragraph": {
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: "16px",
            lineHeight: 1.7,
            fontWeight: 400,
            paddingTop: "8px",
          },
          ".h1, .h2, .h3": {
            color: C.text,
            fontFamily: "var(--serif)",
          },
          ".listitem": {
            color: C.text,
            fontFamily: "var(--sans)",
            fontSize: "16px",
            lineHeight: 1.7,
          },
          ".quote": {
            color: C.textSec,
            borderLeftColor: C.accent,
            fontStyle: "italic",
          },
          ".link": {
            color: C.blue,
            textDecoration: "underline",
          },
          ".text-bold": { fontWeight: 600 },
          ul: { listStyle: "initial" },
          ol: { listStyle: "number" },
        }}
      />
    </div>
  );
}
