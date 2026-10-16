import { ChevronRight, Folder } from 'lucide-react';
import type { ReactNode } from 'react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib';

interface GroupHeadingProps {
  label: string;
  /** Id for the label, which names the group the heading heads. */
  labelId: string;
  count: number;
  collapsed: boolean;
  showCount: boolean;
  icon?: ReactNode;
}

/**
 * The chevron, glyph, label and count every group heading shows. The chevron
 * sits in the same leading column the rows reserve for their tick, so glyphs
 * stack in clean columns. Only the label is read: the glyphs are decorative,
 * and a consumer glyph may carry a title or fallback text.
 */
function GroupHeading({ label, labelId, count, collapsed, showCount, icon }: GroupHeadingProps) {
  return (
    <>
      <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
        <ChevronRight
          size={13}
          className={cn('text-foreground-subtle transition-transform', !collapsed && 'rotate-90')}
        />
      </span>
      <span aria-hidden className="grid size-3.5 shrink-0 place-items-center text-foreground-muted">
        {icon ?? <Folder size={14} />}
      </span>
      <span id={labelId} className="min-w-0 flex-1 truncate">
        {label}
      </span>
      {showCount && (
        <span aria-hidden className="shrink-0 text-xs font-medium text-foreground-subtle">
          {count}
        </span>
      )}
    </>
  );
}

/**
 * A heading cannot take focus, so pressing it would blur the search, which
 * owns the keyboard cursor: after a pointer fold, typing and the arrows would
 * stop working. Preventing the pointer and mouse defaults keeps focus where it
 * was; the click still toggles.
 */
const keepSearchFocus = {
  onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(),
  onMouseDown: (event: { preventDefault(): void }) => event.preventDefault(),
};

const headingClassName =
  'flex w-full items-center gap-2 py-1.5 pl-3 pr-3 text-left text-sm font-medium text-foreground-muted';

export interface ResourceGroupHeaderProps extends GroupHeadingProps {
  /** Set while a search force-expands every group, so the toggle is inert. */
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * The heading over an open group: the label that names its `role="group"`.
 *
 * Not a control. The listbox may hold only options and groups, so nothing
 * interactive sits in it. A click anywhere on the heading collapses the group
 * for the pointer; the keyboard does it with ArrowLeft from any of its rows,
 * which the picker handles from the search.
 */
export function ResourceGroupHeader({
  disabled = false,
  onToggle,
  ...heading
}: ResourceGroupHeaderProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut only; the keyboard collapses the group with ArrowLeft from its rows, and the listbox may hold no control.
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard route is ArrowLeft on a row, handled by the picker's search.
    <div
      data-slot="resource-group-header"
      className={cn(
        headingClassName,
        disabled ? 'cursor-default' : 'cursor-pointer hover:bg-surface-overlay'
      )}
      onClick={disabled ? undefined : onToggle}
      {...keepSearchFocus}
    >
      <GroupHeading {...heading} />
    </div>
  );
}

export interface ResourceGroupHeadingOptionProps extends GroupHeadingProps {
  /** The option's cmdk value, unique beside every row id. */
  value: string;
  /** Spoken name, which says whether the group is collapsed or open. */
  ariaLabel: string;
  onToggle: () => void;
}

/**
 * A group's heading kept as an option, for when the group has no row the
 * keyboard cursor can reach.
 *
 * Collapsed, its rows are unmounted; open with every row disabled, cmdk skips
 * them all. Either way, without this the cursor could never reach the group
 * to fold or unfold it. As an option it is a cursor stop that says the
 * group's state, and Enter or a click toggles it, as ArrowRight opens and
 * ArrowLeft folds it. It commits nothing.
 */
export function ResourceGroupHeadingOption({
  value,
  ariaLabel,
  onToggle,
  ...heading
}: ResourceGroupHeadingOptionProps) {
  return (
    <CommandItem
      value={value}
      aria-label={ariaLabel}
      data-slot={heading.collapsed ? 'resource-group-collapsed' : 'resource-group-heading-option'}
      onSelect={onToggle}
      {...keepSearchFocus}
      className={cn(
        headingClassName,
        'cursor-pointer rounded-none data-[selected=true]:bg-surface-overlay'
      )}
    >
      <GroupHeading {...heading} />
    </CommandItem>
  );
}
