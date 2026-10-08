import { type KeyboardEvent, useMemo, useRef } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib';
import type { ResourceItemAction } from '../types';

export interface ResourceRowActionsMenuProps {
  /** The row the menu opens beside. */
  anchor: HTMLElement;
  /** Accessible name of the menu, such as "Actions for Outlook Work". */
  label: string;
  actions: ResourceItemAction[];
  /**
   * Called once the menu closes. `restoreFocus` is false when the menu was
   * left with Tab, which has already moved focus on.
   */
  onClose: (restoreFocus: boolean) => void;
  /**
   * Tab or Shift+Tab out of the menu. The picker moves focus on from the
   * row: the menu is portalled to the end of the document, so the browser's
   * own next stop would be nowhere near the row.
   */
  onTabOut: (backwards: boolean) => void;
}

/**
 * The keyboard route to a row's actions, opened with Shift+Enter on the row
 * under the cursor.
 *
 * A listbox option is atomic, so the actions a row shows are not controls of
 * its own: nothing inside an option may take focus. This menu holds them as
 * real menu items instead, outside the listbox, in a popover anchored to the
 * row. Escape closes it and leaves the picker open.
 */
export function ResourceRowActionsMenu({
  anchor,
  label,
  actions,
  onClose,
  onTabOut,
}: ResourceRowActionsMenuProps) {
  const virtualRef = useMemo(() => ({ current: anchor }), [anchor]);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  /**
   * Set while Tab moves focus out. Focus landing outside the menu dismisses
   * it as well, and that dismissal must not pull focus back to the search.
   */
  const tabbedAway = useRef(false);

  const focusItem = (index: number) => {
    const items = itemsRef.current.filter((item): item is HTMLButtonElement => item !== null);
    if (items.length === 0) return;
    items[(index + items.length) % items.length]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Kept inside the menu: the picker it portals from would otherwise read
    // these keys as moves of its own cursor, or as a commit.
    event.stopPropagation();
    // Read from the menu's own tree: inside a shadow root the document's
    // active element is the shadow host, not the focused item.
    const root = event.currentTarget.getRootNode() as Document | ShadowRoot;
    const current = itemsRef.current.indexOf(root.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(-1);
    } else if (event.key === 'Tab') {
      // Tab leaves the menu, as it does a dropdown menu, and goes on in its
      // own direction from the row the menu belongs to.
      event.preventDefault();
      tabbedAway.current = true;
      onTabOut(event.shiftKey);
    }
  };

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose(!tabbedAway.current);
      }}
    >
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        // The content is the menu itself, so it is not also a dialog.
        role="menu"
        aria-label={label}
        data-slot="resource-row-actions-menu"
        align="end"
        sideOffset={2}
        className="w-auto min-w-36 p-1"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusItem(0);
        }}
        // The picker puts focus back in its own search.
        onCloseAutoFocus={(event) => event.preventDefault()}
        onKeyDown={handleKeyDown}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            ref={(node) => {
              itemsRef.current[index] = node;
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            aria-label={action.label}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-surface-hover focus-visible:bg-surface-hover',
              action.tone === 'danger' && 'text-error'
            )}
            onClick={() => {
              onClose(true);
              action.onSelect();
            }}
          >
            {action.icon && (
              <span aria-hidden className="grid size-4 shrink-0 place-items-center">
                {action.icon}
              </span>
            )}
            {action.text ?? action.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
