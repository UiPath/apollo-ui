'use client';

import { Check, ChevronRight, Folder, FolderOpen, Search, X } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib';

export interface FolderPickerEntry {
  /** Segment name as it appears in the path. Unique among its siblings. */
  name: string;
  /** Row label. Defaults to `name`. */
  label?: string;
  /** False marks a known leaf, which hides its open affordance. Unknown by default. */
  hasChildren?: boolean;
  disabled?: boolean;
  metadata?: unknown;
}

/**
 * Loads one level of the tree. The root is requested with an empty path.
 * Resolved levels are cached, so navigating back up does not re-request.
 */
export type FolderPickerLoadChildren = (path: string[]) => Promise<FolderPickerEntry[]>;

const joinPath = (segments: string[]) => `/${segments.join('/')}`;
const cacheKey = (segments: string[]) => segments.join('/');

export interface FolderPickerContentProps {
  /** Loads a level of the tree. Called for the root when the content mounts. */
  onLoadChildren: FolderPickerLoadChildren;
  /** Confirms a folder path, such as `/Finance/Invoices`. */
  onSelect: (path: string) => void;
  /** Closes the surface without confirming. */
  onCancel?: () => void;
  /** Browsing resumes at this path's parent, with the path itself highlighted. */
  initialPath?: string;
  /** Label for the breadcrumb's first segment. */
  rootLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Content for the footer's leading slot, such as a count or an "Add new" link. */
  footerLeading?: ReactNode;
  cancelLabel?: string;
  selectLabel?: string;
  className?: string;
}

/**
 * Browsing surface for embedding in a consumer-owned popover, dialog or sheet.
 *
 * Follows the platform chooser convention: a single click highlights a row as
 * the pending selection, a double click or the trailing chevron opens it, the
 * breadcrumb jumps back up, and the footer confirms. With nothing highlighted,
 * Select confirms the folder currently being browsed, so a folder can be chosen
 * by opening it. At the root with no highlight there is nothing valid to
 * confirm and Select is disabled.
 */
