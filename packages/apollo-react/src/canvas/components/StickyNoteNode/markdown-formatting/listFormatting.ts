import type { TextSelection } from '../StickyNoteNode.types';

/** Regex patterns for line prefix detection */
export const BULLET_PREFIX = /^(\s*)-\s/;
export const NUMBERED_PREFIX = /^(\s*)\d+\.\s/;
export const NUMBERED_PREFIX_FULL = /^(\s*)(\d+)\.\s/;

function getAffectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number
): { lineStart: number; lineEnd: number; lines: string[] } {
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = value.indexOf('\n', selectionEnd);
  if (lineEnd === -1) lineEnd = value.length;
  const linesText = value.slice(lineStart, lineEnd);
  const lines = linesText.split('\n');
  return { lineStart, lineEnd, lines };
}

export function toggleBulletList(input: TextSelection): TextSelection {
  const { value, selectionStart, selectionEnd } = input;
  const { lineStart, lineEnd, lines } = getAffectedLines(value, selectionStart, selectionEnd);

  const allHaveBullet = lines.every((line) => BULLET_PREFIX.test(line));

  let newLines: string[];
  let prefixDelta: number;

  if (allHaveBullet) {
    newLines = lines.map((line) => line.replace(BULLET_PREFIX, '$1'));
    prefixDelta = lines[0]!.length - newLines[0]!.length;
  } else {
    newLines = lines.map((line) => {
      if (BULLET_PREFIX.test(line)) return line;
      if (NUMBERED_PREFIX.test(line)) return line.replace(NUMBERED_PREFIX, '$1- ');
      return `- ${line}`;
    });
    prefixDelta = newLines[0]!.length - lines[0]!.length;
  }

  const newLinesText = newLines.join('\n');
  const newValue = value.slice(0, lineStart) + newLinesText + value.slice(lineEnd);

  const totalLengthDelta = newLinesText.length - (lineEnd - lineStart);
  const isMultiLine = lines.length > 1;
  const newStart = allHaveBullet
    ? Math.max(lineStart, selectionStart - prefixDelta)
    : isMultiLine
      ? selectionStart
      : selectionStart + prefixDelta;
  const newEnd = selectionEnd + totalLengthDelta;

  return {
    value: newValue,
    selectionStart: newStart,
    selectionEnd: Math.max(newStart, newEnd),
  };
}

export function toggleNumberedList(input: TextSelection): TextSelection {
  const { value, selectionStart, selectionEnd } = input;
  const { lineStart, lineEnd, lines } = getAffectedLines(value, selectionStart, selectionEnd);

  const allHaveNumbered = lines.every((line) => NUMBERED_PREFIX.test(line));

  let newLines: string[];
  let prefixDelta: number;

  if (allHaveNumbered) {
    newLines = lines.map((line) => line.replace(NUMBERED_PREFIX, '$1'));
    prefixDelta = lines[0]!.length - newLines[0]!.length;
  } else {
    newLines = lines.map((line, i) => {
      const num = `${i + 1}. `;
      if (NUMBERED_PREFIX.test(line)) return line.replace(NUMBERED_PREFIX, `$1${num}`);
      if (BULLET_PREFIX.test(line)) return line.replace(BULLET_PREFIX, `$1${num}`);
      return `${num}${line}`;
    });
    prefixDelta = newLines[0]!.length - lines[0]!.length;
  }

  const newLinesText = newLines.join('\n');
  const newValue = value.slice(0, lineStart) + newLinesText + value.slice(lineEnd);

  const totalLengthDelta = newLinesText.length - (lineEnd - lineStart);
  const newStart = allHaveNumbered
    ? Math.max(lineStart, selectionStart - prefixDelta)
    : selectionStart + prefixDelta;
  const newEnd = selectionEnd + totalLengthDelta;

  return {
    value: newValue,
    selectionStart: newStart,
    selectionEnd: Math.max(newStart, newEnd),
  };
}

/**
 * Handles Enter key on a list line. Returns new TextSelection if on a list line, null otherwise.
 * - Non-empty item: inserts newline with next list prefix
 * - Empty item (just the prefix): removes the prefix to exit the list
 */
export function continueListOnEnter(input: TextSelection): TextSelection | null {
  const { value, selectionStart, selectionEnd } = input;

  if (selectionStart !== selectionEnd) return null;

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = value.indexOf('\n', selectionStart);
  if (lineEnd === -1) lineEnd = value.length;
  const currentLine = value.slice(lineStart, lineEnd);

  const bulletMatch = BULLET_PREFIX.exec(currentLine);
  if (bulletMatch) {
    const indent = bulletMatch[1]!;
    const prefix = `${indent}- `;
    const contentAfterPrefix = currentLine.slice(bulletMatch[0].length);

    if (contentAfterPrefix.trim() === '' && selectionStart === lineStart + currentLine.length) {
      const newValue = value.slice(0, lineStart) + value.slice(lineEnd);
      return { value: newValue, selectionStart: lineStart, selectionEnd: lineStart };
    }

    const newValue = `${value.slice(0, selectionStart)}\n${prefix}${value.slice(selectionStart)}`;
    const newCursor = selectionStart + 1 + prefix.length;
    return { value: newValue, selectionStart: newCursor, selectionEnd: newCursor };
  }

  const numberedMatch = NUMBERED_PREFIX_FULL.exec(currentLine);
  if (numberedMatch) {
    const indent = numberedMatch[1]!;
    const currentNum = parseInt(numberedMatch[2]!, 10);
    const contentAfterPrefix = currentLine.slice(numberedMatch[0].length);

    if (contentAfterPrefix.trim() === '' && selectionStart === lineStart + currentLine.length) {
      const newValue = value.slice(0, lineStart) + value.slice(lineEnd);
      return { value: newValue, selectionStart: lineStart, selectionEnd: lineStart };
    }

    const prefix = `${indent}${currentNum + 1}. `;
    const newValue = `${value.slice(0, selectionStart)}\n${prefix}${value.slice(selectionStart)}`;
    const newCursor = selectionStart + 1 + prefix.length;
    return { value: newValue, selectionStart: newCursor, selectionEnd: newCursor };
  }

  return null;
}
