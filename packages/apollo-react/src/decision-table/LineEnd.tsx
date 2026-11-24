import type React from 'react';
import { MarkBadge, type MarkBadgeProps } from './MarkBadge';
import { RemoveConditionButton, type RemoveConditionButtonProps } from './RemoveConditionButton';
import { ACTIONS_RESERVE_CLASS, LINE_END_CLASS } from './sentenceStyles';

export interface LineEndProps {
  removals: readonly RemoveConditionButtonProps[];
  badges: readonly MarkBadgeProps[];
  /** Leaves room for the floating card actions, before the glyph column. */
  reserve: boolean;
  /** Whether the line's rule is selected, so its glyphs are in the tab order. */
  selected: boolean;
}

/** A line's end slot: its remove actions, the floating actions' room, then its glyphs. */
export const LineEnd: React.FC<LineEndProps> = ({ removals, badges, reserve, selected }) => {
  if (removals.length === 0 && badges.length === 0 && !reserve) return null;
  return (
    <span className={LINE_END_CLASS} data-line-end>
      {removals.map((removal) => (
        <RemoveConditionButton key={removal.columnId} {...removal} />
      ))}
      {reserve && <span aria-hidden className={ACTIONS_RESERVE_CLASS} data-actions-reserve />}
      {badges.map((badge) => (
        <MarkBadge key={badge.id} {...badge} focus={{ kind: 'own', tabbable: selected }} />
      ))}
    </span>
  );
};
