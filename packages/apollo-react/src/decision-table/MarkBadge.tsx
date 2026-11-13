import type React from 'react';
import { MarkGlyph } from './MarkGlyph';
import { type GlyphTone, type LineMarks, worstTone } from './sentenceMarks';
import { LINE_MARK_CLASS, MARK_GLYPH_CLASS } from './sentenceStyles';

const markId = (id: string, index: number): string => `${id}-${index}`;

/** The ids of a badge's announcements, for the `aria-describedby` of whatever it ends. */
export const markIds = (id: string, marks: LineMarks): string[] =>
  marks.map((_, index) => markId(id, index));

export interface MarkBadgeLabels {
  /** One mark as read aloud, e.g. "Warning: Overlaps row 1"; `message` is absent when the mark has none. */
  markStatus: (tone: GlyphTone, message: string | undefined) => string;
}

export interface MarkBadgeProps {
  id: string;
  marks: LineMarks;
  labels: MarkBadgeLabels;
}

/** A glyph in the worst tone of its marks, and each mark's announcement for `aria-describedby`. */
export const MarkBadge: React.FC<MarkBadgeProps> = ({ id, marks, labels }) => {
  const tone = worstTone(marks);
  const titles = marks.flatMap((mark) => (mark.title ? [mark.title] : []));
  return (
    <span
      className={LINE_MARK_CLASS}
      data-tone={tone}
      data-mark-title={titles.length > 0 ? titles.join('\n') : undefined}
    >
      <MarkGlyph tone={tone} className={MARK_GLYPH_CLASS} />
      {marks.map((mark, index) => (
        <span key={index} id={markId(id, index)} hidden>
          {labels.markStatus(mark.tone, mark.title)}
        </span>
      ))}
    </span>
  );
};
