import { Check } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib';
import type { ResourceItem } from '../types';

export interface ResourceRowProps {
  item: ResourceItem;
  chosen: boolean;
  /** Nesting depth. Rows under a group sit one step in. */
  depth: number;
  onSelect: () => void;
}

/**
 * One selectable resource.
 *
 * The tick has a reserved column of its own rather than trailing the label,
 * so it stays in one place as the rows above and below it change, and the
 * chosen row carries the rest of the emphasis in its background.
 */
export function ResourceRow({ item, chosen, depth, onSelect }: ResourceRowProps) {
  return (
    <CommandItem
      value={item.id}
      aria-label={item.label}
      disabled={item.disabled}
      onSelect={onSelect}
      // Two fills for two states. The neutral one is cursor position: cmdk
      // sets data-selected for both the keyboard cursor and hover, so one rule
      // covers each. The chosen row takes the brand tint instead, and keeps it
      // under the cursor. `surface-selected` is no use here, since it is the
      // same value as `surface-hover` in every theme and the two states would
      // be indistinguishable.
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-none py-1.5 pr-3 text-sm',
        chosen
          ? 'bg-brand-subtle font-medium data-[selected=true]:bg-brand-subtle'
          : 'data-[selected=true]:bg-surface-overlay data-[selected=true]:text-foreground'
      )}
      // One 16px step per level, matching the picker family's scale.
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      <span className="grid size-3.5 shrink-0 place-items-center">
        {chosen && <Check className="size-3.5 text-foreground-accent" strokeWidth={3} />}
      </span>
      {item.icon && (
        <span className="grid size-3.5 shrink-0 place-items-center text-foreground-muted">
          {item.icon}
        </span>
      )}
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          chosen ? 'text-foreground-accent' : 'text-foreground'
        )}
      >
        {item.label}
      </span>
      {item.description && (
        <span className="shrink-0 truncate text-xs text-foreground-subtle">{item.description}</span>
      )}
    </CommandItem>
  );
}
