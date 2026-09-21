/**
 * Just enough Markdown for a SKILL.md body. Deliberately structural only — the
 * text is published by members and never reaches the DOM as HTML.
 */

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; value: string }
  | { type: "link"; value: string; href: string };

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: InlineToken[] }
  | { type: "paragraph"; content: InlineToken[] }
  | { type: "list"; ordered: boolean; items: InlineToken[][] }
  | { type: "code"; value: string }
  | { type: "quote"; content: InlineToken[] }
  | { type: "rule" };

export interface ParsedSkillMarkdown {
  frontmatter: Array<{ key: string; value: string }>;
  blocks: MarkdownBlock[];
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/;

const ALLOWED_LINK_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/**
 * SKILL.md is unreviewed member content, so a link only survives if the URL parser — not a
 * regex — agrees its scheme is safe. Returns the normalised href, or null to render as text.
 */
export function safeLinkHref(href: string): string | null {
  const raw = href.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ALLOWED_LINK_SCHEMES.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function parseInline(raw: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let rest = raw;
  while (rest) {
    const match = INLINE.exec(rest);
    if (!match || match.index === undefined) break;
    if (match.index > 0) tokens.push({ type: "text", value: rest.slice(0, match.index) });
    const piece = match[0];
    if (piece.startsWith("`")) {
      tokens.push({ type: "code", value: piece.slice(1, -1) });
    } else if (piece.startsWith("**")) {
      tokens.push({ type: "strong", value: piece.slice(2, -2) });
    } else {
      const split = piece.indexOf("](");
      const label = piece.slice(1, split);
      const href = safeLinkHref(piece.slice(split + 2, -1));
      tokens.push(href ? { type: "link", value: label, href } : { type: "text", value: label });
    }
    rest = rest.slice(match.index + piece.length);
  }
  if (rest) tokens.push({ type: "text", value: rest });
  return tokens;
}

function splitFrontmatter(md: string): { frontmatter: ParsedSkillMarkdown["frontmatter"]; body: string } {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") return { frontmatter: [], body: md.replace(/\r\n/g, "\n") };

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) return { frontmatter: [], body: md.replace(/\r\n/g, "\n") };

  const frontmatter: ParsedSkillMarkdown["frontmatter"] = [];
  for (const line of lines.slice(1, end)) {
    const sep = line.indexOf(":");
    if (sep === -1) {
      // a wrapped continuation of the previous value
      const previous = frontmatter[frontmatter.length - 1];
      if (previous && line.trim()) previous.value = `${previous.value} ${line.trim()}`;
      continue;
    }
    frontmatter.push({
      key: line.slice(0, sep).trim(),
      value: line.slice(sep + 1).trim().replace(/^["']|["']$/g, ""),
    });
  }
  return { frontmatter, body: lines.slice(end + 1).join("\n") };
}

export function parseSkillMarkdown(md: string): ParsedSkillMarkdown {
  const { frontmatter, body } = splitFrontmatter(md || "");
  const lines = body.split("\n");
  const blocks: MarkdownBlock[] = [];

  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", content: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const fenced: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) fenced.push(lines[i++]);
      blocks.push({ type: "code", value: fenced.join("\n") });
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "rule" });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
        content: parseInline(heading[2]),
      });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !bullet;
      const last = blocks[blocks.length - 1];
      const item = parseInline((bullet ? bullet[1] : numbered![1]).trim());
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
      else blocks.push({ type: "list", ordered, items: [item] });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", content: parseInline(trimmed.replace(/^>\s?/, "")) });
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph();

  return { frontmatter, blocks };
}
