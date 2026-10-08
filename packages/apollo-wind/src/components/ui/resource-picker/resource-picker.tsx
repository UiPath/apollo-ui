'use client';

import { X } from 'lucide-react';
import {
  type CSSProperties,
  type HTMLAttributes,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
 * The element cmdk's list renders as, through `asChild`. cmdk resolves an
 * `asChild` child by calling its component, so it must be a component rather
 * than a bare element, and must not hold hooks of its own.
 */
function RowListContainer(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

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
  noMatchText,
  listLabel = 'Resources',
  showCounts = true,
  renderItemActions,
  footerLeading,
  footerTrailing,
  className,
}: ResourcePickerContentProps) {
  const [uncontrolledQuery, setUncontrolledQuery] = useState(initialSearch);
  const query = controlledQuery ?? uncontrolledQuery;
  /**
   * A controlled query with no handler cannot be cleared from here, so Escape
   * is not held for it: holding it would cancel every dismiss while the text
   * never goes away. Read by `keepResourceSearchOnEscape` too, through the
   * root's `data-query-readonly`.
   */
  const queryReadOnly = controlledQuery !== undefined && !onQueryChange;

  /** Collapsed rather than expanded state, so a new group arrives open. */
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(groups.filter((group) => group.defaultCollapsed).map((group) => group.id))
  );
  /**
   * Every group id whose `defaultCollapsed` has been applied. Groups often
   * arrive after mount, once their data loads, so the default is applied the
   * first time each id appears rather than only at mount, and never again, so
   * a group the user has toggled keeps their choice.
   */
  const [seenIds, setSeenIds] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.id))
  );
  const newGroups = groups.filter((group) => !seenIds.has(group.id));
  if (newGroups.length > 0) {
    setSeenIds(new Set([...seenIds, ...newGroups.map((group) => group.id)]));
    const collapsedNew = newGroups.filter((group) => group.defaultCollapsed);
    if (collapsedNew.length > 0) {
      setCollapsedIds((current) => new Set([...current, ...collapsedNew.map((group) => group.id)]));
    }
  }

  const setQuery = (nextQuery: string) => {
    if (controlledQuery === undefined) setUncontrolledQuery(nextQuery);
    onQueryChange?.(nextQuery);
  };

  const groupIdBase = useId();
  const visibleGroups = useMemo(() => filterGroups(groups, query), [groups, query]);
  const filtering = query.trim().length > 0;
  // With no rows at all, clearing the search could not reveal anything, so
  // that is the empty state whatever the query, not a search miss.
  const hasRows = groups.some((group) => group.items.length > 0);

  const toggleGroup = (id: string) => {
    // A search shows every group open, so a toggle then would change a
    // collapse state nobody can see, and spring it on them once the search
    // is cleared.
    if (filtering) return;
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
      // Lets `keepResourceSearchOnEscape` find the search of the picker that
      // Escape came from, wherever focus is inside it.
      data-slot="resource-picker"
      data-query-readonly={queryReadOnly ? '' : undefined}
      className={cn('flex max-h-80 min-w-0 flex-col overflow-hidden bg-popover', className)}
      label={listLabel}
      onKeyDown={(event) => {
        // Escape from anywhere in the picker, the search or a footer action,
        // empties the search before the surface treats it as a dismiss, so a
        // typo is undone without closing the picker. Stopping it here covers
        // a consumer-owned surface that listens on bubbling; a Radix surface
        // hears Escape in the capture phase, so it is held open by
        // `keepResourceSearchOnEscape` instead.
        if (event.key === 'Escape' && query && !queryReadOnly) {
          event.preventDefault();
          event.stopPropagation();
          setQuery('');
        }
      }}
    >
      <CommandInput
        // Lets `keepResourceSearchOnEscape` tell this input from any other in
        // the surface that hosts the picker.
        data-slot="resource-picker-search"
        value={query}
        onValueChange={setQuery}
        // A query nothing here can change is not offered for editing, so the
        // search does not take keys it would only throw away, and assistive
        // technology hears it as read-only.
        readOnly={queryReadOnly}
        placeholder={searchPlaceholder}
      />

      {/* Decided by the groups rather than by cmdk's CommandEmpty, which
          counts mounted rows: collapsing every group unmounts them all, and
          it would then call a full picker empty. Placed beside the lists
          rather than in one, since a listbox may hold only options and
          groups. The status region stays mounted and only its contents
          change, so a screen reader hears the message when typing removes
          the last match, while focus stays in the search. */}
      {/* biome-ignore lint/a11y/useSemanticElements: role="status" announces a result; <output> implies a computed form value. */}
      <div role="status">
        {visibleGroups.length === 0 && (
          <ResourcePickerEmptyState
            query={hasRows ? query.trim() : ''}
            emptyText={emptyText}
            noMatchText={noMatchText}
          />
        )}
      </div>

      {/* cmdk's list stays the scroll container and the root its keyboard
          cursor walks, but not the listbox: a group's disclosure button
          cannot sit inside one, which may hold only options and groups, and
          a `group` role does not change that. Each group's rows are a
          listbox of their own instead, named by the group, with its header
          between them, so the keyboard model and the tab stops are as they
          were. The listbox role and the attributes that go with it, which
          cmdk sets on its list, are overridden through `asChild`, so it is a
          plain container, still mounted when empty, that the search's
          `aria-controls` points at. */}
      <CommandList asChild className="min-h-0 flex-1">
        <RowListContainer
          role="none"
          aria-label={undefined}
          aria-activedescendant={undefined}
          tabIndex={undefined}
        >
          {visibleGroups.map((group, index) => {
            // A search force-expands, so a match is never hidden inside a
            // group the user collapsed before typing.
            const collapsed = !filtering && collapsedIds.has(group.id);
            // Ids are built from the position rather than the group's own
            // id, which may hold spaces that would split an id reference.
            const labelId = `${groupIdBase}-group-${index}`;
            const rowsId = `${labelId}-rows`;
            return (
              <div key={group.id}>
                <ResourceGroupHeader
                  label={group.label}
                  labelId={labelId}
                  controlsId={collapsed ? undefined : rowsId}
                  count={group.items.length}
                  collapsed={collapsed}
                  showCount={showCounts}
                  icon={group.icon}
                  disabled={filtering}
                  onToggle={() => toggleGroup(group.id)}
                />
                {/* `hidden` would take the rows out of cmdk's reach entirely;
                    unmounting them keeps its cursor over what is on screen. */}
                {!collapsed && (
                  <div id={rowsId} role="listbox" aria-labelledby={labelId}>
                    {group.items.map((item) => (
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
                )}
              </div>
            );
          })}
        </RowListContainer>
      </CommandList>

      <ResourcePickerFooter leading={footerLeading} trailing={footerTrailing} />
    </Command>
  );
}

/**
 * Holds a Radix surface open while the picker's search has text, so Escape
 * clears the search instead of dismissing, wherever focus is in the picker.
 * Radix hears Escape on the document in the capture phase, before the
 * picker's own handler, so the picker cannot stop the dismissal itself. It
 * clears the search as the key reaches it. Escape from outside a picker is
 * left alone, and so is a picker whose controlled query has no
 * `onQueryChange`, since its search could never be cleared.
 *
 * Inside an open shadow root, as under `PortalContainerProvider`, the
 * document sees the event retargeted to the shadow host, so the element the
 * key was pressed in is read from the event's composed path instead.
 *
 * `ResourcePicker` applies it to its popover. Pass it as `onEscapeKeyDown` to a
 * Dialog, Sheet or Popover that hosts `ResourcePickerContent`.
 */
export function keepResourceSearchOnEscape(event: {
  target: EventTarget | null;
  composedPath?(): EventTarget[];
  preventDefault(): void;
}) {
  const target = event.composedPath?.()[0] ?? event.target;
  if (!(target instanceof Element)) return;
  const picker = target.closest('[data-slot="resource-picker"]');
  if (!picker || picker.hasAttribute('data-query-readonly')) return;
  const search = picker.querySelector<HTMLInputElement>(
    'input[data-slot="resource-picker-search"]'
  );
  if (search?.value) event.preventDefault();
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
  // Driven by the forwarded `aria-invalid`, as SelectTrigger is, with the
  // error ring set for `:focus` and `:focus-visible` alike, so pointer focus
  // shows it as keyboard focus does.
  'aria-invalid:border-error aria-invalid:focus:ring-error aria-invalid:focus-visible:ring-error',
  'future:aria-invalid:ring-1 future:aria-invalid:ring-error/40 future:aria-invalid:focus:ring-error future:aria-invalid:focus-visible:ring-error',
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
  // A disabled picker is closed whatever it was told, so neither `open={true}`
  // nor a popover already open when `disabled` arrives leaves rows to commit.
  const requestedOpen = controlledOpen ?? uncontrolledOpen;
  const open = !disabled && requestedOpen;
  // Dropped rather than only masked, so re-enabling does not reopen a popover
  // the user never asked to see again, and a controlling parent is told the
  // picker has closed, so its own state does not reopen it either.
  const closedByDisable = disabled && requestedOpen;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires on the transition into disabled-while-open only; a new `onOpenChange` identity must not re-notify.
  useEffect(() => {
    if (!closedByDisable) return;
    setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [closedByDisable]);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  // Offered for any value, not only one found in `groups`: while they load,
  // or once a refresh drops the chosen row, the field still holds a value
  // that only the picker's own control can empty. `selected` decides the
  // label alone.
  const showClear = Boolean(clearable && onClear && value && !disabled && !children);
  // Both controls belong to the default field. A custom trigger owns its own
  // layout, and an overlay positioned against the wrapper would land on it.
  const showAdornment = Boolean(trailingAdornment) && !children;
  const showTrailing = showAdornment || showClear;

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
    // Without the API the slot keeps its first measurement, which is all a
    // runtime that cannot observe resizes could act on anyway.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [showTrailing]);

  /**
   * Remounts the content per opening, so the search does not persist a stale
   * query. Keyed on `open` alone: a value that changes while the popover is
   * open must not reset an active search or replace the focused input.
   */
  const contentKey = open ? 'open' : 'closed';

  // A button has no value of its own to announce, so once a consumer label
  // takes over the name (htmlFor through `id`, or aria-labelledby), the
  // chosen resource would go unheard. It is added to the description instead,
  // after the consumer's own hint. Without a consumer label the value is
  // already the name, and describing it too would read it twice.
  const valueId = useId();
  const externallyLabelled = Boolean(id || ariaLabelledBy);
  const describedBy =
    [ariaDescribedBy, externallyLabelled && selected ? valueId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  // A disabled custom trigger cannot be stopped by the forwarded `disabled`
  // attribute when it is an anchor or a div, and refusing to open leaves its
  // own click handler and an anchor's navigation still to run. Both are
  // cancelled in the capture phase, before the click reaches the trigger.
  const blockDisabledTrigger = disabled && children !== undefined;

  return (
    <div
      className={cn('group relative min-w-0', className)}
      onClickCapture={
        blockDisabledTrigger
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : undefined
      }
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
        <PopoverTrigger
          asChild
          disabled={disabled}
          // An anchor or a div ignores `disabled`, so a custom trigger is
          // told it is disabled in a way assistive technology hears too. The
          // default field is a button, whose `disabled` already says so.
          aria-disabled={children !== undefined && disabled ? true : undefined}
        >
          {children ?? (
            <button
              ref={triggerRef}
              type="button"
              id={id}
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              // No aria-label: the trigger is named by its own text, and an
              // aria-label would override a consumer label (htmlFor or
              // aria-labelledby), so leaving it unset lets that label win.
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy}
              // An error status always marks the field invalid; otherwise the
              // consumer's own aria-invalid stands.
              aria-invalid={status === 'error' ? true : ariaInvalid}
              aria-errormessage={ariaErrorMessage}
              data-status={status}
              className={cn(
                resourcePickerTriggerClassName,
                // Room for the overlaid controls, measured from the slot so a
                // wide adornment never covers the label.
                showTrailing
                  ? 'pr-(--resource-picker-trailing-inset) future:pr-(--resource-picker-trailing-inset)'
                  : 'pr-9 future:pr-9'
              )}
            >
              {icon && (
                // A glyph, so it stays out of the name, which is the value or
                // placeholder alone, whatever title or text the icon carries.
                <span
                  aria-hidden
                  className="grid size-4 shrink-0 place-items-center text-foreground-muted"
                >
                  {icon}
                </span>
              )}
              <span
                id={valueId}
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
          // A nonempty search is spared the dismiss, and left to clear itself
          // first.
          onEscapeKeyDown={keepResourceSearchOnEscape}
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
              onClick={() => {
                onClear?.();
                // Clearing unmounts this control, which would drop focus to
                // the body, so it is handed back to the field it cleared.
                triggerRef.current?.focus();
              }}
            >
              <X size={11} />
            </button>
          )}
          {showAdornment && (
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
