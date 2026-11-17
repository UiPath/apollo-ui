import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { type RemovedLine, removedLineKey } from './decisionTextDiff';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { ADDED_LINE_CLASS, LINE_CLASS, REMOVED_LINE_CLASS } from './sentenceStyles';

export interface RuleLineProps
  extends Pick<
    LineTextProps,
    | 'heading'
    | 'verdicts'
    | 'parts'
    | 'cells'
    | 'selectedColumnId'
    | 'stopOf'
    | 'linkOf'
    | 'diffOf'
    | 'labels'
  > {
  title?: string;
  badge: MarkBadgeProps | null;
  removals: readonly RemoveConditionButtonProps[];
  /** The cells a diff changed that the line does not word, struck or added after its text. */
  unworded?: readonly RemovedLine[];
  className?: string;
}

/** A card's heading or lead: its text, the cells a diff changed that it does not word, the clear or remove action of each outcome or condition it words, then its glyph. */
export const RuleLine: React.FC<RuleLineProps> = ({
  title,
  badge,
  removals,
  unworded = [],
  className,
  ...lineProps
}) => (
  <div className={cn(LINE_CLASS, className)} data-mark-title={title}>
    <LineText {...lineProps} />
    {unworded.map((line) => (
      <span
        key={removedLineKey(line)}
        className={line.change === 'delete' ? REMOVED_LINE_CLASS : ADDED_LINE_CLASS}
        data-column-id={line.columnId}
        data-change={line.change}
      >
        <span className="sr-only">{lineProps.labels.changeStatus(line.change)}</span>
        <LineText {...lineProps} parts={line.parts} />
      </span>
    ))}
    {removals.map((condition) => (
      <RemoveConditionButton key={condition.columnId} {...condition} />
    ))}
    {badge && <MarkBadge {...badge} />}
  </div>
);
