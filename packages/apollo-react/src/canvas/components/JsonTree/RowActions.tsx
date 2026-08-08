import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';
import type { JsonTreeNode, NodeAction, NodeDecorationTone } from './JsonTree.types';

const ACTION_BUTTON_CLASS =
  'shrink-0 rounded text-foreground-subtle opacity-0 hover:text-foreground hover:bg-surface-raised group-hover:opacity-100 focus-visible:opacity-100';

const ACTION_TONE_CLASS: Record<NodeDecorationTone, string> = {
  neutral: '',
  info: 'text-info hover:text-info',
  warning: 'text-warning hover:text-warning',
  error: 'text-error hover:text-error',
};

export interface RowActionsProps {
  node: JsonTreeNode;
  /** Resolved actions for the row, in display order. */
  actions: NodeAction[];
  /** When the action count exceeds this cap, all actions collapse into one menu. */
  maxInline: number;
}

/**
 * The trailing icon-button group for a row. Renders `actions` uniformly (icon,
 * tooltip, aria, tone, active highlight). Up to `maxInline` actions render
 * inline; when the count exceeds that cap, every action moves into one menu so
 * the row has a single, predictable overflow state.
 */
export function RowActions({ node, actions, maxInline }: RowActionsProps) {
  const { _ } = useSafeLingui();
  const [menuOpen, setMenuOpen] = useState(false);
  if (actions.length === 0) return null;

  const overflowing = actions.length > maxInline;
  const inline = overflowing ? [] : actions;
  const overflow = overflowing ? actions : [];
  const moreLabel = _({
    id: 'canvas.json_value_panel.more_actions',
    message: 'More actions',
  });

  return (
    // Own wrapper with a tight gap: the buttons group together instead of
    // each picking up the row's wider item gap. ml-auto pins the group to the
    // right edge without a spacer div (which would cost two extra row gaps).
    <span className="ml-auto flex shrink-0 items-center gap-0.5">
      {inline.map((action) => (
        <CanvasTooltip
          key={action.id}
          content={action.tooltip ?? action.label}
          placement="top"
          delay
        >
          <Button
            variant="ghost"
            size="4xs"
            icon
            disabled={action.disabled}
            onClick={() => action.onSelect(node)}
            aria-label={action.label}
            className={cn(
              ACTION_BUTTON_CLASS,
              '[&_svg]:size-2.75',
              action.tone && ACTION_TONE_CLASS[action.tone],
              action.active && 'text-brand opacity-100 hover:text-brand'
            )}
          >
            {action.icon}
          </Button>
        </CanvasTooltip>
      ))}
      {overflow.length > 0 && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <CanvasTooltip content={moreLabel} placement="top" delay hide={menuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="4xs"
                icon
                aria-label={moreLabel}
                className={cn(ACTION_BUTTON_CLASS, '[&_svg]:size-2.75', menuOpen && 'opacity-100')}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
          </CanvasTooltip>
          <DropdownMenuContent side="left" align="start" sideOffset={-12} className="min-w-40">
            {overflow.map((action) => (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                onClick={() => action.onSelect(node)}
                className={cn('gap-2 text-xs', action.tone === 'error' && 'text-error')}
              >
                <span className="grid size-3.5 shrink-0 place-items-center [&_svg]:size-3.5">
                  {action.icon}
                </span>
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}
