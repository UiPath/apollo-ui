import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib';
import type { ResourceItem } from '../types';

export interface ResourceRowProps {
  item: ResourceItem;
  chosen: boolean;
  /** Nesting depth. Rows under a group sit one step in. */
  depth: number;
  onSelect: () => void;
  /** Trailing controls, revealed on the row under the cursor. */
  actions?: ReactNode;
}

/**
 * One selectable resource.
 *
 * The tick has a reserved column of its own rather than trailing the label,
 * so it stays in one place as the rows above and below it change, and the
 * chosen row carries the rest of the emphasis in its background.
 */
export function ResourceRow({ item, chosen, depth, onSelect, actions }: ResourceRowProps) {
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
        'group/row flex cursor-pointer items-center gap-2 rounded-none py-1.5 pr-3 text-sm',
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
        // 16px, so an image such as a connector logo keeps its detail. Line
        // glyphs are 14px and centre inside it.
        <span className="grid size-4 shrink-0 place-items-center text-foreground-muted">
          {item.icon}
        </span>
      )}
      {item.subtitle ? (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <RowLabel label={item.label} chosen={chosen} />
          <span className="min-w-0 truncate text-xs font-normal">{item.subtitle}</span>
        </span>
      ) : (
        <RowLabel label={item.label} chosen={chosen} />
      )}
      {item.description && (
        <span className="shrink-0 truncate text-xs text-foreground-subtle">{item.description}</span>
      )}
      {actions && (
        // Hidden rather than absent until the row is under the cursor, so the
        // label does not reflow as the pointer moves down the list. The clicks
        // stop here: cmdk commits a row on click, and an action is not a pick.
        // biome-ignore lint/a11y/noStaticElementInteractions: only stops propagation; the controls inside are buttons
        // biome-ignore lint/a11y/useKeyWithClickEvents: only stops propagation; the controls inside are buttons
        <span
          className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100 group-data-[selected=true]/row:opacity-100"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {actions}
        </span>
      )}
    </CommandItem>
  );
}

function RowLabel({ label, chosen }: { label: string; chosen: boolean }) {
  return (
    <span
      className={cn(
        'min-w-0 flex-1 truncate',
        chosen ? 'text-foreground-accent' : 'text-foreground'
      )}
    >
      {label}
    </span>
  );
}
