import { ChevronRight, Folder } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib';

export interface ResourceGroupHeaderProps {
  label: string;
  count: number;
  collapsed: boolean;
  showCount: boolean;
  icon?: ReactNode;
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
  count,
  collapsed,
  showCount,
  icon,
  onToggle,
}: ResourceGroupHeaderProps) {
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-1.5 pl-3 pr-3 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-overlay"
      onClick={onToggle}
    >
      <span className="grid size-3.5 shrink-0 place-items-center">
        <ChevronRight
          size={13}
          className={cn('text-foreground-subtle transition-transform', !collapsed && 'rotate-90')}
        />
      </span>
      <span className="grid size-3.5 shrink-0 place-items-center text-foreground-muted">
        {icon ?? <Folder size={14} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {showCount && (
        <span className="shrink-0 text-xs font-medium text-foreground-subtle">{count}</span>
      )}
    </button>
  );
}
