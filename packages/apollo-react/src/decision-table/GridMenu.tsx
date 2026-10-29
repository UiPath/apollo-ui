import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import type React from 'react';
import { useEffect, useRef } from 'react';

export interface GridMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Leading glyph for the item. */
  icon?: React.ReactNode;
  /**
   * Never set — its only purpose is to make a hybrid `{label, onClick, divider: true}` a type
   * error. A union tolerates any key present in some member, so without this the hybrid assigned
   * cleanly, `isDivider` matched it, and the item rendered as a separator: silently swallowed.
   */
  divider?: never;
  destructive?: boolean;
  /** Why the item is unavailable. Shown under the label, and only while `disabled`. */
  disabledReason?: string;
  /** Display-only hint (e.g. "F2", "Ctrl+C") — the menu never registers the binding itself. */
  shortcut?: string;
  /**
   * The action mounts its own focusable surface (the inline rename field). It runs once the menu
   * has closed and given up focus, so the surface is not blurred away the moment it appears.
   */
  focusesOwnSurface?: boolean;
}

export type GridMenuEntry = GridMenuItem | { divider: true };

// Tested on the value, not with `in`: `divider?: never` still admits an explicit `divider: undefined`
// (spread-built entries produce exactly that), and `"divider" in entry` matches it — which swallowed
// the item as a separator, the very case the field above exists to make a type error.
const isDivider = (entry: GridMenuEntry): entry is { divider: true } => entry.divider === true;

const DESTRUCTIVE_ITEM_CLASS = 'text-destructive focus:bg-destructive/10 focus:text-destructive';

/** The menu's list body, plus the focus hand-off `focusesOwnSurface` asks for. */
const useGridMenuItems = (entries: GridMenuEntry[], open: boolean, dataTestId: string) => {
  const deferredRef = useRef<(() => void) | null>(null);
  // Outlives `deferredRef`: the close hand-off fires after the action has already run.
  const keepFocusRef = useRef(false);

  const items = (
    <>
      {entries.map((entry, index) =>
        isDivider(entry) ? (
          // Dividers carry no identity of their own; their position is what distinguishes them.
          <DropdownMenuSeparator key={`divider-${index}`} />
        ) : (
          <DropdownMenuItem
            // Position, not label: two entries may legitimately share a caption.
            key={`item-${index}`}
            disabled={entry.disabled}
            className={cn(
              'flex-col items-start gap-0.5',
              entry.destructive && DESTRUCTIVE_ITEM_CLASS
            )}
            aria-label={
              entry.disabled && entry.disabledReason
                ? `${entry.label}. ${entry.disabledReason}`
                : undefined
            }
            onSelect={() => {
              if (entry.focusesOwnSurface) {
                deferredRef.current = entry.onClick;
                return;
              }
              entry.onClick();
            }}
          >
            <span className="flex w-full items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                {entry.icon}
                {entry.label}
              </span>
              {entry.shortcut && <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>}
            </span>
            {entry.disabled && entry.disabledReason && (
              <span
                className="text-[11px] leading-4 text-foreground-de-emp"
                data-testid={`${dataTestId}-menu-disabled-reason`}
              >
                {entry.disabledReason}
              </span>
            )}
          </DropdownMenuItem>
        )
      )}
    </>
  );

  /** Suppresses the hand-off back to the trigger, so the surface the action mounts keeps focus. */
  const onCloseAutoFocus = (event: Event) => {
    if (!keepFocusRef.current) return;
    keepFocusRef.current = false;
    event.preventDefault();
  };

  // Run from an effect after the close commits, rather than from the item or the focus hand-off:
  // the list is gone and focus has settled by then, so the surface the action mounts is the only
  // thing asking for the keyboard.
  useEffect(() => {
    if (open) return;
    const deferred = deferredRef.current;
    if (!deferred) return;
    deferredRef.current = null;
    keepFocusRef.current = true;
    deferred();
  }, [open]);

  return { items, onCloseAutoFocus };
};

interface GridContextMenuState {
  anchor: { x: number; y: number };
}

export interface GridContextMenuProps {
  label: string;
  /** Prefix for the menu's data-testids; the derived ids keep it. */
  dataTestId: string;
  /** Open state is the grid's — one menu at a time, keyed by whatever target it resolved. */
  state: GridContextMenuState | null;
  entries: () => GridMenuEntry[];
  onClose: () => void;
}

/**
 * Controlled, pointer-anchored menu for right-click / Shift+F10. The grid owns the open state
 * and target resolution (one delegated handler, not a menu component per cell, so a mounted row
 * never re-renders for it); this only renders.
 *
 * A zero-size element at the pointer point stands in for a trigger, because the menu positions
 * against an element and the grid has only coordinates.
 */
export const GridContextMenu: React.FC<GridContextMenuProps> = ({
  label,
  dataTestId,
  state,
  entries,
  onClose,
}) => {
  const { items, onCloseAutoFocus } = useGridMenuItems(state ? entries() : [], !!state, dataTestId);
  if (!state) {
    return null;
  }
  return (
    <DropdownMenu
      open
      modal={false}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className="pointer-events-none fixed size-0"
          data-testid={`${dataTestId}-context-menu-anchor`}
          style={{ left: state.anchor.x, top: state.anchor.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        aria-label={label}
        className="min-w-52"
        data-testid={`${dataTestId}-context-menu`}
        onCloseAutoFocus={onCloseAutoFocus}
        onClick={(event) => event.stopPropagation()}
        // Portalled in the DOM, still a React child of the grid — whose handler reads Delete and
        // Ctrl+Z as the cell selection's wherever they come from.
        onKeyDown={(event) => event.stopPropagation()}
      >
        {items}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
