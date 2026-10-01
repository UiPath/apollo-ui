'use client';

import { FolderOpen, X } from 'lucide-react';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FolderBreadcrumb } from './components/folder-breadcrumb';
import { FolderPickerEmptyState } from './components/folder-picker-empty-state';
import { FolderPickerFooter } from './components/folder-picker-footer';
import { FolderPickerSearch } from './components/folder-picker-search';
import { FolderRow } from './components/folder-row';
import type { FolderPickerContentProps, FolderPickerEntry, FolderPickerProps } from './types';
import { cacheKey, isValidSegment, joinPath } from './types';

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
  retryLabel = 'Retry',
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
  /**
   * From the parsed segments, not the raw string, so `/` means the root,
   * which cannot be selected, and `/a//b/` matches the row for `/a/b`.
   */
  const [draft, setDraft] = useState<string | null>(() =>
    initialSegments.length > 0 ? joinPath(initialSegments) : null
  );
  const [search, setSearch] = useState(initialSearch);
  /**
   * Resolved levels, keyed by path. Keeps the current list visible during a
   * drill. A Map, not an object: folder names are arbitrary strings, and one
   * called `constructor` or `toString` would otherwise hit the prototype chain
   * and be read as an already-loaded level whose rows are a function.
   */
  const [levels, setLevels] = useState<Map<string, FolderPickerEntry[]>>(() => new Map());
  /**
   * Path of the folder being opened. Its row shows a spinner in place of the
   * chevron. Starts on the level the content opens on, so the first render,
   * and a server render, reads as loading rather than as an empty folder.
   */
  const [loadingPath, setLoadingPath] = useState<string | null>(() =>
    joinPath(initialSegments.slice(0, -1))
  );
  const [error, setError] = useState<string | null>(null);
  /**
   * Roving focus: the tree is a single tab stop, and the arrow keys move
   * between rows. Tracked by name, not index, so it survives filtering.
   */
  const [activeName, setActiveName] = useState<string | null>(
    () => initialSegments[initialSegments.length - 1] ?? null
  );
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  /** The scrolling region around the tree, and focus's fallback when it has no rows. */
  const listRef = useRef<HTMLDivElement>(null);
  /** Set when a row or crumb navigates, so focus follows into the level it loads. */
  const focusAfterNavigateRef = useRef(false);
  /**
   * The row to make active again if a navigation fails and the old level stays
   * on screen: the folder that was being opened, or the row active before.
   */
  const restoreActiveRef = useRef<string | null>(null);

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
    async (segments: string[], { keepDraft = false }: { keepDraft?: boolean } = {}) => {
      const key = cacheKey(segments);
      // Every navigation claims a request id, cached or not, so an earlier
      // in-flight load is abandoned rather than allowed to resolve later and
      // drag the view back to the folder the user has already left.
      const requestId = ++requestRef.current;

      if (levels.has(key)) {
        setLoadingPath(null);
        setError(null);
        setPathStack(segments);
        return;
      }

      setLoadingPath(joinPath(segments));
      setError(null);
      try {
        const loaded = await onLoadChildren(segments);
        if (!mountedRef.current || requestRef.current !== requestId) return;
        // A `/` in a name would make `['a/b']` and `['a', 'b']` the same path,
        // and the consumer could not tell from `onSelect` which one was meant.
        // A repeated name is the same path twice, so only its first entry is
        // kept, or the rows would share a key, a selection and a focus target.
        const seen = new Set<string>();
        const entries = loaded.filter((entry) => {
          if (!isValidSegment(entry.name) || seen.has(entry.name)) return false;
          seen.add(entry.name);
          return true;
        });
        if (entries.length < loaded.length) {
          console.warn(
            'FolderPicker: dropped entries whose name is empty, contains "/" or repeats a sibling, which paths cannot represent.'
          );
        }
        setLevels((current) => new Map(current).set(key, entries));
        setPathStack(segments);
        // The old level stays on screen and clickable while the request is in
        // flight, so a row highlighted there would otherwise ride along into
        // the new level and be confirmed in place of the folder now shown.
        // Only the first fetch keeps its draft, which is the `initialPath`,
        // and only while that folder is still listed and selectable. A stale
        // path would otherwise stay confirmable with no row highlighted.
        if (keepDraft) {
          setDraft((current) =>
            entries.some(
              (entry) => !entry.disabled && joinPath([...segments, entry.name]) === current
            )
              ? current
              : null
          );
        } else {
          // The search can be typed into the old level mid-request too, and
          // describes that level, not the one just opened.
          setDraft(null);
          setSearch('');
        }
      } catch (cause) {
        if (!mountedRef.current || requestRef.current !== requestId) return;
        // Nothing is listed to vouch for the initial path, so it cannot stay
        // confirmable behind the error.
        if (keepDraft) setDraft(null);
        // An empty message would read as success to every check downstream.
        setError(
          cause instanceof Error && cause.message ? cause.message : 'Could not load this folder.'
        );
        // The old level stays on screen, so focus returns to the folder that
        // reported the error rather than to the level's first row.
        setActiveName(restoreActiveRef.current);
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
    void loadLevel(initialStack.current, { keepDraft: true });
  }, [loadLevel]);

  /**
   * Moving to another level drops the draft and the filter, both of which
   * described the level being left. `loadLevel` itself does not clear the
   * search, so an `initialSearch` survives the content's first fetch. It
   * drops the draft a second time when an uncached level resolves.
   */
  const navigateTo = (segments: string[]) => {
    setDraft(null);
    setSearch('');
    // Going up lands on the folder just left, as Left does in a file tree.
    // Going down starts on the new level's first row.
    const isAncestor = segments.every((segment, index) => pathStack[index] === segment);
    const isChild =
      segments.length === pathStack.length + 1 &&
      pathStack.every((segment, index) => segments[index] === segment);
    restoreActiveRef.current = isChild ? segments[segments.length - 1] : activeName;
    setActiveName(isAncestor ? (pathStack[segments.length] ?? null) : null);
    void loadLevel(segments);
  };

  const effectiveSelection = draft ?? (pathStack.length > 0 ? joinPath(pathStack) : null);
  const currentKey = cacheKey(pathStack);
  const entries = levels.get(currentKey) ?? [];
  /** The level on screen has never resolved, so its rows are still unknown. */
  const isLoadingCurrentLevel = loadingPath !== null && !levels.has(currentKey);
  /**
   * An error belongs to the level on screen only when that level never
   * resolved. Over a cached level it reports a failed drill, which stays an
   * inline alert however the search filters the rows.
   */
  const levelError = levels.has(currentKey) ? null : error;
  const drillError = levels.has(currentKey) ? error : null;
  const normalizedQuery = search.trim().toLowerCase();
  const visibleEntries = normalizedQuery
    ? entries.filter((entry) => (entry.label ?? entry.name).toLowerCase().includes(normalizedQuery))
    : entries;
  const focusableEntries = visibleEntries.filter((entry) => !entry.disabled);
  const activeEntryName =
    focusableEntries.find((entry) => entry.name === activeName)?.name ??
    focusableEntries[0]?.name ??
    null;

  /**
   * The row that opened a folder unmounts once the new level arrives, which
   * would drop focus on the body. Hand it to the new level's active row, or to
   * the tree itself when the level is empty.
   *
   * Only when focus was lost with the old row or crumb, or is still in the
   * tree. A user who moved to the search or the footer during a slow load
   * keeps their place.
   */
  useEffect(() => {
    if (!focusAfterNavigateRef.current || loadingPath !== null) return;
    focusAfterNavigateRef.current = false;
    const tree = listRef.current;
    const focused = tree?.ownerDocument.activeElement;
    const focusLost = !focused || focused === tree?.ownerDocument.body;
    if (!focusLost && !tree?.contains(focused)) return;
    const row = activeEntryName === null ? undefined : rowRefs.current.get(activeEntryName);
    (row ?? listRef.current)?.focus();
  });

  const focusRow = (name: string) => {
    setActiveName(name);
    rowRefs.current.get(name)?.focus();
  };

  const openFolder = (segments: string[]) => {
    focusAfterNavigateRef.current = true;
    navigateTo(segments);
  };

  /** Up, Down, Home, End and Left. A row handles its own Enter, Space and Right. */
  const handleTreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Rows, or the region itself, which holds focus when a level has no
    // enabled rows and must still offer Left back up and Down into the rows.
    const target = event.target as HTMLElement;
    if (target !== listRef.current && target.getAttribute('role') !== 'treeitem') return;
    // From the region itself, Down and Up both enter at the first row.
    const index =
      target === listRef.current
        ? -1
        : focusableEntries.findIndex((entry) => entry.name === activeEntryName);
    let next: FolderPickerEntry | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = focusableEntries[Math.min(index + 1, focusableEntries.length - 1)];
        break;
      case 'ArrowUp':
        next = focusableEntries[Math.max(index - 1, 0)];
        break;
      case 'Home':
        next = focusableEntries[0];
        break;
      case 'End':
        next = focusableEntries[focusableEntries.length - 1];
        break;
      case 'ArrowLeft':
        if (pathStack.length === 0) return;
        event.preventDefault();
        openFolder(pathStack.slice(0, -1));
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) focusRow(next.name);
  };

  /** Keyed by the path each crumb jumps to, which is unique down the trail. */
  const crumbs = [
    { key: '/', label: rootLabel, stack: [] as string[] },
    ...pathStack.map((segment, index) => {
      const stack = pathStack.slice(0, index + 1);
      // The row's label, from the parent level, so a folder whose `name` is
      // an id reads the same in the trail as it did in the list. A parent
      // never fetched, above an `initialPath`, falls back to the name.
      const parent = levels.get(cacheKey(pathStack.slice(0, index)));
      const label = parent?.find((entry) => entry.name === segment)?.label ?? segment;
      return { key: joinPath(stack), label, stack };
    }),
  ];

  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden', className)}>
      {/* Through `openFolder`, as the clicked crumb becomes the non-focusable
          current page and focus would otherwise fall to the document. */}
      <FolderBreadcrumb crumbs={crumbs} onJump={openFolder} />

      <FolderPickerSearch value={search} onChange={setSearch} placeholder={searchPlaceholder} />

      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset groups form controls; this is a scrolling region around a tree. */}
      <div
        ref={listRef}
        // A named group, as it takes focus when a level has no rows and
        // answers the tree's keys there.
        role="group"
        aria-label={listLabel}
        tabIndex={-1}
        // Visible when it is the focus fallback for a level with no rows.
        className="max-h-56 min-h-0 flex-1 overflow-y-auto py-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onKeyDown={handleTreeKeyDown}
      >
        {/* Messages sit beside the tree, not in it: a tree may own only
            treeitems and groups, and text inside a composite widget may go
            unread. */}
        {visibleEntries.length === 0 && (
          <FolderPickerEmptyState
            error={levelError}
            loading={isLoadingCurrentLevel}
            query={search.trim()}
            emptyText={emptyText}
            loadingText={loadingText}
            retryLabel={retryLabel}
            // Only a level that never resolved shows its error here, so this
            // requests the level on screen again.
            onRetry={() => void loadLevel(pathStack)}
          />
        )}
        {/* A failed drill keeps the previous list visible under the error,
            so the user is not stranded on an empty popover. */}
        {drillError && (
          <div role="alert" className="px-3 py-2 text-xs text-destructive">
            {drillError}
          </div>
        )}
        {/* Rendered while it has rows, or while loading, which `aria-busy`
            excuses. An empty tree would break the ownership rule above. */}
        {(visibleEntries.length > 0 || isLoadingCurrentLevel) && (
          <div
            // A tree, not a listbox: listbox options are atomic to assistive
            // technology, so the per-row Open control would be hidden or would
            // fight the option for focus. `treeitem` supports both a selectable
            // row and a control that opens it.
            role="tree"
            aria-label={listLabel}
            aria-busy={isLoadingCurrentLevel || undefined}
          >
            {visibleEntries.map((entry) => {
              const segments = [...pathStack, entry.name];
              const fullPath = joinPath(segments);
              const isSelected = draft === fullPath;

              return (
                <FolderRow
                  key={entry.name}
                  entry={entry}
                  // Only the browsed level is rendered, so the depth is stated
                  // rather than inferred from nesting, which would read as 1.
                  level={pathStack.length + 1}
                  selected={isSelected}
                  active={entry.name === activeEntryName}
                  loading={loadingPath === fullPath}
                  rowRef={(node) => {
                    if (node) rowRefs.current.set(entry.name, node);
                    else rowRefs.current.delete(entry.name);
                  }}
                  onFocus={() => setActiveName(entry.name)}
                  onToggleSelect={() => setDraft(isSelected ? null : fullPath)}
                  onOpen={() => openFolder(segments)}
                />
              );
            })}
          </div>
        )}
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
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  onSelect,
  ...contentProps
}: FolderPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  /**
   * Forced closed while disabled, so a picker disabled mid-browse, or handed
   * `open` alongside `disabled`, cannot keep a surface that confirms.
   */
  const requestedOpen = controlledOpen ?? uncontrolledOpen;
  const open = requestedOpen && !disabled;

  // Drops the uncontrolled state too, so re-enabling does not bring the old
  // surface back, and tells a controlling parent the picker has closed.
  const closedByDisable = disabled && requestedOpen;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires on the transition into disabled-while-open only; a new `onOpenChange` identity must not re-notify.
  useEffect(() => {
    if (!closedByDisable) return;
    setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [closedByDisable]);
  const contentRef = useRef<HTMLDivElement>(null);
  const trailingRef = useRef<HTMLSpanElement>(null);
  /** Width of the controls overlaid at the field's trailing edge, or 0. */
  const [trailingWidth, setTrailingWidth] = useState(0);
  const showClear = clearable && Boolean(value) && !disabled && !children;
  /**
   * Both controls belong to the default field. A custom trigger owns its own
   * layout, and an overlay positioned against the wrapper would land on it.
   */
  const showAdornment = Boolean(trailingAdornment) && !children;
  const hasTrailing = showAdornment || showClear;

  /**
   * The overlay's width depends on the adornment, so the trigger measures it
   * rather than assuming a fixed reservation that a menu button would overrun.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-runs when the overlay mounts or unmounts, which the ref alone does not signal.
  useLayoutEffect(() => {
    const el = trailingRef.current;
    if (!el) {
      setTrailingWidth(0);
      return;
    }
    setTrailingWidth(el.offsetWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setTrailingWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTrailing]);

  const setOpen = (nextOpen: boolean) => {
    // The trigger's `disabled` only binds native controls, so a slotted link
    // or custom element could still ask to open. Refuse it here as well.
    if (nextOpen && disabled) return;
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

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
              id={id}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              aria-haspopup="dialog"
              aria-expanded={open}
              // Clears the overlaid controls: their width, the overlay's
              // `right-2` and a gap matching the leading padding.
              style={trailingWidth > 0 ? { paddingRight: trailingWidth + 20 } : undefined}
              // Mirrors SelectTrigger, including its `future:` overrides, so a
              // folder field and a select field in the same panel are one control.
              className={cn(
                'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent pl-3 pr-3 text-left text-base transition-colors md:text-sm',
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
            'w-(--radix-popover-trigger-width) min-w-72 overflow-hidden p-0',
            contentClassName
          )}
          ref={contentRef}
          // Opening lands in the search, so typing filters straight away.
          // Radix would otherwise take the first focusable element, which is
          // the breadcrumb above it.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.querySelector<HTMLInputElement>('input')?.focus();
          }}
          // Radix hears Escape in the capture phase, before the search input's
          // own handler, so the input cannot stop the dismissal itself. With
          // text in the search, Escape clears it and the popover stays open.
          onEscapeKeyDown={(event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement && target.value) event.preventDefault();
          }}
        >
          {/* Radix unmounts the content once closed and mounts it afresh on the
              next opening, so browsing resumes from the current value without a
              key. A key that changed on close would remount it mid exit
              animation and fire another load. */}
          <FolderPickerContent
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
          The trigger measures it and pads its text clear of it. */}
      {hasTrailing && (
        <span
          ref={trailingRef}
          className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-0.5"
        >
          {showClear && (
            <button
              type="button"
              aria-label={clearAriaLabel}
              className="pointer-events-auto grid size-4 cursor-pointer place-items-center rounded text-foreground-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onSelect('')}
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
  FolderPickerContentProps,
  FolderPickerEntry,
  FolderPickerLoadChildren,
  FolderPickerProps,
} from './types';
