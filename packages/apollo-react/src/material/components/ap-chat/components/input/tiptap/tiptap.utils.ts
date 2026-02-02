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
