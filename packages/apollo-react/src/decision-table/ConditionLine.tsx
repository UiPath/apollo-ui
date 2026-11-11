import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { LineLead, type LineLeadLabels } from './LineLead';
import { LineText, type LineTextLabels, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { LINE_CLASS, MATCHED_LINE_CLASS } from './sentenceStyles';
import type { SentenceLine } from './sentenceTypes';

export interface ConditionLineLabels extends LineTextLabels, LineLeadLabels {}

export interface ConditionLineProps
  extends Pick<LineTextProps, 'cells' | 'selectedColumnId' | 'stopOf' | 'linkOf'> {
  line: SentenceLine;
  badge: MarkBadgeProps | null;
  removal: RemoveConditionButtonProps | null;
  labels: ConditionLineLabels;
}

/** One condition line of a card: its bullet or its run's verdict, its text, its remove action, then its glyph. */
export const ConditionLine: React.FC<ConditionLineProps> = ({
  line,
  badge,
  removal,
  ...lineProps
}) => {
  const matched = lineProps.cells?.[line.columnId]?.matched;
  return (
    <li
      className={cn(LINE_CLASS, MATCHED_LINE_CLASS)}
      data-column-id={line.columnId}
      data-matched={matched}
    >
      <LineLead matched={matched} labels={lineProps.labels} />
      <LineText parts={line.parts} {...lineProps} />
      {removal && <RemoveConditionButton {...removal} />}
      {badge && <MarkBadge {...badge} />}
    </li>
  );
};
