/**
 * Utility functions for the Lexical rich text editor.
 * Handles detection, conversion, and plain-text extraction
 * for both legacy plain-text and Lexical JSON descriptions.
 */

/** Check if a string is Lexical JSON (vs legacy plain text). */
export function isLexicalJson(value: string): boolean {
  if (!value || !value.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(value);
    return parsed?.root?.type === 'root' && Array.isArray(parsed?.root?.children);
  } catch {
    return false;
  }
}

/** Wrap a plain text string in Lexical paragraph node structure. */
export function plainTextToLexicalJson(text: string): string {
  const lines = text.split('\n');
  const paragraphs = lines.map(line => ({
    type: 'paragraph',
    version: 1,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    textFormat: 0,
    children: line.trim()
      ? [{ type: 'text', version: 1, text: line, format: 0, mode: 'normal', style: '', detail: 0 }]
      : [],
  }));

  if (paragraphs.length === 0) {
    paragraphs.push({
      type: 'paragraph', version: 1, direction: 'ltr' as const,
      format: '' as const, indent: 0, textFormat: 0, children: [],
    });
  }

  return JSON.stringify({
    root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children: paragraphs },
  });
}

/** Extract plain text from Lexical JSON (or return as-is if already plain text). */
export function extractPlainText(value: string): string {
  if (!isLexicalJson(value)) return value;
  try {
    const parsed = JSON.parse(value);
    const texts: string[] = [];
    const walk = (node: Record<string, unknown>) => {
      if (node.type === 'text' && typeof node.text === 'string') {
        texts.push(node.text as string);
      }
      if (node.type === 'linebreak') {
        texts.push('\n');
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          walk(child as Record<string, unknown>);
        }
        if (['paragraph', 'heading', 'listitem', 'quote'].includes(node.type as string)) {
          texts.push('\n');
        }
      }
    };
    walk(parsed.root);
    return texts.join('').trim();
  } catch {
    return value;
  }
}

/** Get editor state string — converts plain text to Lexical JSON if needed. */
export function getEditorState(description: string): string {
  if (!description) return '';
  if (isLexicalJson(description)) return description;
  return plainTextToLexicalJson(description);
}

/** Character count for a description (works for both formats). */
export function descriptionCharCount(description: string): number {
  return extractPlainText(description).length;
}

/**
 * Strip markdown-lite markers (**bold**, `---` rule lines) from plain text.
 * Use for truncated previews and meta descriptions where markers must not show.
 */
export function stripMarkdownLite(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .split('\n')
    .filter(line => line.trim() !== '---')
    .join('\n');
}

// The "**Built for <event>**" footer line the backfills added; the project page already shows the event under the
// makers. Only a whole line naming one of our events matches, so a builder's own "Built for busy parents…" stays.
const EVENT_FOOTER = /^\s*\**\s*Built for [^*\n]*(Buildathon|Build Sprint|Build Week|AI Immersion|AI Weekender)[^*\n]*\**\s*$/i;

/** The description without the "Built for <event>" line (and a closing rule left with nothing after it). */
export function withoutEventFooter(value: string): string {
  if (!value) return value;
  if (!isLexicalJson(value)) {
    const kept = value.split('\n').filter(line => !EVENT_FOOTER.test(line)).join('\n');
    return kept.replace(/(\n\s*---\s*)+\s*$/, '').trimEnd();
  }
  try {
    const doc = JSON.parse(value);
    const text = (n: Record<string, unknown>): string =>
      n.type === 'text' ? String(n.text ?? '') : Array.isArray(n.children) ? (n.children as Record<string, unknown>[]).map(text).join('') : '';
    const kids = (doc.root.children as Record<string, unknown>[]).filter(n => !EVENT_FOOTER.test(text(n)));
    while (kids.length && (kids[kids.length - 1].type === 'horizontalrule' || !text(kids[kids.length - 1]).trim())) kids.pop();
    doc.root.children = kids;
    return JSON.stringify(doc);
  } catch {
    return value;
  }
}

/** Assert-based self-check: node --experimental-strip-types lib/editor-utils.ts (no test framework here). */
export function demoWithoutEventFooter() {
  const t = (a: string, b: string) => { if (withoutEventFooter(a) !== b) throw new Error(`${JSON.stringify(a)} → ${JSON.stringify(withoutEventFooter(a))}`); };
  t("Intro\n\n---\n\n**Built for Build Sprint Season 04**", "Intro");
  t("Intro\n\n---\n\n**Built for Sarvam Epoch Buildathon**\n🎬 Demo: https://x.y", "Intro\n\n---\n\n🎬 Demo: https://x.y");
  t("**Built for:** busy parents\nMore", "**Built for:** busy parents\nMore");
  t("Built for people who buy more books than they read.", "Built for people who buy more books than they read.");
  t("**Built for India's First OpenCode Buildathon**", "");
  return "ok";
}
