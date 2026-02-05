import type { Editor, Range } from '@tiptap/core';
import { CHAT_RESOURCE_MENTION_TERMINATOR } from '../../../service';

/**
 * TipTap's Mention extension computes the query as text between @ and the cursor position.
 * When the cursor moves backward within mention text (e.g. @te|xt), the query gets truncated.
 * This helper reads the full text after @ to the end of the paragraph (or double space)
 * so the search always uses the complete mention text regardless of cursor position.
 */
export function getFullMentionQuery(
  editor: Editor,
  range: Range
): { query: string; fullRange: Range } {
  const textFrom = range.from + 1;
  const parentEnd = editor.state.doc.resolve(textFrom).end();

  if (textFrom >= parentEnd) {
    return { query: '', fullRange: range };
  }

  const fullText = editor.state.doc.textBetween(textFrom, parentEnd, '', '');
  const query = fullText.split(CHAT_RESOURCE_MENTION_TERMINATOR)[0] ?? '';

  return { query, fullRange: { from: range.from, to: textFrom + query.length } };
}

/**
 * Converts plain text to a TipTap JSON document structure.
 * Handles newlines by creating multiple paragraphs.
 * Safely escapes special characters by using JSON structure (not HTML).
 */
export function textToDocument(text: string): {
  type: 'doc';
  content: Array<{ type: 'paragraph'; content?: Array<{ type: 'text'; text: string }> }>;
} {
  if (!text) {
    return { type: 'doc', content: [] };
  }

  const lines = text.split(/(?:\r\n?|\n)/);
  const paragraphs = lines.map((line) =>
    line.length > 0
      ? { type: 'paragraph' as const, content: [{ type: 'text' as const, text: line }] }
      : { type: 'paragraph' as const }
  );

  return { type: 'doc', content: paragraphs };
}
