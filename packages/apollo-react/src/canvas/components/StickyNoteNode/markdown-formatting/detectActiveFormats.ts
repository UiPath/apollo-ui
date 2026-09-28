import type { TextSelection } from '../StickyNoteNode.types';
import { BULLET_PREFIX, NUMBERED_PREFIX } from './listFormatting';

export type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  bulletList: boolean;
  numberedList: boolean;
};

export function activeFormatsEqual(a: ActiveFormats, b: ActiveFormats): boolean {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.strikethrough === b.strikethrough &&
    a.bulletList === b.bulletList &&
    a.numberedList === b.numberedList
  );
}

export function detectActiveFormats(input: TextSelection): ActiveFormats {
  const { value, selectionStart } = input;

  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = value.indexOf('\n', selectionStart);
  if (lineEnd === -1) lineEnd = value.length;
  const currentLine = value.slice(lineStart, lineEnd);

  // Scope to current line only — inline markdown formatting never spans lines
  const cursorInLine = selectionStart - lineStart;
  const textBefore = currentLine.slice(0, cursorInLine);
  const textAfter = currentLine.slice(cursorInLine);

  // Bold: find ** before/after cursor on same line, allowing single * (from italic) in between
  const bold =
    /\*\*(?:[^*\n]|\*(?!\*))*$/.test(textBefore) && /^(?:[^*\n]|\*(?!\*))*\*\*/.test(textAfter);
  const strikethrough = /~~[^~\n]*$/.test(textBefore) && /^[^~\n]*~~/.test(textAfter);

  // Italic: find standalone * before/after cursor on same line, allowing ** (from bold) in between
  const italicBefore = /(?<!\*)\*(?!\*)(?:[^*\n]|\*\*)*$/.test(textBefore);
  const italicAfter = /^(?:[^*\n]|\*\*)*(?<!\*)\*(?!\*)/.test(textAfter);
  let italic = italicBefore && italicAfter;

  // Handle combined *** (bold+italic) markers where the italic * can't be isolated
  if (!italic && bold) {
    const beforeStars = /(\*{3,})[^*\n]*$/.exec(textBefore);
    const afterStars = /^[^*\n]*(\*{3,})/.exec(textAfter);
    if (
      beforeStars &&
      afterStars &&
      beforeStars[1]!.length % 2 === 1 &&
      afterStars[1]!.length % 2 === 1
    ) {
      italic = true;
    }
  }

  return {
    bold,
    italic,
    strikethrough,
    bulletList: BULLET_PREFIX.test(currentLine),
    numberedList: NUMBERED_PREFIX.test(currentLine),
  };
}
