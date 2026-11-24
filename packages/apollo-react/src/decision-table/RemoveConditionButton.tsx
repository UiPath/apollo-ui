import { Button } from '@uipath/apollo-wind';
import { X } from 'lucide-react';
import type React from 'react';
import { REMOVE_CONDITION_CLASS } from './sentenceStyles';

export interface RemoveConditionButtonProps {
  columnId: string;
  label: string;
}

/** A condition's remove action, shown while its line is hovered or focused; the section resolves its click, and Delete is its keyboard path. */
export const RemoveConditionButton: React.FC<RemoveConditionButtonProps> = ({
  columnId,
  label,
}) => (
  <Button
    variant="ghost"
    size="3xs"
    icon
    tabIndex={-1}
    aria-label={label}
    className={REMOVE_CONDITION_CLASS}
    data-rule-action="clear"
    data-column-id={columnId}
  >
    <X aria-hidden />
  </Button>
);
