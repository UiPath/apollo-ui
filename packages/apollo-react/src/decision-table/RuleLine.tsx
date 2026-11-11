import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { LINE_CLASS } from './sentenceStyles';

export interface RuleLineProps
  extends Pick<
    LineTextProps,
    'heading' | 'parts' | 'cells' | 'selectedColumnId' | 'stopOf' | 'linkOf' | 'labels'
  > {
  title?: string;
  badge: MarkBadgeProps | null;
  removals: readonly RemoveConditionButtonProps[];
  className?: string;
}

/** A card's heading or lead: its text, the clear or remove action of each outcome or condition it words, then its glyph. */
export const RuleLine: React.FC<RuleLineProps> = ({
  title,
  badge,
  removals,
  className,
  ...lineProps
}) => (
  <div className={cn(LINE_CLASS, className)} data-mark-title={title}>
    <LineText {...lineProps} />
    {removals.map((condition) => (
      <RemoveConditionButton key={condition.columnId} {...condition} />
    ))}
    {badge && <MarkBadge {...badge} />}
  </div>
);
