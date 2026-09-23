'use client';

import { FolderOpen, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FolderBreadcrumb } from './components/folder-breadcrumb';
import { FolderPickerEmptyState } from './components/folder-picker-empty-state';
import { FolderPickerFooter } from './components/folder-picker-footer';
import { FolderPickerSearch } from './components/folder-picker-search';
import { FolderRow } from './components/folder-row';
import type { FolderPickerContentProps, FolderPickerEntry, FolderPickerProps } from './types';
import { cacheKey, joinPath } from './types';

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
  initialSearch = '',
  emptyText = 'No subfolders.',
  loadingText = 'Loading…',
  listLabel = 'Folders',
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
  const [search, setSearch] = useState(initialSearch);
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
      // Every navigation claims a request id, cached or not, so an earlier
      // in-flight load is abandoned rather than allowed to resolve later and
      // drag the view back to the folder the user has already left.
      const requestId = ++requestRef.current;

      if (levels[key]) {
        setLoadingPath(null);
        setError(null);
        setPathStack(segments);
        return;
      }

      setLoadingPath(joinPath(segments));
      setError(null);
      try {
        const entries = await onLoadChildren(segments);
        if (!mountedRef.current || requestRef.current !== requestId) return;
        setLevels((current) => ({ ...current, [key]: entries }));
        setPathStack(segments);
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

  /**
   * Moving to another level drops the draft and the filter, both of which
   * described the level being left. `loadLevel` itself does not clear the
   * search, so an `initialSearch` survives the content's first fetch.
   */
  const navigateTo = (segments: string[]) => {
    setDraft(null);
    setSearch('');
    void loadLevel(segments);
  };

  const effectiveSelection = draft ?? (pathStack.length > 0 ? joinPath(pathStack) : null);
  const currentKey = cacheKey(pathStack);
  const entries = levels[currentKey] ?? [];
  /** The level on screen has never resolved, so its rows are still unknown. */
  const isLoadingCurrentLevel = loadingPath !== null && !(currentKey in levels);
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
      <FolderBreadcrumb crumbs={crumbs} onJump={navigateTo} />

      <FolderPickerSearch value={search} onChange={setSearch} placeholder={searchPlaceholder} />

      <div
        className="max-h-56 min-h-0 flex-1 overflow-y-auto py-1"
        // A tree, not a listbox: listbox options are atomic to assistive
        // technology, so the per-row Open control would be hidden or would
        // fight the option for focus. `treeitem` supports both a selectable
        // row and a control that opens it.
        role="tree"
        aria-label={listLabel}
        aria-busy={isLoadingCurrentLevel || undefined}
        tabIndex={-1}
      >
        {visibleEntries.length === 0 && (
          <FolderPickerEmptyState
            error={error}
            loading={isLoadingCurrentLevel}
            query={search.trim()}
            emptyText={emptyText}
            loadingText={loadingText}
          />
        )}
        {/* A failed drill keeps the previous list visible under the error,
            so the user is not stranded on an empty popover. */}
        {error && visibleEntries.length > 0 && (
          <div className="px-3 py-2 text-xs text-destructive">{error}</div>
        )}
        {visibleEntries.map((entry) => {
          const segments = [...pathStack, entry.name];
          const fullPath = joinPath(segments);
          const isSelected = draft === fullPath;

          return (
            <FolderRow
              key={entry.name}
              entry={entry}
              selected={isSelected}
              loading={loadingPath === fullPath}
              onToggleSelect={() => setDraft(isSelected ? null : fullPath)}
              onOpen={() => navigateTo(segments)}
            />
          );
        })}
      </div>

      <FolderPickerFooter
        leading={footerLeading}
        onCancel={onCancel}
        onSelect={() => effectiveSelection && onSelect(effectiveSelection)}
        selectDisabled={!effectiveSelection}
        cancelLabel={cancelLabel}
        selectLabel={selectLabel}
      />
    </div>
  );
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
        {/* `disabled` on the trigger, as VariablePicker does, so a custom
            child is inert too and not only the default field. */}
        <PopoverTrigger asChild disabled={disabled}>
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

      {/* Overlaid at the field's trailing edge rather than left in normal flow,
          where an adornment would sit beside the field or wrap to its own line.
          The trigger reserves this room with its `pr-9`. */}
      {(trailingAdornment || (clearable && value && !disabled && !children)) && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-0.5">
          {clearable && value && !disabled && !children && (
            <button
              type="button"
              aria-label={clearAriaLabel}
              className="pointer-events-auto grid size-4 cursor-pointer place-items-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onSelect('')}
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
  FolderPickerContentProps,
  FolderPickerEntry,
  FolderPickerLoadChildren,
  FolderPickerProps,
} from './types';
