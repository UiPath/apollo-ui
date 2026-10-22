import { type FocusEvent, type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/use-isomorphic-layout-effect';
import { appendPathSegment, type FlatJsonTreeRow, isPathCollapsed } from './buildJsonTree';
import type { PathSegment } from './JsonTree.types';

/**
 * The tree's keyboard model, the APG treegrid pattern: one Tab stop for the
 * whole tree, arrows between rows and across a row's controls.
 */

/** The cells every row renders, in reading order. Up/Down keeps focus in the same one. */
export type TreeGridCell = 'name' | 'value' | 'actions' | 'detail';

/** Marks an open editor, which owns its arrow keys. */
const EDITOR_ATTR = 'data-json-tree-editor';
/** Marks a control arrows and Tab skip (the chevron: the row carries expansion). */
const SKIP_ATTR = 'data-json-tree-skip';
/** Set on a control the tree took out of the Tab order, holding the tabindex to restore. */
const MANAGED_ATTR = 'data-json-tree-tabindex';

const ROW_SELECTOR = '[role="row"]';
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
 * Nested trees aren't supported, but a tree rendered in another tree's cell
 * still mustn't have its keys or rows taken by the outer one.
 */
function isOwnRow(grid: HTMLElement, row: HTMLElement): boolean {
  return row.closest('[role="treegrid"]') === grid;
}

function isNavigable(element: HTMLElement): boolean {
  return (
    !element.hasAttribute('disabled') &&
    !element.closest(`[${EDITOR_ATTR}], [${SKIP_ATTR}], [aria-hidden="true"]`)
  );
}

function cellsOf(row: HTMLElement): HTMLElement[] {
  return Array.from(row.querySelectorAll<HTMLElement>('[role="gridcell"]'));
}

/** A cell's arrow-key stops: its controls, or the cell itself when it holds only text. */
function stopsOf(cell: HTMLElement): HTMLElement[] {
  const controls = Array.from(cell.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)).filter(
    isNavigable
  );
  if (controls.length > 0) return controls;
  return cell.textContent?.trim() ? [cell] : [];
}

function rowStops(row: HTMLElement): HTMLElement[] {
  return cellsOf(row).flatMap(stopsOf);
}

function cellNameOf(element: Element): TreeGridCell | undefined {
  return element.closest<HTMLElement>('[role="gridcell"]')?.dataset.cell as
    | TreeGridCell
    | undefined;
}

function findRow(grid: HTMLElement, path: string): HTMLElement | undefined {
  return Array.from(grid.querySelectorAll<HTMLElement>(ROW_SELECTOR)).find(
    (row) => row.dataset.path === path && isOwnRow(grid, row)
  );
}

/** Focuses the first stop of `cell` in the row, or the row itself when the cell has none. */
function focusInRow(row: HTMLElement, cell: TreeGridCell | undefined) {
  const target = cell ? cellsOf(row).find((c) => c.dataset.cell === cell) : undefined;
  const stop = target ? stopsOf(target)[0] : undefined;
  (stop ?? row).focus();
}

/**
 * Puts a row's controls in or out of the Tab order: only the Tab stop row's are
 * tabbable, so Tab walks that row and then leaves the tree. Applied to the DOM
 * rather than through props because consumer cells and actions bring their own
 * controls. Each control's own tabindex is kept and restored.
 */
