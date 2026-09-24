'use client';

import { X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Command, CommandInput, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { ResourceGroupHeader } from './components/resource-group-header';
import { ResourcePickerEmptyState } from './components/resource-picker-empty-state';
import { ResourcePickerFooter } from './components/resource-picker-footer';
import { ResourceRow } from './components/resource-row';
import type { ResourceItem, ResourcePickerContentProps, ResourcePickerProps } from './types';
import { filterGroups } from './types';

/**
 * Search and grouped rows for embedding in a consumer-owned popover or sheet.
 *
 * Rows commit on click. One resource is one decision, so a confirm step would
 * only add a second click to a choice that is already unambiguous.
 */
export function ResourcePickerContent({
  groups,
  onSelect,
  value,
  searchPlaceholder = 'Search...',
  initialSearch = '',
  query: controlledQuery,
  onQueryChange,
  emptyText = 'No matches.',
  listLabel = 'Resources',
  showCounts = true,
  renderItemActions,
  footerLeading,
  footerTrailing,
  className,
}: ResourcePickerContentProps) {
  const [uncontrolledQuery, setUncontrolledQuery] = useState(initialSearch);
  const query = controlledQuery ?? uncontrolledQuery;

  /** Collapsed rather than expanded state, so a new group arrives open. */
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(groups.filter((group) => group.defaultCollapsed).map((group) => group.id))
  );

  const setQuery = (nextQuery: string) => {
    if (controlledQuery === undefined) setUncontrolledQuery(nextQuery);
    onQueryChange?.(nextQuery);
  };

  const visibleGroups = useMemo(() => filterGroups(groups, query), [groups, query]);
  const filtering = query.trim().length > 0;

  const toggleGroup = (id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Command
      loop
      // The query is owned here and the rows are filtered directly, so cmdk is
      // left doing keyboard navigation over whatever rows remain.
      shouldFilter={false}
      className={cn('flex max-h-80 min-w-0 flex-col overflow-hidden bg-popover', className)}
      label={listLabel}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={searchPlaceholder}
        onKeyDown={(event) => {
          // Escape empties the search before the popover treats it as a
          // dismiss, so a typo is undone without closing the picker.
          if (event.key === 'Escape' && query) {
            event.preventDefault();
            event.stopPropagation();
            setQuery('');
          }
        }}
      />

      <CommandList className="min-h-0 flex-1">
        {/* Decided by the groups rather than by cmdk's CommandEmpty, which
            counts mounted rows: collapsing every group unmounts them all, and
            it would then call a full picker empty. */}
        {visibleGroups.length === 0 && (
          <ResourcePickerEmptyState query={query.trim()} emptyText={emptyText} />
        )}
        {visibleGroups.map((group) => {
          // A search force-expands, so a match is never hidden inside a group
          // the user collapsed before typing.
          const collapsed = !filtering && collapsedIds.has(group.id);
          return (
            <div key={group.id} role="none">
              <ResourceGroupHeader
                label={group.label}
                count={group.items.length}
                collapsed={collapsed}
                showCount={showCounts}
                icon={group.icon}
                onToggle={() => toggleGroup(group.id)}
              />
              {/* `hidden` would take the rows out of cmdk's reach entirely;
                  unmounting them keeps its cursor over what is on screen. */}
              {!collapsed &&
                group.items.map((item) => (
                  <ResourceRow
                    key={item.id}
                    item={item}
                    chosen={item.id === value}
                    depth={1}
                    onSelect={() => !item.disabled && onSelect(item)}
                    actions={renderItemActions?.(item)}
                  />
                ))}
            </div>
          );
        })}
      </CommandList>

      <ResourcePickerFooter leading={footerLeading} trailing={footerTrailing} />
    </Command>
  );
}

/**
 * The field's own look, shared with pickers that build on this one so their
 * fields and this one read as a pair. Mirrors SelectTrigger, including its
 * `future:` overrides and its invalid state. `data-status="warning"` is the
 * advisory counterpart to `aria-invalid`.
 */
