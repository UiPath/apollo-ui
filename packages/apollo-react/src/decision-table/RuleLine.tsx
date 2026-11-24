import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { type RemovedLine, removedLineKey } from './decisionTextDiff';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { type RemoveConditionButtonProps, RemoveConditionButtons } from './RemoveConditionButton';
import {
  ADDED_LINE_CLASS,
  LINE_CLASS,
  LINE_END_MARK_CLASS,
  REMOVED_LINE_CLASS,
} from './sentenceStyles';

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
  /** How far from its clause's end the glyph sits, in the column the condition lines' glyphs share. */
  badgeEnd: string;
  /** How far from its clause's end its remove actions sit, clear of the clause's glyphs. */
  removalsEnd: string;
  removals: readonly RemoveConditionButtonProps[];
  /** The cells a diff changed that the line does not word, struck or added after its text. */
  unworded?: readonly RemovedLine[];
  className?: string;
}

/** A card's heading or lead: its text, the cells a diff changed that it does not word, the remove action of each condition it words, then its glyph in the card's glyph column. */
export const RuleLine: React.FC<RuleLineProps> = ({
  title,
  badge,
  badgeEnd,
  removalsEnd,
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
    <RemoveConditionButtons removals={removals} end={removalsEnd} />
    {badge && (
      <span className={LINE_END_MARK_CLASS} style={{ insetInlineEnd: badgeEnd }} data-line-end-mark>
        <MarkBadge {...badge} />
      </span>
    )}
  </div>
);