function syncRowTabOrder(row: HTMLElement, tabbable: boolean) {
  for (const control of row.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)) {
    if (control.closest(`[${SKIP_ATTR}]`)) continue;
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

/** The leaf editors (inline and wrapped) and the JSON editor, which can be open at once. */
type EditorKind = 'leaf' | 'json';

interface PendingFocus {
  path: string;
  cell: TreeGridCell | undefined;
  /** Preferred over `cell` while it is still in the row. */
  opener?: Element | null;
}

export interface UseTreeGridOptions {
  rows: FlatJsonTreeRow[];
  indexByPath: Map<string, number>;
  collapsed: Record<string, boolean>;
  /** Undefined when the host fixes expansion. */
  toggle?: (path: string) => void;
}

/**
 * Focus and keyboard state for the grid: which row holds the Tab stop, the Tab
 * order that follows it, arrow-key moves, and putting focus back when an editor
 * closes or the focused row leaves the view.
 */
export function useTreeGrid({ rows, indexByPath, collapsed, toggle }: UseTreeGridOptions) {
  // State, not a ref: the effects below subscribe to the element itself.
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  // The row last focused. Its segments name its ancestors, for when it leaves the view.
  const [active, setActive] = useState<{ path: string; segments: PathSegment[] } | null>(null);

  // The row holding the Tab stop. When the focused row leaves the view (collapsed or
  // filtered away), the stop moves to its nearest visible ancestor, else the first row.
  const activePath = useMemo(() => {
    if (active && indexByPath.has(active.path)) return active.path;
    const ancestor = active && ancestorPaths(active.segments).find((path) => indexByPath.has(path));
    return ancestor ?? rows[0]?.node.path ?? null;
  }, [active, indexByPath, rows]);

  // Focus to place after the next commit, once the row it targets is mounted.
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  // Where each open editor came from, to put focus back when it closes.
  const openEditorsRef = useRef<Partial<Record<EditorKind, Required<PendingFocus>>>>({});
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const activePathRef = useRef(activePath);
  const syncedPathRef = useRef<string | null>(null);

  // A Tab stop move touches only the two rows it moves between.
  useIsomorphicLayoutEffect(() => {
    activePathRef.current = activePath;
    const previous = syncedPathRef.current;
    syncedPathRef.current = activePath;
    if (!grid || previous === activePath) return;
    for (const path of [previous, activePath]) {
      const row = path === null ? undefined : findRow(grid, path);
      if (row) syncRowTabOrder(row, path === activePath);
    }
  }, [grid, activePath]);

  // Rows mounting (expanding, scrolling into the virtual window) and controls a
  // row gains on its own (an editor opening, a consumer cell's late button) are
  // caught as they land, so a re-render that changes nothing costs nothing.
  useIsomorphicLayoutEffect(() => {
    if (!grid) return;
    const sync = (row: HTMLElement) =>
      syncRowTabOrder(row, row.dataset.path === activePathRef.current);
    for (const row of grid.querySelectorAll<HTMLElement>(ROW_SELECTOR)) sync(row);
    const observer = new MutationObserver((mutations) => {
      const touched = new Set<HTMLElement>();
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (!(added instanceof Element)) continue;
          const row = added.closest<HTMLElement>(ROW_SELECTOR);
          if (row) touched.add(row);
          for (const inner of added.querySelectorAll<HTMLElement>(ROW_SELECTOR)) touched.add(inner);
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
    const row = pending && findRow(grid, pending.path);
    if (pending && row) {
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

  const focusRow = (index: number, cell: TreeGridCell | undefined) => {
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

  /**
   * Wraps an editor's open/close setter. Opening records what had focus; closing
   * puts focus back there (else on that control's cell) when the editor still
   * held it. A keyboard commit or cancel leaves focus in the editor about to
   * unmount, while a blur commit has already sent it elsewhere.
   */
  const trackEditor =
    (kind: EditorKind, set: (path: string | null) => void) => (path: string | null) => {
      if (path !== null) {
        const opener = document.activeElement;
        // A JSON edit opened from the overflow menu has no cell; its trigger sits in the actions.
        const cell = (opener && cellNameOf(opener)) ?? (kind === 'json' ? 'actions' : undefined);
        openEditorsRef.current[kind] = { path, cell, opener };
      } else {
        const open = openEditorsRef.current[kind];
        openEditorsRef.current[kind] = undefined;
        if (open && grid && findRow(grid, open.path)?.contains(document.activeElement)) {
          pendingFocusRef.current = open;
        }
      }
      set(path);
    };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!HANDLED_KEYS.has(event.key) || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.ctrlKey && event.key !== 'Home' && event.key !== 'End') return;
    const { target, currentTarget } = event;
    // Portaled content (an open row menu) bubbles here through React but is not in the grid.
    if (!(target instanceof HTMLElement) || !currentTarget.contains(target)) return;
    if (target.closest(TEXT_ENTRY_SELECTOR)) return;
    const row = target.closest<HTMLElement>(ROW_SELECTOR);
    if (!row || !isOwnRow(currentTarget, row)) return;
    const path = row.dataset.path;
    const index = path === undefined ? undefined : indexByPath.get(path);
    const flatRow = index === undefined ? undefined : rows[index];
    if (path === undefined || index === undefined || !flatRow) return;

    const isParent = isParentRow(flatRow);
    const expanded = isParent && !isPathCollapsed(collapsed, path);
    const onRow = target === row;
    const stops = onRow ? [] : rowStops(row);
    const at = stops.indexOf(target);
    const cell = onRow ? undefined : cellNameOf(target);
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
          if (parent !== undefined) focusRow(parent, undefined);
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
    const { target } = event;
    if (!(target instanceof HTMLElement)) return;
    lastFocusedRef.current = target;
    const path = target.closest<HTMLElement>(ROW_SELECTOR)?.dataset.path;
    const index = path === undefined ? undefined : indexByPath.get(path);
    const row = index === undefined ? undefined : rows[index];
    if (path === undefined || !row || path === active?.path) return;
    setActive({ path, segments: row.node.segments });
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    // Focus left the tree on purpose; nothing to hand back if the row then unmounts.
    if (!event.currentTarget.contains(event.relatedTarget)) lastFocusedRef.current = null;
  };

  return {
    /** The row holding the Tab stop, kept mounted by a virtualized tree. */
    activePath,
    gridHandlers: { ref: setGrid, onFocus, onBlur, onKeyDownCapture: onKeyDown },
    trackEditor,
  };
}
