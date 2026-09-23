import { Check, ChevronRight, Folder } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib';
import type { FolderPickerEntry } from '../types';

export interface FolderRowProps {
  entry: FolderPickerEntry;
  selected: boolean;
  /** This row's own contents are being fetched. */
  loading: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}

/**
 * One folder in the list.
 *
 * A `treeitem` rather than a listbox option: an option is atomic to assistive
 * technology, which would hide the trailing Open control or make it compete
 * with the row for focus. Clicking the row highlights it, the chevron or a
 * double click opens it, and a known leaf offers no way in at all.
 */
export function FolderRow({ entry, selected, loading, onToggleSelect, onOpen }: FolderRowProps) {
  const label = entry.label ?? entry.name;
  /** A known leaf offers no way in, by pointer or by keyboard. */
  const canOpen = !entry.disabled && entry.hasChildren !== false;

  return (
    <div
      role="treeitem"
      aria-selected={selected}
      aria-label={label}
      // Collapsed rather than absent: a row that can be opened has children
      // that simply have not been fetched yet.
      aria-expanded={canOpen ? false : undefined}
      aria-disabled={entry.disabled}
      tabIndex={entry.disabled ? -1 : 0}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground transition-colors',
        entry.disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-surface-overlay',
        selected && 'bg-surface-overlay'
      )}
      onClick={() => !entry.disabled && onToggleSelect()}
      onDoubleClick={() => canOpen && onOpen()}
      onKeyDown={(event) => {
        if (entry.disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggleSelect();
        } else if (event.key === 'ArrowRight' && canOpen) {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="grid size-3.5 shrink-0 place-items-center">
        {selected && <Check className="size-3.5 text-foreground" strokeWidth={3} />}
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
