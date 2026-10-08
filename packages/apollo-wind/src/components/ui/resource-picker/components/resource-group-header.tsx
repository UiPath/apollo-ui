import { ChevronRight, Folder } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib';

export interface ResourceGroupHeaderProps {
  label: string;
  /** Id for the label, which names the group the header heads. */
  labelId?: string;
  /** Id of the rows the header shows and hides, while they are shown. */
  controlsId?: string;
  count: number;
  collapsed: boolean;
  showCount: boolean;
  icon?: ReactNode;
  /** Set while a search force-expands every group, so the toggle is inert. */
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * The heading that opens and closes one group of rows.
 *
 * A plain button rather than a `CommandItem`: this is a disclosure control,
 * not something selectable, so cmdk must neither land the keyboard cursor on
 * it nor match it against the search. Its chevron sits in the same leading
 * column the rows reserve for their tick, so glyphs stack in clean columns.
 */
export function ResourceGroupHeader({
  label,
  labelId,
  controlsId,
  count,
  collapsed,
  showCount,
  icon,
  disabled = false,
  onToggle,
}: ResourceGroupHeaderProps) {
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      aria-controls={controlsId}
      disabled={disabled}
      className="disabled:cursor-default disabled:hover:bg-transparent flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-1.5 pl-3 pr-3 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-overlay"
      onClick={onToggle}
      // cmdk commits its active row on an Enter that reaches the list, which
      // would close the picker instead of toggling the group. Stopping the
      // bubble leaves the button's own activation, a default action, intact.
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.stopPropagation();
      }}
    >
      <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
        <ChevronRight
          size={13}
          className={cn('text-foreground-subtle transition-transform', !collapsed && 'rotate-90')}
        />
      </span>
      {/* Decorative, and a consumer glyph may carry a title or fallback
          text, so it is kept out of the button's name, which is the label
          and count alone. */}
      <span aria-hidden className="grid size-3.5 shrink-0 place-items-center text-foreground-muted">
        {icon ?? <Folder size={14} />}
      </span>
      <span id={labelId} className="min-w-0 flex-1 truncate">
        {label}
      </span>
      {showCount && (
        <span className="shrink-0 text-xs font-medium text-foreground-subtle">{count}</span>
      )}
    </button>
  );
}
