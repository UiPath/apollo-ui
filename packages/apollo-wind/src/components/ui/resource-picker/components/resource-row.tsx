import { Check } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib';
import type { ResourceItem, ResourceItemAction } from '../types';

export interface ResourceRowProps {
  item: ResourceItem;
  chosen: boolean;
  /** Nesting depth. Rows under a group sit one step in. */
  depth: number;
  onSelect: () => void;
  /** Pointer shortcuts at the trailing edge, revealed on the row under the cursor. */
  actions?: ResourceItemAction[];
}

/**
 * One selectable resource.
 *
 * The tick has a reserved column of its own rather than trailing the label,
 * so it stays in one place as the rows above and below it change, and the
 * chosen row carries the rest of the emphasis in its background.
 */
export function ResourceRow({ item, chosen, depth, onSelect, actions }: ResourceRowProps) {
  const hasActions = Boolean(actions && actions.length > 0);
  return (
    <CommandItem
      value={item.id}
      // Named explicitly so the decorative glyphs stay out of it, but with the
      // description kept in: two rows can share a label and differ only there.
      // The subtitle joins it as text, since it can bear on the choice.
      aria-label={[item.label, item.description, item.subtitleText].filter(Boolean).join(', ')}
      // cmdk owns `aria-selected`, which it moves with the keyboard cursor
      // and reads back to find the active row, so it cannot also mean the
      // committed value. A second selection state, such as `aria-checked`,
      // would then contradict it. The committed row is marked as the current
      // one instead, which is not a selection state and is announced apart
      // from wherever the cursor is.
      aria-current={chosen ? 'true' : undefined}
      // The keyboard route to the row's actions, which are not controls of
      // the option itself.
      aria-keyshortcuts={hasActions ? 'Shift+Enter' : undefined}
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
        // Shrinks and is capped, so a long description ellipsizes rather than
        // pushing the label out of the row.
        <span className="min-w-0 max-w-[45%] truncate text-xs text-foreground-subtle">
          {item.description}
        </span>
      )}
      {hasActions && (
        // Pointer shortcuts only, hidden from assistive technology and out of
        // the tab order: an option is atomic, and anything focusable inside
        // it breaks the search's active-descendant model. The same actions
        // reach the keyboard as a menu, through Shift+Enter on the row.
        // Hidden rather than absent until the row is under the cursor, so the
        // label does not reflow as the pointer moves down the list.
        <span
          aria-hidden
          data-slot="resource-row-actions"
          className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 group-data-[selected=true]/row:opacity-100"
        >
          {actions?.map((action) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut, hidden from assistive technology; the keyboard runs it from the row's Shift+Enter menu.
            // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard route is the row's Shift+Enter menu.
            <span
              key={action.id}
              data-slot="resource-row-action"
              title={action.label}
              className={cn(
                'cursor-pointer rounded transition-colors hover:bg-surface-hover',
                action.icon
                  ? 'grid size-6 place-items-center text-foreground-muted hover:text-foreground'
                  : 'px-1.5 py-0.5 text-xs font-medium',
                action.tone === 'danger' && 'text-error hover:text-error'
              )}
              // A click here runs the action, not a pick: cmdk commits a row
              // on click, so it stops before reaching the row.
              onClick={(event) => {
                event.stopPropagation();
                action.onSelect();
              }}
              // Pressing it must not move focus either: the span cannot take
              // focus, so the press would blur the search and leave an
              // action that keeps the picker open outside the search's
              // active-descendant model. Preventing the pointer and mouse
              // defaults keeps focus where it was; the click still runs.
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onMouseDown={(event) => event.preventDefault()}
            >
              {action.icon ?? action.text ?? action.label}
            </span>
          ))}
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
