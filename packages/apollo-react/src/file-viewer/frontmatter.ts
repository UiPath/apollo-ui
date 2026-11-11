/** A markdown file split into its leading YAML frontmatter (without the `---` fences) and its body. */
export interface SplitMarkdown {
  frontmatter: string | null;
  body: string;
}

const FENCE = '---';

/**
 * Splits off a leading `---` frontmatter block. react-markdown renders one as a rule followed by a
 * run-on paragraph, so the rendered view shows it apart. A block that never closes is not frontmatter.
 */
export function splitFrontmatter(source: string): SplitMarkdown {
  const lines = source.split(/\r?\n/);
  const opensWithFence = lines[0]?.trimEnd() === FENCE;
  const closingLine = opensWithFence
    ? lines.findIndex((line, i) => i > 0 && line.trimEnd() === FENCE)
    : -1;
  const hasFrontmatter = closingLine > 0;
  if (!hasFrontmatter) {
    return { frontmatter: null, body: source };
  }
  return {
    frontmatter: lines.slice(1, closingLine).join('\n'),
    body: lines
      .slice(closingLine + 1)
      .join('\n')
      .replace(/^\s*\n/, ''),
  };
}
