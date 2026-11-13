import type React from 'react';
import { LineText, type LineTextProps } from './LineText';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { LINE_CLASS } from './sentenceStyles';

export interface RuleLineProps
  extends Pick<
    LineTextProps,
    'heading' | 'verdicts' | 'parts' | 'cells' | 'selectedColumnId' | 'stopOf' | 'labels'
  > {
  title?: string;
  badge: MarkBadgeProps | null;
}

/** A card's heading or lead: its text, then its glyph. */
export const RuleLine: React.FC<RuleLineProps> = ({ title, badge, ...lineProps }) => (
  <div className={LINE_CLASS} data-mark-title={title}>
    <LineText {...lineProps} />
    {badge && <MarkBadge {...badge} />}
  </div>
);
