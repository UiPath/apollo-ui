import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Ellipsis, GripVertical, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import type { RuleSortable } from './RuleSortable';
import {
  DELETE_RULE_CLASS,
  RULE_ACTION_CLASS,
  RULE_ACTIONS_CLASS,
  RULE_DRAG_HANDLE_CLASS,
} from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';

/** A card's action strings. */
export interface RuleActionsLabels {
  /** A rule's add-condition action, e.g. "Add condition to rule 2". */
  addCondition: (position: number) => string;
  /** A rule's menu of actions, e.g. "Rule 2 actions". */
  ruleActions: (position: number) => string;
  /** A rule's delete action, e.g. "Delete rule 2". */
  deleteRule: (position: number) => string;
  /** A rule's drag handle, e.g. "Drag rule 2 to reorder it". */
  dragRule: (position: number) => string;
}

export interface RuleActionsProps {
  position: number;
  /** Whether the card's row is selected, so its actions are in the tab order. */
  selected: boolean;
  labels: RuleActionsLabels;
  /** The card's menu that is open, if any. */
  openMenu: RuleMenuKind | undefined;
  /** The card's sortable, when its rules can be dragged to reorder them. */
  sortable: RuleSortable | null;
}

const ACTIONS = [
  { action: 'conditions', Icon: Plus, label: 'addCondition', className: RULE_ACTION_CLASS },
  { action: 'rule', Icon: Ellipsis, label: 'ruleActions', className: RULE_ACTION_CLASS },
  { action: 'delete', Icon: Trash2, label: 'deleteRule', className: DELETE_RULE_CLASS },
] as const;

/** A card's own actions at its top end, after its lines in the tab order; the section resolves their clicks. */
export const RuleActions: React.FC<RuleActionsProps> = ({
  position,
  selected,
  labels,
  openMenu,
  sortable,
}) => (
  <div className={RULE_ACTIONS_CLASS}>
    <TooltipProvider>
      {sortable && (
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
              aria-label={labels.dragRule(position)}
              className={RULE_DRAG_HANDLE_CLASS}
              data-rule-drag
              data-rule-action="drag"
            >
              <GripVertical aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>{labels.dragRule(position)}</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      )}
      {ACTIONS.map(({ action, Icon, label, className }) => (
        <Tooltip key={action}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="3xs"
              icon
              tabIndex={selected ? 0 : -1}
              aria-label={labels[label](position)}
              aria-haspopup={action === 'delete' ? undefined : 'menu'}
              aria-expanded={action === 'delete' ? undefined : openMenu === action}
              className={className}
              data-rule-action={action}
            >
              <Icon aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipContent>{labels[label](position)}</TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ))}
    </TooltipProvider>
  </div>
);
