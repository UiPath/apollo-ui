import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { LineEnd } from './LineEnd';
import { LineLead } from './LineLead';
import { LineText, type LineTextProps } from './LineText';
import type { MarkBadgeProps } from './MarkBadge';
import type { RemoveConditionButtonProps } from './RemoveConditionButton';
import {
  ADDED_LINE_CLASS,
  CLAUSE_CLASS,
  CLAUSE_TEXT_CLASS,
  LINE_CLASS,
  MATCHED_LINE_CLASS,
  PENDING_LINE_CLASS,
  REMOVED_LINE_CLASS,
} from './sentenceStyles';
import type { SentenceLine } from './sentenceTypes';

export interface ConditionLineProps
  extends Pick<
    LineTextProps,
    'cells' | 'selectedColumnId' | 'stopOf' | 'linkOf' | 'diffOf' | 'labels'
  > {
  line: SentenceLine;
  /** A condition the rule holds; one the open editor adds, its value a placeholder; or one a diff removed, struck, or added. */
  state: 'held' | 'pending' | 'add' | 'delete';
  badge: MarkBadgeProps | null;
  removal: RemoveConditionButtonProps | null;
}

/** One condition line of a card: its bullet or its run's verdict, its text, its remove action, then its glyph. */
export const ConditionLine: React.FC<ConditionLineProps> = ({
  line,
  state,
  badge,
  removal,
  ...lineProps
}) => {
  const matched = lineProps.cells?.[line.columnId]?.matched;
  const change = state === 'add' || state === 'delete' ? state : undefined;
  return (
    <li
      className={cn(
        LINE_CLASS,
        CLAUSE_CLASS,
        MATCHED_LINE_CLASS,
        state === 'pending' && PENDING_LINE_CLASS,
        change === 'delete' && REMOVED_LINE_CLASS,
        change === 'add' && ADDED_LINE_CLASS
      )}
      data-column-id={line.columnId}
      data-pending={state === 'pending' || undefined}
      data-change={change}
      data-matched={matched}
    >
      <LineLead matched={matched} labels={lineProps.labels} />
      {change && <span className="sr-only">{lineProps.labels.changeStatus(change)}</span>}
      <span className={CLAUSE_TEXT_CLASS}>
        <LineText parts={line.parts} {...lineProps} />
      </span>
      <LineEnd removals={removal ? [removal] : []} badges={badge ? [badge] : []} reserve={false} />
    </li>
  );
};
