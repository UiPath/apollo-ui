import type { TextSelection } from './StickyNoteNode.types';

/** Reads the value and selection range from a sticky-note textarea. */
export const readTextSelection = (textarea: HTMLTextAreaElement): TextSelection => ({
  value: textarea.value,
  selectionStart: textarea.selectionStart,
  selectionEnd: textarea.selectionEnd,
});

// Markdown collapses 3+ consecutive newlines into a single paragraph break.
// Insert &nbsp; paragraphs to prevent markdown parser from collapsing consecutive newlines.
export const preserveNewlines = (markdown: string): string => {
  // Temporarily replace code blocks to prevent &nbsp; insertion
  const codeBlocks: string[] = [];
  let result = markdown.replace(/```[\s\S]*?```/g, (m) => {
    codeBlocks.push(m);
    return `\n%%CODE_BLOCK_${codeBlocks.length - 1}%%\n`;
  });

  // Replace runs of 3+ newlines (beyond the standard \n\n paragraph break)
  // with \n\n followed by &nbsp;\n for each extra line
  result = result.replace(/\n{3,}/g, (match) => {
    const extraBreaks = match.length - 2;
    return `\n\n${'&nbsp;\n\n'.repeat(extraBreaks)}`;
  });

  // Restore code blocks
  result = result.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, i) => {
    return codeBlocks[Number(i)] ?? '';
  });

  return result;
};

// NOTE: refactor isMac and getModifierKey into shared util if using within components outside of StickyNoteNode.

/**
 * Returns true if the current platform is macOS.
 */
export const isMac = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
};

/**
 * Returns the platform-specific modifier key symbol
 * - Mac: ⌘ (Command)
 * - Windows/Linux: Ctrl
 */
export const getModifierKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};
