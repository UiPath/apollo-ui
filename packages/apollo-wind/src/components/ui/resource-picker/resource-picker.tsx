'use client';

import { X } from 'lucide-react';
import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
            // Known issue, tracked for a follow-up: the listbox flattens this
            // wrapper, so the header button becomes a direct child of the
            // listbox, which may own only options and groups. axe reports it
            // as aria-required-children.
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
  contentClassName,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-errormessage': ariaErrorMessage,
  ...contentProps
}: ResourcePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const contentRef = useRef<HTMLDivElement>(null);
  const trailingRef = useRef<HTMLSpanElement>(null);
  const [trailingWidth, setTrailingWidth] = useState(0);

  const setOpen = (nextOpen: boolean) => {
    // The `disabled` forwarded to the trigger only stops a real button. A
    // custom trigger that is an anchor or a div ignores the attribute, and
    // Radix toggles on its click regardless, so opening is refused here too.
    if (nextOpen && disabled) return;
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

  const showClear = Boolean(clearable && onClear && selected && !disabled && !children);
  const showTrailing = Boolean(trailingAdornment) || showClear;

  // The trailing slot takes any node, so its width is measured rather than
  // assumed, and the trigger's label is kept clear of whatever it holds.
  // Measured before paint, so the label never shows under the slot first.
  useLayoutEffect(() => {
    const node = trailingRef.current;
    if (!showTrailing || !node) {
      setTrailingWidth(0);
      return;
    }
    const measure = () => setTrailingWidth(node.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [showTrailing]);

  /** Remounts the content per opening, so the search does not persist a stale query. */
  const contentKey = open ? value || 'empty' : 'closed';

  return (
    <div
      className={cn('group relative min-w-0', className)}
      // The slot's own width, its 8px inset from the edge and a 12px gap
      // before the label. A lone clear control comes to the 36px the trigger
      // keeps by default, so the common case is unchanged.
      style={
        showTrailing
          ? ({
              '--resource-picker-trailing-inset': `${Math.max(36, trailingWidth + 20)}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {children ?? (
            <button
              type="button"
              id={id}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              // No aria-label: the trigger is named by its own text, and an
              // aria-label would override a consumer label (htmlFor or
              // aria-labelledby), so leaving it unset lets that label win.
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              aria-errormessage={ariaErrorMessage}
              // Mirrors SelectTrigger, including its `future:` overrides, so a
              // resource field and a select field in one panel read as a pair.
              className={cn(
                'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent pl-3 pr-9 text-left text-base transition-colors md:text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:font-normal future:hover:bg-surface-hover',
                showTrailing &&
                  'pr-(--resource-picker-trailing-inset) future:pr-(--resource-picker-trailing-inset)'
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
          // Radix renders the content as a dialog, which needs a name of its
          // own. The list's name serves, since the list is all it holds.
          aria-label={contentProps.listLabel ?? 'Resources'}
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
          trigger reserves the slot's measured width as its right padding. A
          sibling of the trigger, not a child: a button cannot be nested
          inside a button. */}
      {showTrailing && (
        <span
          ref={trailingRef}
          className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-0.5"
        >
          {showClear && (
            <button
              type="button"
              aria-label={clearAriaLabel}
              className="pointer-events-auto grid size-4 cursor-pointer place-items-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onClear?.()}
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
