import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { X } from 'lucide-react';
import type React from 'react';
import { REMOVE_CONDITION_CLASS, REMOVE_CONDITIONS_CLASS } from './sentenceStyles';

export interface RemoveConditionButtonProps {
  columnId: string;
  label: string;
}

/** A clause's remove actions at its right edge, shown while the clause is hovered or focused. */
export const RemoveConditionButtons: React.FC<{
  removals: readonly RemoveConditionButtonProps[];
}> = ({ removals }) =>
  removals.length > 0 ? (
    <span className={REMOVE_CONDITIONS_CLASS}>
      {removals.map((condition) => (
        <RemoveConditionButton key={condition.columnId} {...condition} />
      ))}
    </span>
  ) : null;

/** A condition's remove action; the section resolves its click, and Delete is its keyboard path. */
export const RemoveConditionButton: React.FC<RemoveConditionButtonProps> = ({
  columnId,
  label,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="4xs"
          icon
          tabIndex={-1}
          aria-label={label}
          className={REMOVE_CONDITION_CLASS}
          data-rule-action="clear"
          data-column-id={columnId}
        >
          <X aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  </TooltipProvider>
);
