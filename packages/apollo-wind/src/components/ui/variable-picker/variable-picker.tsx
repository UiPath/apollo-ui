'use client';

import { Braces, ChevronDown, SquareArrowRightEnter } from 'lucide-react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';

export interface VariablePickerItem {
  id: string;
  label: string;
  value?: string;
  children?: VariablePickerItem[];
  disabled?: boolean;
  /** Branches are selectable when this is true or when they provide a value. */
  selectable?: boolean;
  icon?: ReactNode;
  /** Consumer-defined type name. Known primitive types use the standard compact badge. */
  type?: string;
  /** Optional content rendered at the trailing edge, such as a type label or status chip. */
  trailingAdornment?: ReactNode;
  metadata?: unknown;
}

const TYPE_LABEL: Record<string, string> = {
  string: 'T',
  number: '#',
  boolean: '?',
  object: '{}',
  array: '[]',
  null: '∅',
};

function VariableTypeBadge({ item }: { item: VariablePickerItem }) {
  const type = item.type ?? (item.children?.length ? 'object' : 'string');
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded border border-border bg-surface-overlay px-0.5 font-mono text-[9px] font-semibold leading-none text-foreground-muted [&_svg]:size-2.75"
    >
      {item.icon ?? TYPE_LABEL[type] ?? type}
    </span>
  );
}

export interface VariablePickerContentProps {
  items: VariablePickerItem[];
  onSelect: (item: VariablePickerItem) => void;
  placeholder?: string;
  emptyText?: string;
  query?: string;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  defaultExpandedIds?: Iterable<string>;
  insertLabel?: string;
  className?: string;
}

export interface VariablePickerProps extends VariablePickerContentProps {
  /** A single element that Radix can use as the popover trigger. */
  children?: ReactElement;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  triggerAriaLabel?: string;
}

function itemMatches(item: VariablePickerItem, normalizedQuery: string): boolean {
  return (
    item.label.toLowerCase().includes(normalizedQuery) ||
    item.value?.toLowerCase().includes(normalizedQuery) === true
  );
}

/** Keeps a matching parent's complete subtree and otherwise retains matching descendant paths. */
function filterItems(items: VariablePickerItem[], query: string): VariablePickerItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.flatMap((item) => {
    if (itemMatches(item, normalizedQuery)) return [item];
    const children = filterItems(item.children ?? [], normalizedQuery);
    return children.length ? [{ ...item, children }] : [];
  });
}

function VariableRows({
  items,
  filtering,
  expandedIds,
  onToggle,
  onSelect,
  insertLabel,
  depth = 0,
}: {
  items: VariablePickerItem[];
  filtering: boolean;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (item: VariablePickerItem) => void;
  insertLabel: string;
  depth?: number;
}) {
  return items.map((item) => {
    const hasChildren = !!item.children?.length;
    const selectable = item.selectable ?? (!hasChildren || item.value !== undefined);
    const expanded = filtering || expandedIds.has(item.id);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!hasChildren || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      const shouldExpand = event.key === 'ArrowRight';
      if (expandedIds.has(item.id) !== shouldExpand) onToggle(item.id);
      event.preventDefault();
    };

    return (
      <div key={item.id} role="none">
        <CommandItem
          value={item.id}
          aria-label={item.label}
          disabled={item.disabled}
          onKeyDown={handleKeyDown}
          onSelect={() => (hasChildren ? onToggle(item.id) : selectable && onSelect(item))}
          data-expanded={hasChildren ? expanded : undefined}
          className="group min-h-0 gap-2 rounded-none py-1 pr-3.5 text-xs hover:bg-surface-overlay data-[selected=true]:bg-surface-overlay data-[selected=true]:text-foreground"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {hasChildren ? (
            <span className="grid size-3 shrink-0 place-items-center">
              <ChevronDown
                size={10}
                className={cn(
                  '!size-2.5 text-foreground-subtle transition-transform duration-100',
                  !expanded && '-rotate-90'
                )}
              />
            </span>
          ) : (
            <span className="size-3 shrink-0" />
          )}
          <VariableTypeBadge item={item} />
          <span className="min-w-0 flex-1 truncate font-mono text-foreground">{item.label}</span>
          {item.trailingAdornment}
          {selectable && (
            <button
              type="button"
              aria-label={`${insertLabel}: ${item.label}`}
              disabled={item.disabled}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item);
              }}
              className="grid size-5 shrink-0 place-items-center text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 group-data-[selected=true]:opacity-100 focus-visible:opacity-100"
            >
              <SquareArrowRightEnter className="!size-3.5" />
            </button>
          )}
        </CommandItem>
        {hasChildren && expanded && (
          <VariableRows
            items={item.children!}
            filtering={filtering}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onSelect={onSelect}
            insertLabel={insertLabel}
            depth={depth + 1}
          />
        )}
      </div>
    );
  });
}

/** Search and tree content for embedding in a consumer-owned popover or caret-anchored surface. */
export function VariablePickerContent({
  items,
  onSelect,
  placeholder = 'Search variables...',
  emptyText = 'No variables found.',
  query: controlledQuery,
  initialQuery = '',
  onQueryChange,
  defaultExpandedIds,
  insertLabel = 'Insert variable',
  className,
}: VariablePickerContentProps) {
  const [uncontrolledQuery, setUncontrolledQuery] = useState(initialQuery);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? items.slice(0, 1).map((item) => item.id))
  );
  const query = controlledQuery ?? uncontrolledQuery;
  const filteredItems = useMemo(() => filterItems(items, query), [items, query]);

  const setQuery = (nextQuery: string) => {
    if (controlledQuery === undefined) setUncontrolledQuery(nextQuery);
    onQueryChange?.(nextQuery);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Command shouldFilter={false} className={className}>
      <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} autoFocus />
      <CommandList className="max-h-72 bg-surface-overlay/40 py-1.5">
        {filteredItems.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
        {filteredItems.length > 0 && (
          <VariableRows
            items={filteredItems}
            filtering={query.trim().length > 0}
            expandedIds={expandedIds}
            onToggle={toggleExpanded}
            onSelect={onSelect}
            insertLabel={insertLabel}
          />
        )}
      </CommandList>
    </Command>
  );
}

/** Popover-wrapped convenience picker for inserting a variable into a consumer-owned value. */
export function VariablePicker({
  children,
  align = 'end',
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  triggerLabel = 'Insert',
  triggerAriaLabel = 'Insert variable',
  className,
  onSelect,
  ...contentProps
}: VariablePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const selectItem = (item: VariablePickerItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children ?? (
          <button
            type="button"
            aria-label={triggerAriaLabel}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Braces size={12} />
            <span>{triggerLabel}</span>
            <ChevronDown size={9} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn('w-[280px] max-w-[calc(100vw-1rem)] overflow-hidden p-0', className)}
      >
        <VariablePickerContent {...contentProps} onSelect={selectItem} />
      </PopoverContent>
    </Popover>
  );
}
