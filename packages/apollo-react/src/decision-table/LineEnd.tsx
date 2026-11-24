import type React from 'react';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { ACTIONS_RESERVE_CLASS, LINE_END_CLASS } from './sentenceStyles';

export interface LineEndProps {
  removals: readonly RemoveConditionButtonProps[];
  badges: readonly MarkBadgeProps[];
  /** Leaves room at the end for the floating card actions. */
  reserve: boolean;
}

/** A line's end slot: its remove actions, then its glyph, then the floating actions' room. */
export const LineEnd: React.FC<LineEndProps> = ({ removals, badges, reserve }) => {
  if (removals.length === 0 && badges.length === 0 && !reserve) return null;
  return (
    <span className={LINE_END_CLASS} data-line-end>
      {removals.map((removal) => (
        <RemoveConditionButton key={removal.columnId} {...removal} />
      ))}
      {badges.map((badge) => (
        <MarkBadge key={badge.id} {...badge} />
      ))}
      {reserve && <span aria-hidden className={ACTIONS_RESERVE_CLASS} />}
    </span>
  );
};
