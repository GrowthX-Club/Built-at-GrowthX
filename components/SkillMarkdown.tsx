import { Fragment } from "react";
import { C, T } from "@/types";
import { parseSkillMarkdown, type InlineToken, type MarkdownBlock } from "@/lib/skill-markdown";

function Inline({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === "code") {
          return (
            <code
              key={i}
              style={{
                fontFamily: "var(--mono)",
                fontSize: T.label,
                background: C.accentSoft,
                color: C.text,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              {token.value}
            </code>
          );
        }
        if (token.type === "strong") {
          return (
            <strong key={i} style={{ color: C.text, fontWeight: 600 }}>
              {token.value}
            </strong>
          );
        }
        if (token.type === "link") {
          return (
            <a
              key={i}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              style={{ color: C.blue, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {token.value}
            </a>
          );
        }
        return <Fragment key={i}>{token.value}</Fragment>;
      })}
    </>
  );
}

const HEADING_SIZE = { 1: T.heading, 2: T.bodyLg + 1, 3: T.body } as const;

function Block({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const Tag = (`h${block.level + 1}`) as "h2" | "h3" | "h4";
    return (
      <Tag
        style={{
          fontFamily: "var(--serif)",
          fontSize: HEADING_SIZE[block.level],
          fontWeight: 600,
          color: C.text,
          margin: block.level === 1 ? "0 0 14px" : "24px 0 8px",
          lineHeight: 1.3,
        }}
      >
        <Inline tokens={block.content} />
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p style={{ margin: "0 0 12px", color: C.textSec, fontSize: T.bodySm + 1, lineHeight: 1.65 }}>
        <Inline tokens={block.content} />
      </p>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag style={{ margin: "0 0 12px", paddingLeft: 20, color: C.textSec, fontSize: T.bodySm + 1, lineHeight: 1.65 }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ marginBottom: 5 }}>
            <Inline tokens={item} />
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre
        style={{
          fontFamily: "var(--mono)",
          fontSize: T.caption,
          lineHeight: 1.6,
          background: "var(--c-codeBg)",
          color: "var(--c-codeFg)",
          border: "1px solid var(--c-codeBorder)",
          borderRadius: 8,
          padding: "12px 14px",
          margin: "0 0 16px",
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        {block.value}
      </pre>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        style={{
          margin: "0 0 12px",
          padding: "2px 0 2px 14px",
          borderLeft: `2px solid ${C.border}`,
          color: C.textMute,
          fontSize: T.bodySm + 1,
        }}
      >
        <Inline tokens={block.content} />
      </blockquote>
    );
  }

  return <hr style={{ border: 0, borderTop: `1px solid ${C.borderLight}`, margin: "20px 0" }} />;
}

export default function SkillMarkdown({ source }: { source: string }) {
  const { frontmatter, blocks } = parseSkillMarkdown(source);

  if (!source.trim()) {
    return (
      <div style={{ padding: "22px 26px", color: C.textMute, fontSize: T.bodySm }}>
        This version shipped no readable SKILL.md.
      </div>
    );
  }

  return (
    <div style={{ padding: "22px 26px 26px" }}>
      {frontmatter.length > 0 && (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: T.caption,
            lineHeight: 1.6,
            background: C.surfaceWarm,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 8,
            padding: "12px 14px",
            margin: "0 0 20px",
            color: C.textSec,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {frontmatter.map((entry) => (
            <div key={entry.key}>
              <b style={{ color: C.text, fontWeight: 500 }}>{entry.key}:</b> {entry.value}
            </div>
          ))}
        </div>
      )}
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
