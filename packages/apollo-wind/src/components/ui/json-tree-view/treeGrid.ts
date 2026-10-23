import {
  createContext,
  type FocusEvent,
  type KeyboardEvent,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { appendPathSegment, type FlatJsonTreeRow } from './buildJsonTree';
import type { PathSegment } from './JsonTree.types';

/**
 * The tree's keyboard model, the APG treegrid pattern: one Tab stop for the
 * whole tree, arrows between rows and across a row's controls.
 */

/** `useLayoutEffect` in the browser, `useEffect` on the server (avoids React's SSR warning). */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The cells every row renders, in reading order. Up/Down keeps focus in the same one. */
export type TreeGridCell = 'name' | 'value' | 'actions' | 'detail';

/** Marks an open editor. It owns its arrow keys. */
export const EDITOR_ATTR = 'data-json-tree-editor';
/** Marks a control arrows and Tab skip (the chevron: the row carries expansion). */
export const SKIP_ATTR = 'data-json-tree-skip';
/** Set on a control the tree took out of the Tab order, holding the tabindex to restore. */
const MANAGED_ATTR = 'data-json-tree-tabindex';

const ROW_SELECTOR = '[role="row"]';
const GRID_SELECTOR = '[role="treegrid"]';
const CONTROL_SELECTOR =
  'button, a[href], input, select, textarea, [contenteditable="true"], [tabindex]:not([role="gridcell"])';
// Arrow keys move a caret or pick a value in these, so the tree leaves them alone.
const TEXT_ENTRY_SELECTOR = `input, textarea, select, [contenteditable="true"], [${EDITOR_ATTR}]`;
const HANDLED_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  'Enter',
]);
const PAGE_SIZE = 10;

/**
 * Whether the row holding a tree may take the Tab stop. A tree rendered inside
 * another tree's row stays out of the Tab order while that row isn't the outer
 * tree's stop, so the outer tree remains a single Tab stop.
 */
export const TreeGridTabbableContext = createContext(true);

/** The grid's own row around `element`, skipping rows of trees nested inside it. */
function ownRowOf(grid: HTMLElement, element: Element): HTMLElement | null {
  let row = element.closest<HTMLElement>(ROW_SELECTOR);
  while (row && row.closest(GRID_SELECTOR) !== grid) {
    row = row.parentElement?.closest<HTMLElement>(ROW_SELECTOR) ?? null;
  }
  return row;
}

function ownRows(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
    (row) => row.closest(GRID_SELECTOR) === grid
  );
}

/** A control or cell belongs to the row it sits in directly, not to an outer row around a nested tree. */
function ownedBy(row: HTMLElement, element: Element): boolean {
  return element.closest(ROW_SELECTOR) === row;
}

function isNavigable(element: HTMLElement): boolean {
  return (
    !element.hasAttribute('disabled') &&
    !element.closest(`[${EDITOR_ATTR}], [${SKIP_ATTR}], [aria-hidden="true"]`)
  );
}

function cellsOf(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>('[role="gridcell"]')).filter((cell) =>
    ownedBy(row, cell)
  );
}

/**
 * A cell's arrow-key stops: its own controls, or the cell itself when it holds
 * only text. A nested tree's controls belong to that tree, reached with Tab.
 */
function stopsOf(row: HTMLElement, cell: HTMLElement): HTMLElement[] {
  const controls = Array.from(cell.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)).filter(
    (control) => ownedBy(row, control) && isNavigable(control)
  );
  if (controls.length > 0) return controls;
  return cell.textContent?.trim() ? [cell] : [];
}

function rowStops(row: HTMLElement): HTMLElement[] {
  return cellsOf(row).flatMap((cell) => stopsOf(row, cell));
}

function cellNameOf(element: HTMLElement): TreeGridCell | null {
  return (element.closest('[role="gridcell"]') as HTMLElement | null)?.dataset
    .cell as TreeGridCell | null;
}

function findRow(grid: HTMLElement, path: string): HTMLElement | undefined {
  return ownRows(grid).find((row) => row.dataset.path === path);
}

/** Focuses the first stop of `cell` in the row, or the row itself when the cell has none. */
function focusInRow(row: HTMLElement, cell: TreeGridCell | null) {
  const target = cell ? cellsOf(row).find((c) => c.dataset.cell === cell) : undefined;
  const stop = target ? stopsOf(row, target)[0] : undefined;
  (stop ?? row).focus();
}

/**
 * Puts a row's controls in or out of the Tab order: only the Tab stop row's are
 * tabbable, so Tab walks that row and then leaves the tree. Applied to the DOM
 * rather than through props because consumer cells and actions bring their own
 * controls. Each control's own tabindex is kept and restored. A nested tree's
 * controls are left to that tree.
 */
