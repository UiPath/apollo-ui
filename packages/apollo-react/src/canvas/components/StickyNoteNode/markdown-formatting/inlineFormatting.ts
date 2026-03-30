import type { TextSelection } from '../StickyNoteNode.types';
import { BULLET_PREFIX, NUMBERED_PREFIX, NUMBERED_PREFIX_FULL } from './listFormatting';

/**
 * Toggles an inline markdown wrapper (e.g., **, *, ~~) around the selected text.
 * If text is selected and already wrapped, unwraps it. Otherwise wraps it.
 * If no text is selected and cursor is inside a formatted region, removes the markers.
 * If no text is selected on a list line, wraps the line content after the prefix.
 * Otherwise inserts empty markers and places cursor between them.
 */
function toggleInlineWrap(input: TextSelection, marker: string): TextSelection {
  const { value, selectionStart, selectionEnd } = input;
  const markerLen = marker.length;
  const selectedText = value.slice(selectionStart, selectionEnd);
  const hasSelection = selectionStart !== selectionEnd;

  if (!hasSelection) {
    // Check if cursor is inside an existing wrapped region — if so, remove the markers
    const textBefore = value.slice(0, selectionStart);
    const textAfter = value.slice(selectionStart);
    const markerChar = marker[0]!;
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const me = esc(marker);
    const ce = esc(markerChar);

    // Find the nearest opening marker before cursor and closing marker after cursor,
    // ensuring single-char markers (italic *) don't match multi-char markers (bold **)
    const beforeRe =
      markerLen === 1
        ? new RegExp(`(?<!${ce})${me}(?!${ce})([^${ce}]*)$`)
        : new RegExp(`${me}([^${ce}]*)$`);
    const afterRe =
      markerLen === 1
        ? new RegExp(`^([^${ce}]*)(?<!${ce})${me}(?!${ce})`)
        : new RegExp(`^([^${ce}]*)${me}`);

    const bm = beforeRe.exec(textBefore);
    const am = afterRe.exec(textAfter);

    if (bm && am) {
      const openStart = selectionStart - bm[0].length;
      const closeEnd = selectionStart + am[0].length;

      // For multi-char markers, verify boundary cleanliness (no extra same-char adjacent)
      const boundaryClean =
        markerLen === 1 || (value[openStart - 1] !== markerChar && value[closeEnd] !== markerChar);

      if (boundaryClean) {
        const newValue = value.slice(0, openStart) + bm[1] + am[1] + value.slice(closeEnd);
        const newCursor = selectionStart - markerLen;
        return { value: newValue, selectionStart: newCursor, selectionEnd: newCursor };
      }
    }

    // On a list line — wrap the line's content (after prefix) instead of inserting empty markers
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    let lineEnd = value.indexOf('\n', selectionStart);
    if (lineEnd === -1) lineEnd = value.length;
    const currentLine = value.slice(lineStart, lineEnd);
    const bulletMatch = BULLET_PREFIX.exec(currentLine);
    const numberedMatch = NUMBERED_PREFIX_FULL.exec(currentLine);
    const prefixLen = bulletMatch?.[0].length ?? numberedMatch?.[0].length ?? 0;

    if (prefixLen > 0) {
      const content = currentLine.slice(prefixLen);
      if (content.length > 0) {
        const prefix = currentLine.slice(0, prefixLen);
        const newLine = `${prefix}${marker}${content}${marker}`;
        const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
        const newCursor = selectionStart + markerLen;
        return { value: newValue, selectionStart: newCursor, selectionEnd: newCursor };
      }
    }

    // Not inside a formatted region and not a list line — insert empty markers
    const newValue = value.slice(0, selectionStart) + marker + marker + value.slice(selectionEnd);
    const cursorPos = selectionStart + markerLen;
    return { value: newValue, selectionStart: cursorPos, selectionEnd: cursorPos };
  }

  // Multi-line selection with list items — apply formatting per-line to protect prefixes
  {
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    let lineEnd = value.indexOf('\n', selectionEnd);
    if (lineEnd === -1) lineEnd = value.length;
    if (selectionEnd > lineStart && value[selectionEnd - 1] === '\n') {
      lineEnd = selectionEnd - 1;
    }

    const lines = value.slice(lineStart, lineEnd).split('\n');

    if (
      lines.length >= 2 &&
      lines.some((line) => BULLET_PREFIX.test(line) || NUMBERED_PREFIX.test(line))
    ) {
      const parsed = lines.map((line) => {
        const bulletMatch = BULLET_PREFIX.exec(line);
        const numberedMatch = NUMBERED_PREFIX.exec(line);
        const prefix = bulletMatch?.[0] ?? numberedMatch?.[0] ?? '';
        const content = line.slice(prefix.length);
        return { prefix, content };
      });

      const isWrapped = (content: string): boolean => {
        if (content.length < markerLen * 2) return false;
        if (!content.startsWith(marker) || !content.endsWith(marker)) return false;
        const mc = marker[0]!;
        if (markerLen === 1) {
          let leadingStars = 0;
          while (content[leadingStars] === mc) leadingStars++;
          let trailingStars = 0;
          while (content[content.length - 1 - trailingStars] === mc) trailingStars++;
          return leadingStars % 2 === 1 && trailingStars % 2 === 1;
        }
        return content[markerLen] !== mc && content[content.length - markerLen - 1] !== mc;
      };

      const allWrapped = parsed.every(({ content }) => isWrapped(content));

      const newLines = allWrapped
        ? parsed.map(
            ({ prefix, content }) =>
              `${prefix}${content.slice(markerLen, content.length - markerLen)}`
          )
        : parsed.map(({ prefix, content }) =>
            content.length > 0 ? `${prefix}${marker}${content}${marker}` : `${prefix}${content}`
          );

      const newLinesText = newLines.join('\n');
      const newValue = value.slice(0, lineStart) + newLinesText + value.slice(lineEnd);
      const newSelectionEnd = lineStart + newLinesText.length;

      return {
        value: newValue,
        selectionStart: lineStart,
        selectionEnd: newSelectionEnd,
      };
    }
  }

  // Has selection — check if already wrapped and toggle accordingly
  const before = value.slice(selectionStart - markerLen, selectionStart);
  const after = value.slice(selectionEnd, selectionEnd + markerLen);

  const markerChar = marker[0];
  const outerBefore = value[selectionStart - markerLen - 1];
  const outerAfter = value[selectionEnd + markerLen];
  const isBoundaryClean = outerBefore !== markerChar && outerAfter !== markerChar;

  if (before === marker && after === marker && isBoundaryClean) {
    const newValue =
      value.slice(0, selectionStart - markerLen) +
      selectedText +
      value.slice(selectionEnd + markerLen);
    return {
      value: newValue,
      selectionStart: selectionStart - markerLen,
      selectionEnd: selectionEnd - markerLen,
    };
  }

  const newValue =
    value.slice(0, selectionStart) + marker + selectedText + marker + value.slice(selectionEnd);
  return {
    value: newValue,
    selectionStart: selectionStart + markerLen,
    selectionEnd: selectionEnd + markerLen,
  };
}

export function toggleBold(input: TextSelection): TextSelection {
  return toggleInlineWrap(input, '**');
}

export function toggleItalic(input: TextSelection): TextSelection {
  return toggleInlineWrap(input, '*');
}

export function toggleStrikethrough(input: TextSelection): TextSelection {
  return toggleInlineWrap(input, '~~');
}
