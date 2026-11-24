import type React from 'react';
import { MarkGlyph } from './MarkGlyph';
import { type GlyphTone, type LineMarks, worstTone } from './sentenceMarks';
import { FOCUSABLE_LINE_MARK_CLASS, LINE_MARK_CLASS, MARK_GLYPH_CLASS } from './sentenceStyles';

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

/** A badge inside a control that already takes focus, or a line's own focus target for its message, in the tab order when its rule is selected. */
export type MarkBadgeFocus = { kind: 'none' } | { kind: 'own'; tabbable: boolean };

/** A glyph in the worst tone of its marks, and each mark's announcement for `aria-describedby`. */
export const MarkBadge: React.FC<MarkBadgeProps & { focus: MarkBadgeFocus }> = ({
  id,
  marks,
  labels,
  focus,
}) => {
  const tone = worstTone(marks);
  const titles = marks.flatMap((mark) => (mark.title ? [mark.title] : []));
  const content = (
    <>
      <MarkGlyph tone={tone} className={MARK_GLYPH_CLASS} />
      {marks.map((mark, index) => (
        <span key={index} id={markId(id, index)} hidden>
          {labels.markStatus(mark.tone, mark.title)}
        </span>
      ))}
    </>
  );
  const markTitle = titles.length > 0 ? titles.join('\n') : undefined;
  if (focus.kind === 'none') {
    return (
      <span className={LINE_MARK_CLASS} data-tone={tone} data-mark-title={markTitle}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      tabIndex={focus.tabbable ? 0 : -1}
      aria-label={marks.map((mark) => labels.markStatus(mark.tone, mark.title)).join(', ')}
      className={FOCUSABLE_LINE_MARK_CLASS}
      data-tone={tone}
      data-mark-title={markTitle}
      data-mark-focus
      data-rule-action="mark"
    >
      {content}
    </button>
  );
};