function syncRowTabOrder(row: HTMLElement, tabbable: boolean) {
  for (const control of row.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)) {
    if (!ownedBy(row, control) || control.closest(`[${SKIP_ATTR}]`)) continue;
    const saved = control.getAttribute(MANAGED_ATTR);
    if (tabbable) {
      if (saved === null) continue;
      if (saved === '') control.removeAttribute('tabindex');
      else control.setAttribute('tabindex', saved);
      control.removeAttribute(MANAGED_ATTR);
    } else if (saved === null) {
      control.setAttribute(MANAGED_ATTR, control.getAttribute('tabindex') ?? '');
      control.setAttribute('tabindex', '-1');
    }
  }
}

/** Paths of a node's ancestors, nearest first. */
function ancestorPaths(segments: PathSegment[]): string[] {
  const paths: string[] = [];
  let path = '';
  for (const segment of segments.slice(0, -1)) {
    path = appendPathSegment(path, segment);
    paths.unshift(path);
  }
  return paths;
}

/** Rows that can expand: a container with at least one child row to show. */
export function isParentRow(row: FlatJsonTreeRow): boolean {
  return !!row.node.children?.length;
}

export interface UseTreeGridOptions {
  rows: FlatJsonTreeRow[];
  indexByPath: Map<string, number>;
  isCollapsed: (path: string) => boolean;
  /** Undefined when the host fixes expansion. */
  toggle?: (path: string) => void;
}

/**
 * Focus and keyboard state for the grid: which row holds the Tab stop, the Tab
 * order that follows it, arrow-key moves, and putting focus back when an editor
 * closes or the focused row leaves the view.
 */
