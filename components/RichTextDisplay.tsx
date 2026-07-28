"use client";

import dynamic from "next/dynamic";
import React from "react";
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

// ---- Markdown-lite rendering for legacy plain-text descriptions ----
// Supports **bold**, `---` horizontal rules, and bare http(s) links.
// Builds React nodes only — never raw HTML (descriptions are builder-authored).

const INLINE_TOKEN = /(\*\*[^*\n]+\*\*|https?:\/\/[^\s]+)/g;

function renderInline(line: string, lineKey: number): React.ReactNode[] {
  return line.split(INLINE_TOKEN).map((part, i) => {
    if (/^\*\*[^*\n]+\*\*$/.test(part)) {
      return (
        <strong key={`${lineKey}-${i}`} style={{ fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\//.test(part)) {
      // Keep trailing punctuation out of the link
      const trailing = part.match(/[),.;:!?]+$/)?.[0] ?? "";
      const url = trailing ? part.slice(0, part.length - trailing.length) : part;
      return (
        <React.Fragment key={`${lineKey}-${i}`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: C.blue,
              textDecoration: "underline",
              textUnderlineOffset: 2,
              overflowWrap: "anywhere",
            }}
          >
            {url}
          </a>
          {trailing}
        </React.Fragment>
      );
    }
    return part;
  });
}

function renderMarkdownLite(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.trim() === "---") {
      return (
        <hr
          key={i}
          style={{
            border: "none",
            borderTop: `1px solid ${C.borderLight}`,
            margin: "16px 0",
          }}
        />
      );
    }
    const next = lines[i + 1];
    const needsNewline = i < lines.length - 1 && (next === undefined || next.trim() !== "---");
    return (
      <React.Fragment key={i}>
        {renderInline(line, i)}
        {needsNewline ? "\n" : null}
      </React.Fragment>
    );
  });
}

export default function RichTextDisplay({ description }: RichTextDisplayProps) {
  // Legacy plain text — render markdown-lite as React nodes (zero editor JS overhead).
  // A <div> (not <p>) so <hr> rules are valid HTML and SSR hydration stays clean.
  if (!isLexicalJson(description)) {
    return (
      <div
        style={{
          fontSize: 16, lineHeight: 1.7, color: C.text,
          fontFamily: "var(--sans)", fontWeight: 400,
          margin: "0 0 28px", maxWidth: 620,
          whiteSpace: "pre-wrap",
        }}
      >
        {renderMarkdownLite(description)}
      </div>
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
            color: "inherit",
            textDecoration: "none",
            pointerEvents: "none" as const,
            cursor: "text",
          },
          ".text-bold": { fontWeight: 600 },
          ul: { listStyle: "initial" },
          ol: { listStyle: "number" },
        }}
      />
    </div>
  );
}
