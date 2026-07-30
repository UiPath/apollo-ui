import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import type React from 'react';
import { CanvasIcon } from '../../utils/icon-registry';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';

interface CanvasDropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItems: NodeMenuItem[];
  onItemClick: (item: NodeMenuAction) => void;
  triggerTestId?: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  /**
   * Drop the visible "⋮" button and keep only an invisible anchor, for callers whose menu is
   * reached solely by right-click. Radix positions the popup against its trigger, so the anchor
   * still has to exist and sit where the menu should open from.
   */
  hideTrigger?: boolean;
  /**
   * Placement for that invisible anchor, as the popup opens against it. Give it the box the "⋮"
   * button would have occupied and the menu lands where it does with the button shown — only the
   * caller knows that spot, since it depends on the surrounding padding.
   */
  hiddenTriggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

/**
 * Wraps the DropdownMenu component from @uipath/apollo-wind to provide a consistent dropdown menu for canvas nodes.
 * It renders a trigger button (three vertical dots) and displays the provided menu items when clicked.
 * Menu items can be either actions or dividers, and clicking an action will call the provided onItemClick handler.
 *
 * Uses modal={false} to prevent multiple dropdowns from staying open simultaneously in the canvas.
 * Radix's default modal overlay (pointer-events:none on body) doesn't block clicks inside
 * React Flow's foreignObject, so we disable it and rely on document-level pointerdown
 * listeners to detect outside interactions instead.
 */
export function CanvasDropdownMenu({
  open,
  onOpenChange,
  menuItems,
  onItemClick,
  triggerTestId,
  triggerAriaLabel = 'Dropdown menu',
  triggerClassName = 'h-6 w-6',
  hideTrigger,
  hiddenTriggerClassName,
  contentClassName,
  disabled,
}: CanvasDropdownMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        {hideTrigger ? (
          // Absolute so the anchor leaves the flex flow entirely — a zero-width flex item would
          // still draw one of the row's gaps. No test id: that identifies the visible button, so
          // callers can assert the "⋮" is gone.
          <span
            aria-hidden
            className={`pointer-events-none absolute ${hiddenTriggerClassName ?? ''}`}
          />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={triggerClassName}
            data-testid={triggerTestId}
            aria-label={triggerAriaLabel}
            disabled={disabled}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          >
            <CanvasIcon icon="ellipsis-vertical" size={16} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className={contentClassName}>
        {menuItems.map((item, index) => {
          if ('type' in item && item.type === 'divider') {
            return <DropdownMenuSeparator key={`divider-${index}`} />;
          }
          const actionItem = item as NodeMenuAction;
          return (
            <DropdownMenuItem
              key={actionItem.id}
              disabled={actionItem.disabled}
              onSelect={() => onItemClick(actionItem)}
            >
              {actionItem.icon}
              {actionItem.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