export function useTreeGrid({ rows, indexByPath, isCollapsed, toggle }: UseTreeGridOptions) {
  const tabbable = useContext(TreeGridTabbableContext);
  // State, not a ref: the effects below subscribe to the element itself.
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  // The row last focused. Its segments name its ancestors, for when it leaves the view.
  const [active, setActive] = useState<{ path: string; segments: PathSegment[] } | null>(null);

  // When the focused row leaves the view (collapsed or filtered away), the stop
  // moves to its nearest visible ancestor, else the first row.
  const activePath = useMemo(() => {
    if (active && indexByPath.has(active.path)) return active.path;
    const ancestor = active && ancestorPaths(active.segments).find((path) => indexByPath.has(path));
    return ancestor ?? rows[0]?.node.path ?? null;
  }, [active, indexByPath, rows]);
  const tabStopPath = tabbable ? activePath : null;

  // Focus to place after the next commit, once the row it targets is mounted.
  const pendingFocusRef = useRef<{
    path: string;
    cell: TreeGridCell | null;
    opener?: Element | null;
  } | null>(null);
  // What had focus when an editor opened, to return to when it closes.
  const editorOpenerRef = useRef<Element | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const tabStopRef = useRef(tabStopPath);
  const syncedTabStopRef = useRef<string | null>(null);

  // A Tab stop move touches only the two rows it moves between.
  useIsomorphicLayoutEffect(() => {
    tabStopRef.current = tabStopPath;
    const previous = syncedTabStopRef.current;
    syncedTabStopRef.current = tabStopPath;
    if (!grid || previous === tabStopPath) return;
    for (const path of [previous, tabStopPath]) {
      const row = path === null ? undefined : findRow(grid, path);
      if (row) syncRowTabOrder(row, path === tabStopPath);
    }
  }, [grid, tabStopPath]);

  // Rows mounting (expanding, scrolling into the virtual window) and controls a
  // row gains on its own (an editor opening, a consumer cell's late button) are
  // caught as they land, so a re-render that changes nothing costs nothing.
  useIsomorphicLayoutEffect(() => {
    if (!grid) return;
    const sync = (row: HTMLElement) =>
      syncRowTabOrder(row, row.dataset.path === tabStopRef.current);
    for (const row of ownRows(grid)) sync(row);
    const observer = new MutationObserver((mutations) => {
      const touched = new Set<HTMLElement>();
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (!(added instanceof Element)) continue;
          const row = ownRowOf(grid, added);
          if (row) touched.add(row);
          for (const inner of added.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
            if (inner.closest(GRID_SELECTOR) === grid) touched.add(inner);
          }
        }
      }
      for (const row of touched) sync(row);
    });
    observer.observe(grid, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [grid]);

  // Every commit: place pending focus, or recover focus a removed row dropped.
  useIsomorphicLayoutEffect(() => {
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (!grid) return;
    if (pending) {
      const row = findRow(grid, pending.path);
      if (!row) return;
      const { opener } = pending;
      if (opener instanceof HTMLElement && opener.isConnected && row.contains(opener)) {
        opener.focus();
      } else {
        focusInRow(row, pending.cell);
      }
      return;
    }
    // The focused row (or a control in it) just left the DOM, which drops focus to the
    // body with no blur. Hand it to the row now holding the Tab stop.
    const lost = lastFocusedRef.current;
    const focusDropped = !document.activeElement || document.activeElement === document.body;
    if (lost && !lost.isConnected && focusDropped && activePath) {
      findRow(grid, activePath)?.focus();
    }
  });

  const focusRow = (index: number, cell: TreeGridCell | null) => {
    const row = rows[index];
    if (!row) return;
    const element = grid && findRow(grid, row.node.path);
    if (element) {
      focusInRow(element, cell);
      return;
    }
    // Outside the virtual window: making it active pins it, and the effect above focuses it.
    pendingFocusRef.current = { path: row.node.path, cell };
    setActive({ path: row.node.path, segments: row.node.segments });
  };

  /** Puts focus back once an editor closes: on its opener, else the first stop of `cell`. */
  const restoreFocus = (path: string, cell: TreeGridCell) => {
    pendingFocusRef.current = { path, cell, opener: editorOpenerRef.current };
  };

  /** Wraps an editor's open/close setter to remember what opened it. */
  const trackOpener = (set: (path: string | null) => void) => (path: string | null) => {
    if (path !== null) editorOpenerRef.current = document.activeElement;
    set(path);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!HANDLED_KEYS.has(event.key) || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.ctrlKey && event.key !== 'Home' && event.key !== 'End') return;
    const target = event.target as HTMLElement;
    const gridElement = event.currentTarget;
    // Portaled content (an open row menu) bubbles here through React but is not in the grid.
    if (!gridElement.contains(target) || target.closest(TEXT_ENTRY_SELECTOR)) return;
    const row = target.closest<HTMLElement>(ROW_SELECTOR);
    // A nested tree's keys are its own.
    if (!row || row.closest(GRID_SELECTOR) !== gridElement) return;
    const path = row.dataset.path;
    const index = path === undefined ? undefined : indexByPath.get(path);
    if (path === undefined || index === undefined) return;

    const flatRow = rows[index]!;
    const isParent = isParentRow(flatRow);
    const expanded = isParent && !isCollapsed(path);
    const onRow = target === row;
    const stops = onRow ? [] : rowStops(row);
    const at = stops.indexOf(target);
    const cell = onRow ? null : cellNameOf(target);
    const last = rows.length - 1;
    const moveTo = (next: number) => focusRow(Math.max(0, Math.min(last, next)), cell);

    switch (event.key) {
      case 'ArrowDown':
        moveTo(index + 1);
        break;
      case 'ArrowUp':
        moveTo(index - 1);
        break;
      case 'PageDown':
        moveTo(index + PAGE_SIZE);
        break;
      case 'PageUp':
        moveTo(index - PAGE_SIZE);
        break;
      case 'Home':
        if (onRow || event.ctrlKey) moveTo(0);
        else stops[0]?.focus();
        break;
      case 'End':
        if (onRow || event.ctrlKey) moveTo(last);
        else stops[stops.length - 1]?.focus();
        break;
      case 'ArrowRight':
        if (!onRow) stops[at + 1]?.focus();
        else if (isParent && !expanded && toggle) toggle(path);
        else rowStops(row)[0]?.focus();
        break;
      case 'ArrowLeft': {
        if (!onRow) (stops[at - 1] ?? row).focus();
        else if (expanded && toggle) toggle(path);
        else {
          const parentPath = ancestorPaths(flatRow.node.segments)[0];
          const parent = parentPath === undefined ? undefined : indexByPath.get(parentPath);
          if (parent !== undefined) focusRow(parent, null);
        }
        break;
      }
      case 'Enter':
        // On a control, Enter is the control's own (copy, edit, toggle).
        if (!onRow || !isParent || !toggle) return;
        toggle(path);
        break;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    lastFocusedRef.current = target;
    // Focus inside a nested tree makes the outer row around it active.
    const row = ownRowOf(event.currentTarget, target);
    const path = row?.dataset.path;
    const index = path === undefined ? undefined : indexByPath.get(path);
    if (path === undefined || index === undefined || path === active?.path) return;
    setActive({ path, segments: rows[index]!.node.segments });
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    // Focus left the tree on purpose; nothing to hand back if the row then unmounts.
    if (!event.currentTarget.contains(event.relatedTarget)) lastFocusedRef.current = null;
  };

  return {
    /** The row React renders with `tabIndex={0}`; null while an outer row keeps this tree out of the Tab order. */
    tabStopPath,
    /** The focused (or fallback) row, kept mounted by a virtualized tree. */
    activePath,
    gridHandlers: { ref: setGrid, onFocus, onBlur, onKeyDownCapture: onKeyDown },
    restoreFocus,
    trackOpener,
  };
}
