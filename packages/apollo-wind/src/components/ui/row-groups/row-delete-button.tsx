import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';

export interface RowDeleteButtonProps {
  /** Accessible name and hover title that say which row goes, e.g. "Remove condition 2". */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * Hides the action until the row is hovered or holds focus. For dense lists only, since it hides
   * the action from touch users; needs a `group` ancestor.
   */
  revealOnHover?: boolean;
  className?: string;
}

/**
 * Removes one item of a repeatable list. Muted at rest and neutral on hover, never red: red is
 * for destructive menu items and confirmation dialogs. Marked `data-row-delete`, so `useRowFocus`
 * can land on it after a delete.
 */
export function RowDeleteButton({
  label,
  onClick,
  disabled,
  revealOnHover = false,
  className,
}: RowDeleteButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      icon
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      data-row-delete=""
      className={cn(
        'shrink-0 text-muted-foreground hover:text-foreground',
        revealOnHover &&
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
        className
      )}
    >
      <Trash2 />
    </Button>
  );
}
