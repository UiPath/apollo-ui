/**
 * Patterns for tokens that should be buffered when incomplete during streaming.
 * Each pattern should match the START of an incomplete token (opened but not yet closed).
 * Add new patterns here as needed.
 *
 * Pattern format: Match the opening sequence with a negative lookahead for the closing sequence.
 * Example: /\[\[my-token:(?![^\]]*\]\])/ matches `[[my-token:` not followed by `]]`
 */
export const INCOMPLETE_TOKEN_PATTERNS: RegExp[] = [
  /\[\[resource-token:(?!.*\]\])/, // [[resource-token:{...}]]
];

/**
 * Extracts content that is safe to render, buffering any incomplete tokens.
 * This prevents flickering during streaming when tokens arrive in chunks.
 *
 * @param content - The accumulated content string
 * @returns An object with `renderable` (safe to display) and `buffered` (held back for next chunk)
 */
export function extractRenderableContent(content: string): {
  renderable: string;
  buffered: string;
} {
  let earliestIndex = -1;

  for (const pattern of INCOMPLETE_TOKEN_PATTERNS) {
    const match = content.match(pattern);
    if (match?.index !== undefined) {
      if (earliestIndex === -1 || match.index < earliestIndex) {
        earliestIndex = match.index;
      }
    }
  }

  if (earliestIndex === -1) {
    return { renderable: content, buffered: '' };
  }

  return {
    renderable: content.slice(0, earliestIndex),
    buffered: content.slice(earliestIndex),
  };
}
