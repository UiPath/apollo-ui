import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { LineLead } from './LineLead';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { LINE_CLASS, MATCHED_LINE_CLASS } from './sentenceStyles';
import type { SentenceLine } from './sentenceTypes';

export interface ConditionLineProps
  extends Pick<LineTextProps, 'cells' | 'selectedColumnId' | 'stopOf' | 'labels'> {
  line: SentenceLine;
  badge: MarkBadgeProps | null;
}

/** One condition line of a card: its bullet or its run's verdict, its text, then its glyph. */
export const ConditionLine: React.FC<ConditionLineProps> = ({ line, badge, ...lineProps }) => {
  const matched = lineProps.cells?.[line.columnId]?.matched;
  return (
    <li
      className={cn(LINE_CLASS, MATCHED_LINE_CLASS)}
      data-column-id={line.columnId}
      data-matched={matched}
    >
      <LineLead matched={matched} labels={lineProps.labels} />
      <LineText parts={line.parts} {...lineProps} />
      {badge && <MarkBadge {...badge} />}
    </li>
  );
};
