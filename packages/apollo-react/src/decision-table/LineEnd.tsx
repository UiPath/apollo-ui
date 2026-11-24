import type React from 'react';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { ACTIONS_RESERVE_CLASS, EMPTY_SLOT_CLASS, LINE_END_CLASS } from './sentenceStyles';

export interface LineEndProps {
  removals: readonly RemoveConditionButtonProps[];
  badges: readonly MarkBadgeProps[];
  /** Leaves room for the floating card actions before the glyph column. */
  reserve: boolean;
}

/** A line's end slot: its remove actions, the floating actions' room, then its glyph in the card's glyph column. */
export const LineEnd: React.FC<LineEndProps> = ({ removals, badges, reserve }) => {
  if (removals.length === 0 && badges.length === 0 && !reserve) return null;
  return (
    <span className={LINE_END_CLASS} data-line-end>
      {removals.map((removal) => (
        <RemoveConditionButton key={removal.columnId} {...removal} />
      ))}
      {reserve && <span aria-hidden className={ACTIONS_RESERVE_CLASS} />}
      {badges.length > 0 ? (
        badges.map((badge) => <MarkBadge key={badge.id} {...badge} />)
      ) : (
        <span aria-hidden className={EMPTY_SLOT_CLASS} />
      )}
    </span>
  );
};
