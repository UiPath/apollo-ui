import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Ellipsis, Plus } from 'lucide-react';
import type React from 'react';
import { RULE_ACTION_CLASS, RULE_ACTIONS_CLASS } from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';

/** A card's action strings. */
export interface RuleActionsLabels {
  /** A rule's add-condition action, e.g. "Add condition to rule 2". */
  addCondition: (position: number) => string;
  /** A rule's menu of actions, e.g. "Rule 2 actions". */
  ruleActions: (position: number) => string;
}

export interface RuleActionsProps {
  position: number;
  /** Whether the card's row is selected, so its actions are in the tab order. */
  selected: boolean;
  labels: RuleActionsLabels;
  /** The card's menu that is open, if any. */
  openMenu: RuleMenuKind | undefined;
}

const ACTIONS = [
  { action: 'conditions', Icon: Plus, label: 'addCondition' },
  { action: 'rule', Icon: Ellipsis, label: 'ruleActions' },
] as const;

/** A card's own actions at its top end, after its lines in the tab order; the section resolves their clicks. */
export const RuleActions: React.FC<RuleActionsProps> = ({
  position,
  selected,
  labels,
  openMenu,
}) => (
  <div className={RULE_ACTIONS_CLASS}>
    <TooltipProvider>
      {ACTIONS.map(({ action, Icon, label }) => (
        <Tooltip key={action}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="3xs"
              icon
              tabIndex={selected ? 0 : -1}
              aria-label={labels[label](position)}
              aria-haspopup="menu"
              aria-expanded={openMenu === action}
              className={RULE_ACTION_CLASS}
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