export function FolderPickerContent({
  onLoadChildren,
  onSelect,
  onCancel,
  initialPath,
  rootLabel = 'Root',
  searchPlaceholder = 'Search...',
  emptyText = 'No subfolders.',
  footerLeading,
  cancelLabel = 'Cancel',
  selectLabel = 'Select',
  className,
}: FolderPickerContentProps) {
  const initialSegments = useMemo(
    () => (initialPath ?? '').split('/').filter(Boolean),
    [initialPath]
  );

  const [pathStack, setPathStack] = useState<string[]>(() => initialSegments.slice(0, -1));
  const [draft, setDraft] = useState<string | null>(initialPath || null);
  const [search, setSearch] = useState('');
  /** Resolved levels, keyed by path. Keeps the current list visible during a drill. */
  const [levels, setLevels] = useState<Record<string, FolderPickerEntry[]>>({});
  /** Path of the folder being opened. Its row shows a spinner in place of the chevron. */
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Guards against a resolved request for a level the user has already navigated away from. */
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadLevel = useCallback(
    async (segments: string[]) => {
      const key = cacheKey(segments);
      if (levels[key]) {
        setPathStack(segments);
        setSearch('');
        return;
      }

      const requestId = ++requestRef.current;
      setLoadingPath(joinPath(segments));
      setError(null);
      try {
        const entries = await onLoadChildren(segments);
        if (!mountedRef.current || requestRef.current !== requestId) return;
        setLevels((current) => ({ ...current, [key]: entries }));
        setPathStack(segments);
        setSearch('');
      } catch (cause) {
        if (!mountedRef.current || requestRef.current !== requestId) return;
        setError(cause instanceof Error ? cause.message : 'Could not load this folder.');
      } finally {
        if (mountedRef.current && requestRef.current === requestId) setLoadingPath(null);
      }
    },
    [levels, onLoadChildren]
  );

  /**
   * Fetches whichever level the content opens on. The ref latches after the
   * first run so a new `loadLevel` identity, which changes on every resolved
   * level, cannot re-trigger the initial fetch.
   */
  const initialStack = useRef(pathStack);
  const didLoadInitial = useRef(false);
  useEffect(() => {
    if (didLoadInitial.current) return;
    didLoadInitial.current = true;
    void loadLevel(initialStack.current);
  }, [loadLevel]);

  const drillInto = (segments: string[]) => {
    setDraft(null);
    void loadLevel(segments);
  };

  /** Jumping up abandons any in-flight drill so it cannot navigate into the discarded folder. */
  const jumpTo = (segments: string[]) => {
    requestRef.current++;
    setLoadingPath(null);
    setError(null);
    setPathStack(segments);
    setSearch('');
  };

  const effectiveSelection = draft ?? (pathStack.length > 0 ? joinPath(pathStack) : null);
  const entries = levels[cacheKey(pathStack)] ?? [];
  const normalizedQuery = search.trim().toLowerCase();
  const visibleEntries = normalizedQuery
    ? entries.filter((entry) => (entry.label ?? entry.name).toLowerCase().includes(normalizedQuery))
    : entries;

  /** Keyed by the path each crumb jumps to, which is unique down the trail. */
  const crumbs = [
    { key: '/', label: rootLabel, stack: [] as string[] },
    ...pathStack.map((segment, index) => {
      const stack = pathStack.slice(0, index + 1);
      return { key: joinPath(stack), label: segment, stack };
    }),
  ];

  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
      <Breadcrumb className="border-b border-border px-3 py-2">
        <BreadcrumbList className="flex-nowrap gap-0.5 overflow-hidden text-xs sm:gap-0.5">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1;
            return (
              <BreadcrumbItem key={crumb.key} className="min-w-0 gap-0.5">
                {index > 0 && (
                  <BreadcrumbSeparator className="shrink-0 text-foreground-subtle [&>svg]:size-3" />
                )}
                {isCurrent ? (
                  <BreadcrumbPage className="truncate text-xs font-medium text-foreground">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      className="cursor-pointer truncate rounded px-0.5 text-xs text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => jumpTo(crumb.stack)}
                    >
                      {crumb.label}
                    </button>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Matches CommandInput: no field of its own, just a leading magnifier
          and the rule under the row, so the search reads as part of the
          popover rather than as a control sitting inside it. */}
      <div className="flex items-center border-b border-border px-3">
        <Search className="mr-2 size-4 shrink-0 opacity-50" />
        <input
          type="text"
          autoComplete="off"
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(event) => {
            // Escape empties the search before the popover treats it as a
            // dismiss, so a typo is undone without losing the browsed folder.
            if (event.key === 'Escape' && search) {
              event.preventDefault();
              event.stopPropagation();
              setSearch('');
            }
          }}
        />
        {/* Appears only with a value, as the Search field's clear does. */}
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            className="ml-1 grid size-5 shrink-0 cursor-pointer place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-56 min-h-0 flex-1 overflow-y-auto py-1" role="listbox" tabIndex={-1}>
        {error && <div className="px-3 py-2 text-xs text-destructive">{error}</div>}
        {!error && visibleEntries.length === 0 && (
          <div className="px-3 py-2 text-xs text-foreground-muted">
            {normalizedQuery ? `No folders match “${search.trim()}”.` : emptyText}
          </div>
        )}
        {visibleEntries.map((entry) => {
          const segments = [...pathStack, entry.name];
          const fullPath = joinPath(segments);
          const isSelected = draft === fullPath;
          const isLoading = loadingPath === fullPath;
          const label = entry.label ?? entry.name;

          return (
            <div
              key={entry.name}
              role="option"
              aria-selected={isSelected}
              aria-label={label}
              aria-disabled={entry.disabled}
              tabIndex={entry.disabled ? -1 : 0}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground transition-colors',
                entry.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-surface-overlay',
                isSelected && 'bg-surface-overlay'
              )}
              onClick={() => !entry.disabled && setDraft(isSelected ? null : fullPath)}
              onDoubleClick={() => !entry.disabled && drillInto(segments)}
              onKeyDown={(event) => {
                if (entry.disabled) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setDraft(isSelected ? null : fullPath);
                } else if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  drillInto(segments);
                }
              }}
            >
              <span className="grid size-3.5 shrink-0 place-items-center">
                {isSelected && <Check className="size-3.5 text-foreground" strokeWidth={3} />}
              </span>
              <Folder size={14} className="shrink-0 text-foreground-muted" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {isLoading ? (
                <span className="grid size-5 shrink-0 place-items-center">
                  <Spinner className="size-3.5" />
                </span>
              ) : (
                entry.hasChildren !== false && (
                  <button
                    type="button"
                    aria-label={`Open ${label}`}
                    disabled={entry.disabled}
                    className="grid size-5 shrink-0 cursor-pointer place-items-center rounded text-foreground-muted transition-colors hover:bg-surface-overlay hover:text-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      drillInto(segments);
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* The commit pair sits in the same place and carries the same name across
          every picker that holds a draft. "Select" finishes choosing a value;
          "Apply" would belong on a form that has been edited. */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-1">{footerLeading}</div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="xs" type="button" className="h-7" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="default"
            size="xs"
            type="button"
            className="h-7"
            disabled={!effectiveSelection}
            onClick={() => effectiveSelection && onSelect(effectiveSelection)}
          >
            {selectLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface FolderPickerProps
  extends Omit<FolderPickerContentProps, 'onCancel' | 'initialPath' | 'className'> {
  /** Selected folder path, or an empty string. */
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Hides the field's hover-revealed clear control. */
  clearable?: boolean;
  clearAriaLabel?: string;
  /** A single element Radix can anchor the popover to. Replaces the default field. */
  children?: ReactElement;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rendered inside the field at its trailing edge, such as a field-mode menu. */
  trailingAdornment?: ReactNode;
  contentClassName?: string;
  className?: string;
}

/**
 * Field-and-popover folder picker over a lazily loaded tree.
 *
 * The trigger leads with its icon and then the value, matching the date field,
 * so an empty folder field does not read as bare chrome next to it.
 */
export function FolderPicker({
  value = '',
  placeholder = 'Select a folder…',
  disabled = false,
  clearable = true,
  clearAriaLabel = 'Clear folder',
  children,
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  trailingAdornment,
  contentClassName,
  className,
  onSelect,
  ...contentProps
}: FolderPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  /** Remounts the content per opening so browsing resumes from the current value. */
  const contentKey = open ? value || 'empty' : 'closed';

  return (
    <div className={cn('group relative min-w-0', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children ?? (
            <button
              type="button"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={open}
              // Mirrors SelectTrigger, including its `future:` overrides, so a
              // folder field and a select field in the same panel are one control.
              className={cn(
                'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent pl-3 pr-9 text-left text-base transition-colors md:text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:font-normal future:hover:bg-surface-hover'
              )}
            >
              <FolderOpen size={16} className="shrink-0 text-foreground-muted" />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  value ? 'text-foreground' : 'text-foreground-subtle'
                )}
              >
                {value || placeholder}
              </span>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={4}
          className={cn(
            'w-[--radix-popover-trigger-width] min-w-72 overflow-hidden p-0',
            contentClassName
          )}
        >
          <FolderPickerContent
            key={contentKey}
            {...contentProps}
            initialPath={value}
            onCancel={() => setOpen(false)}
            onSelect={(path) => {
              onSelect(path);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {clearable && value && !disabled && !children && (
        <button
          type="button"
          aria-label={clearAriaLabel}
          className="absolute inset-y-0 right-2 my-auto grid size-4 cursor-pointer place-items-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onSelect('')}
        >
          <X size={11} />
        </button>
      )}
      {trailingAdornment}
    </div>
  );
}
