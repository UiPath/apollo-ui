import type React from 'react';
import { RULE_DROP_INDICATOR_CLASS } from './sentenceStyles';

export interface DropIndicatorProps {
  /** The centre of the gap the dragged rule drops into, from the list's top. */
  topPx: number;
}

/** The line in the gap a dragged rule drops into. */
export const DropIndicator: React.FC<DropIndicatorProps> = ({ topPx }) => (
  <li
    aria-hidden
    inert
    className={RULE_DROP_INDICATOR_CLASS}
    style={{ top: `${topPx}px` }}
    data-drop-indicator
  />
);
