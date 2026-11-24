import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { GripVertical } from 'lucide-react';
import type React from 'react';
import type { RuleSortable } from './RuleSortable';
import { RULE_DRAG_HANDLE_CLASS } from './sentenceStyles';

export interface RuleDragHandleProps {
  label: string;
  /** Whether the card's row is selected, so the handle is in the tab order. */
  selected: boolean;
  sortable: RuleSortable;
}

/** A card's drag handle, in its number gutter after the number. */
export const RuleDragHandle: React.FC<RuleDragHandleProps> = ({ label, selected, sortable }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={sortable.setActivatorNodeRef}
          variant="ghost"
          size="3xs"
          icon
          {...sortable.attributes}
          {...sortable.listeners}
          tabIndex={selected ? 0 : -1}
          aria-label={label}
          className={RULE_DRAG_HANDLE_CLASS}
          data-rule-drag
          data-rule-action="drag"
        >
          <GripVertical aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  </TooltipProvider>
);
