import type React from 'react';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { LINE_BULLET_CLASS, LINE_CLASS } from './sentenceStyles';
import type { SentenceLine } from './sentenceTypes';

export interface ConditionLineProps extends Pick<LineTextProps, 'cells' | 'labels'> {
  line: SentenceLine;
  badge: MarkBadgeProps | null;
}

/** One condition line of a card: its bullet, its text, then its glyph. */
export const ConditionLine: React.FC<ConditionLineProps> = ({ line, badge, ...lineProps }) => (
  <li className={LINE_CLASS} data-column-id={line.columnId}>
    <span aria-hidden className={LINE_BULLET_CLASS} />
    <LineText parts={line.parts} {...lineProps} />
    {badge && <MarkBadge {...badge} />}
  </li>
);
