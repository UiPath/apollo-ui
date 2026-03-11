import * as React from 'react';
import { Play, Pencil, Trash2, EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface HoverMenuProps {
  className?: string;
  onPlay?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
}

// ============================================================================
// Internal: icon button
// ============================================================================

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="group flex h-6 w-6 items-center justify-center rounded-[4px] text-foreground-muted hover:bg-surface-hover hover:text-foreground"
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 group-hover:h-5 group-hover:w-5" strokeWidth={1.4} />
    </button>
  );
}

// ============================================================================
// HoverMenu
// ============================================================================

/**
 * Contextual hover menu for canvas nodes.
 *
 * Displays Play, Edit, Delete, and More actions in a compact floating toolbar.
 */
export function HoverMenu({ className, onPlay, onEdit, onDelete, onMore }: HoverMenuProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-1 rounded-xl border border-surface-overlay bg-surface-raised px-2 py-1',
        className,
      )}
    >
      <MenuButton icon={Play} label="Run node" onClick={onPlay} />
      <MenuButton icon={Pencil} label="Edit node" onClick={onEdit} />
      <MenuButton icon={Trash2} label="Delete node" onClick={onDelete} />
      <div className="h-5 w-px bg-surface-overlay" />
      <MenuButton icon={EllipsisVertical} label="More options" onClick={onMore} />
    </div>
  );
}
