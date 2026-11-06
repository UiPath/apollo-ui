import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCallback } from 'react';
import type { SequenceRow } from '../../utils/sequential/sequential.types';

/** The subset of a row's fields the keyboard hook needs to navigate/collapse it. */
export interface SequentialKeyboardRow
  extends Pick<SequenceRow, 'nodeId' | 'collapsible' | 'collapsed'> {}

export interface UseSequentialKeyboardArgs {
  /** Visible, numbered rows in row order, the same array SequentialGutter renders from. */
  rows: readonly SequentialKeyboardRow[];
  selectedNodeId?: string;
  collapsedStepIds: ReadonlySet<string>;
  onSelectNode: (nodeId: string) => void;
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /** Enter's primary action. Enter is a no-op until the host supplies this. */
  onPrimaryAction?: (nodeId: string) => void;
  /** Alt+Arrow tree move on the selected row; gated on `isDesignMode`. */
  onMoveNode?: (nodeId: string, direction: 'up' | 'down' | 'indent' | 'outdent') => void;
  /** Removes the selected step and heals its graph seam. */
  onDeleteNode?: (nodeId: string) => void;
  isDesignMode?: boolean;
}

export interface UseSequentialKeyboardResult {
  /** Attach to a wrapper div around BaseCanvas. */
  onKeyDown: (event: ReactKeyboardEvent) => void;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** True when the target is an editable surface, so navigation keys move the caret instead. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return TYPING_TAGS.has(target.tagName);
}

/**
 * The surfaces whose keys drive row navigation: the canvas pane, a node or edge wrapper, and
 * the screen-reader list. Overlays (kebab menus, the Add Node panel, dialogs) render through
 * portals, and React synthetic events bubble through portals to the wrapper div; allowlisting
 * the canvas surfaces keeps their keys out without enumerating every overlay kind.
 */
const CANVAS_SURFACE_SELECTOR =
  '.react-flow__pane, .react-flow__node, .react-flow__edge, [data-sequential-list]';

/** True when a key on `target` should drive row navigation (see {@link CANVAS_SURFACE_SELECTOR}). */
export function isCanvasSurfaceTarget(
  target: EventTarget | null,
  wrapper?: EventTarget | null
): boolean {
  if (target !== null && target === wrapper) return true;
  if (!(target instanceof Element)) return false;
  return target.closest(CANVAS_SURFACE_SELECTOR) !== null;
}

/**
 * The row adjacent to `selectedNodeId`. With nothing selected, `next` is the first row and
 * `prev` the last. Returns `undefined` at either boundary (no wraparound).
 */
export function getAdjacentRowId(
  rows: readonly Pick<SequentialKeyboardRow, 'nodeId'>[],
  selectedNodeId: string | undefined,
  direction: 'next' | 'prev'
): string | undefined {
  if (rows.length === 0) return undefined;

  const index = selectedNodeId ? rows.findIndex((row) => row.nodeId === selectedNodeId) : -1;
  if (index === -1) {
    return direction === 'next' ? rows[0]?.nodeId : rows[rows.length - 1]?.nodeId;
  }

  const nextIndex = direction === 'next' ? index + 1 : index - 1;
  return rows[nextIndex]?.nodeId;
}

/** The next `collapsedStepIds` array with `nodeId` added or removed. */
export function toggleCollapsedStepIds(
  collapsedStepIds: ReadonlySet<string>,
  nodeId: string,
  collapsed: boolean
): string[] {
  const next = new Set(collapsedStepIds);
  if (collapsed) next.add(nodeId);
  else next.delete(nodeId);
  return [...next];
}

/**
 * Keyboard navigation for the Sequential Canvas: ArrowUp/Down move selection, ArrowLeft/Right
 * collapse/expand, Enter fires the primary action, Delete/Backspace remove the step, Alt+Arrow
 * moves it. Attach `onKeyDown` to a wrapper div, not `document`, so multiple canvases coexist.
 */
export function useSequentialKeyboard(
  args: UseSequentialKeyboardArgs
): UseSequentialKeyboardResult {
  const {
    rows,
    selectedNodeId,
    collapsedStepIds,
    onSelectNode,
    onCollapsedStepIdsChange,
    onPrimaryAction,
    onMoveNode,
    onDeleteNode,
    isDesignMode,
  } = args;

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      // A descendant that already consumed the key must not also drive row navigation.
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target)) return;
      if (!isCanvasSurfaceTarget(event.target, event.currentTarget)) return;

      // Alt+Arrow is a move and must not fall through to navigation/collapse.
      if (
        event.altKey &&
        (event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight')
      ) {
        if (isDesignMode && selectedNodeId && onMoveNode) {
          const direction =
            event.key === 'ArrowUp'
              ? 'up'
              : event.key === 'ArrowDown'
                ? 'down'
                : event.key === 'ArrowLeft'
                  ? 'outdent'
                  : 'indent';
          event.preventDefault();
          onMoveNode(selectedNodeId, direction);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown': {
          const nextId = getAdjacentRowId(rows, selectedNodeId, 'next');
          if (nextId) {
            event.preventDefault();
            onSelectNode(nextId);
          }
          return;
        }
        case 'ArrowUp': {
          const prevId = getAdjacentRowId(rows, selectedNodeId, 'prev');
          if (prevId) {
            event.preventDefault();
            onSelectNode(prevId);
          }
          return;
        }
        case 'ArrowLeft': {
          const row = rows.find((candidate) => candidate.nodeId === selectedNodeId);
          if (row?.collapsible && !row.collapsed) {
            event.preventDefault();
            onCollapsedStepIdsChange?.(toggleCollapsedStepIds(collapsedStepIds, row.nodeId, true));
          }
          return;
        }
        case 'ArrowRight': {
          const row = rows.find((candidate) => candidate.nodeId === selectedNodeId);
          if (row?.collapsible && row.collapsed) {
            event.preventDefault();
            onCollapsedStepIdsChange?.(toggleCollapsedStepIds(collapsedStepIds, row.nodeId, false));
          }
          return;
        }
        case 'Enter': {
          if (selectedNodeId && onPrimaryAction) {
            event.preventDefault();
            onPrimaryAction(selectedNodeId);
          }
          return;
        }
        case 'Delete':
        case 'Backspace': {
          if (isDesignMode && selectedNodeId && onDeleteNode) {
            event.preventDefault();
            onDeleteNode(selectedNodeId);
          }
          return;
        }
        default:
          return;
      }
    },
    [
      rows,
      selectedNodeId,
      collapsedStepIds,
      onSelectNode,
      onCollapsedStepIdsChange,
      onPrimaryAction,
      onMoveNode,
      onDeleteNode,
      isDesignMode,
    ]
  );

  return { onKeyDown };
}