export const resourcePickerTriggerClassName = cn(
  'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent pl-3 text-left text-base transition-colors md:text-sm',
  'focus:outline-none focus:ring-2 focus:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:pl-4 future:font-normal future:hover:bg-surface-hover',
  'aria-invalid:border-error aria-invalid:focus-visible:ring-error future:aria-invalid:ring-1 future:aria-invalid:ring-error/40',
  'data-[status=warning]:border-warning future:data-[status=warning]:ring-1 future:data-[status=warning]:ring-warning/40'
);

/**
 * Field-and-popover picker over grouped resources.
 *
 * The trigger leads with its icon and then the value, matching the date and
 * folder fields, so an empty resource field does not read as bare chrome
 * beside them.
 */
export function ResourcePicker({
  groups,
  onSelect,
  onClear,
  value = '',
  placeholder = 'Select...',
  disabled = false,
  clearable = true,
  clearAriaLabel = 'Clear selection',
  icon,
  children,
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  trailingAdornment,
  status,
  'aria-describedby': ariaDescribedBy,
  contentClassName,
  className,
  ...contentProps
}: ResourcePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const contentRef = useRef<HTMLDivElement>(null);

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const selected = useMemo(() => {
    for (const group of groups) {
      const hit = group.items.find((item) => item.id === value);
      if (hit) return hit;
    }
    return null;
  }, [groups, value]);

  /** Remounts the content per opening, so the search does not persist a stale query. */
  const contentKey = open ? value || 'empty' : 'closed';

  return (
    <div className={cn('group relative min-w-0', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {children ?? (
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-invalid={status === 'error' || undefined}
              aria-describedby={ariaDescribedBy}
              data-status={status}
              className={cn(
                resourcePickerTriggerClassName,
                // Room for the overlaid controls: the clear alone, or the
                // clear beside an adornment.
                trailingAdornment ? 'pr-14 future:pr-14' : 'pr-9 future:pr-9'
              )}
            >
              {icon && (
                <span className="grid size-4 shrink-0 place-items-center text-foreground-muted">
                  {icon}
                </span>
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  selected ? 'text-foreground' : 'text-foreground-subtle'
                )}
              >
                {selected?.label ?? placeholder}
              </span>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={4}
          className={cn(
            'w-(--radix-popover-trigger-width) min-w-72 overflow-hidden p-0',
            contentClassName
          )}
          ref={contentRef}
          // Opening lands in the search, so typing filters straight away, and
          // cmdk drives the rows through the keys the search box forwards.
          // Radix would otherwise take the first focusable element, which is
          // only the search while nothing is placed above it.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.querySelector<HTMLInputElement>('input')?.focus();
          }}
        >
          <ResourcePickerContent
            key={contentKey}
            {...contentProps}
            groups={groups}
            value={value}
            onSelect={(item: ResourceItem) => {
              onSelect(item);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Overlaid at the trailing edge rather than left in flow, where an
          adornment would sit beside the field or wrap to its own line. The
          trigger reserves the room with its `pr-9`. A sibling of the trigger,
          not a child: a button cannot be nested inside a button. */}
      {(trailingAdornment || (clearable && onClear && selected && !disabled && !children)) && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-0.5">
          {clearable && onClear && selected && !disabled && !children && (
            <button
              type="button"
              aria-label={clearAriaLabel}
              className="pointer-events-auto grid size-4 cursor-pointer place-items-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onClear()}
            >
              <X size={11} />
            </button>
          )}
          {trailingAdornment && (
            <span className="pointer-events-auto flex items-center">{trailingAdornment}</span>
          )}
        </span>
      )}
    </div>
  );
}

export type {
  ResourceGroup,
  ResourceItem,
  ResourcePickerContentProps,
  ResourcePickerProps,
} from './types';
