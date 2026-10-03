import { Check, ChevronRight, Folder } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib';
import type { FolderPickerEntry } from '../types';

export interface FolderRowProps {
  entry: FolderPickerEntry;
  /** Depth in the tree, 1 at the root. */
  level: number;
  selected: boolean;
  /** The tree's single tab stop. The parent moves it with the arrow keys. */
  active: boolean;
  /** This row's own contents are being fetched. */
  loading: boolean;
  rowRef: (node: HTMLDivElement | null) => void;
  onFocus: () => void;
  onToggleSelect: () => void;
  onOpen: () => void;
}

/**
 * One folder in the list.
 *
 * A `treeitem` rather than a listbox option: an option is atomic to assistive
 * technology, which would hide the trailing Open control or make it compete
 * with the row for focus. Clicking the row marks it with a tick as the
 * pending choice, the chevron or a double click opens it, and a known leaf
 * offers no way in at all.
 */
export function FolderRow({
  entry,
  level,
  selected,
  active,
  loading,
  rowRef,
  onFocus,
  onToggleSelect,
  onOpen,
}: FolderRowProps) {
  const label = entry.label ?? entry.name;
  /** A known leaf offers no way in, by pointer or by keyboard. */
  const canOpen = !entry.disabled && entry.hasChildren !== false;
  /**
   * A row already being fetched ignores another open. A second request would
   * claim a fresh id and abandon the first, restarting the wait for nothing.
   * The chevron is already swapped for the spinner, so only the double click
   * and ArrowRight need the guard.
   */
  const canStartOpen = canOpen && !loading;

  return (
    <div
      role="treeitem"
      aria-level={level}
      aria-selected={selected}
      aria-label={label}
      // Collapsed rather than absent: a row that can be opened has children
      // that simply have not been fetched yet.
      aria-expanded={canOpen ? false : undefined}
      aria-disabled={entry.disabled}
      ref={rowRef}
      // No tabindex at all when disabled, so a click cannot focus the row and
      // pull the roving focus onto one the arrow keys skip.
      tabIndex={entry.disabled ? undefined : active ? 0 : -1}
      onFocus={(event) => !entry.disabled && event.target === event.currentTarget && onFocus()}
      // The fill means cursor position and nothing else. Selection is the tick,
      // as it is in Select and DropdownMenu: `surface-selected` and
      // `surface-hover` are the same value in every theme, so a selected row
      // carrying its own fill is indistinguishable from the row under the
      // pointer, and the highlight appears to follow the mouse.
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground transition-colors',
        entry.disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-surface-overlay',
        selected && 'font-medium'
      )}
      onClick={() => !entry.disabled && onToggleSelect()}
      onDoubleClick={() => canStartOpen && onOpen()}
      onKeyDown={(event) => {
        if (entry.disabled) return;
        // Only keys pressed on the row itself. The nested Open control bubbles
        // its own Enter and Space up here, and taking them would toggle the
        // draft instead of letting the button drill in.
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggleSelect();
        } else if (event.key === 'ArrowRight' && canStartOpen) {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="grid size-3.5 shrink-0 place-items-center">
        {selected && <Check className="size-3.5 text-foreground-accent" strokeWidth={3} />}
      </span>
      <Folder size={14} className="shrink-0 text-foreground-muted" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {loading ? (
        <span className="grid size-5 shrink-0 place-items-center">
          <Spinner className="size-3.5" />
        </span>
      ) : (
        entry.hasChildren !== false && (
          <button
            type="button"
            aria-label={`Open ${label}`}
            // Out of the tab order: ArrowRight opens the row, so a second
            // stop per row would only lengthen the way through the tree.
            tabIndex={-1}
            disabled={entry.disabled}
            className="grid size-5 shrink-0 cursor-pointer place-items-center rounded text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            <ChevronRight size={14} />
          </button>
        )
      )}
    </div>
  );
}
