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
