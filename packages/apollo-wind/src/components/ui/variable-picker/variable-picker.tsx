'use client';

import { Braces, ChevronDown, SquareArrowRightEnter } from 'lucide-react';
import type { ReactNode } from 'react';
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
  icon?: ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  metadata?: unknown;
}

const TYPE_LABEL: Record<NonNullable<VariablePickerItem['type']>, string> = {
  string: 'T',
  number: '#',
  boolean: '?',
  object: '{}',
  array: '[]',
  null: '∅',
};

function VariableTypeBadge({ item }: { item: VariablePickerItem }) {
  const label = TYPE_LABEL[item.type ?? (item.children?.length ? 'object' : 'string')];
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded border border-border bg-surface-overlay px-0.5 font-mono text-[9px] font-semibold leading-none text-foreground-muted [&_svg]:size-2.75"
    >
      {item.icon ?? label}
    </span>
  );
}

export interface VariablePickerProps {
  items: VariablePickerItem[];
  onSelect: (item: VariablePickerItem) => void;
  children?: ReactNode;
  placeholder?: string;
  emptyText?: string;
  align?: 'start' | 'center' | 'end';
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function matchesItem(item: VariablePickerItem, query: string): boolean {
  if (!query) return true;
  const normalizedQuery = query.toLowerCase();
  return (
    item.label.toLowerCase().includes(normalizedQuery) ||
    item.value?.toLowerCase().includes(normalizedQuery) === true ||
    item.children?.some((child) => matchesItem(child, query)) === true
  );
}

function VariableRows({
  items,
  query,
  expandedIds,
  onToggle,
  onSelect,
  depth = 0,
}: {
  items: VariablePickerItem[];
  query: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (item: VariablePickerItem) => void;
  depth?: number;
}) {
  return items
    .filter((item) => matchesItem(item, query))
    .map((item) => {
      const hasChildren = !!item.children?.length;
      const expanded = query.length > 0 || expandedIds.has(item.id);

      return (
        <div key={item.id} role="none">
          <CommandItem
            value={`${item.label} ${item.value ?? ''}`}
            disabled={item.disabled}
            onSelect={() => (hasChildren ? onToggle(item.id) : onSelect(item))}
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
            {!hasChildren && (
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100 group-data-[selected=true]:opacity-100"
              >
                <SquareArrowRightEnter className="!size-3.5" />
              </span>
            )}
          </CommandItem>
          {hasChildren && expanded && (
            <VariableRows
              items={item.children!}
              query={query}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </div>
      );
    });
}

/** Searchable, hierarchical picker for inserting a single variable into a consumer-owned value. */
export function VariablePicker({
  items,
  onSelect,
  children,
  placeholder = 'Search variables...',
  emptyText = 'No variables found.',
  align = 'end',
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
}: VariablePickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(items.slice(0, 1).map((item) => item.id))
  );
  const open = controlledOpen ?? uncontrolledOpen;
  const hasMatches = useMemo(() => items.some((item) => matchesItem(item, query)), [items, query]);

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    if (nextOpen) {
      setExpandedIds(new Set(items.slice(0, 1).map((item) => item.id)));
    }
    if (!nextOpen) setQuery('');
    onOpenChange?.(nextOpen);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            aria-label="Insert variable"
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-foreground-subtle transition hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Braces size={12} />
            <span>Insert</span>
            <ChevronDown size={9} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn('w-[280px] max-w-[calc(100vw-1rem)] overflow-hidden p-0', className)}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            autoFocus
          />
          <CommandList className="max-h-72 bg-surface-overlay/40 py-1.5">
            {!hasMatches && <CommandEmpty>{emptyText}</CommandEmpty>}
            {hasMatches && (
              <VariableRows
                items={items}
                query={query}
                expandedIds={expandedIds}
                onToggle={toggleExpanded}
                onSelect={selectItem}
              />
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
