import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCallback } from 'react';
import type { SequenceRow } from '../../utils/sequential/sequential.types';

/** The subset of a row's fields the keyboard hook needs to navigate/collapse it. */
export interface SequentialKeyboardRow
  extends Pick<SequenceRow, 'nodeId' | 'collapsible' | 'collapsed'> {}

export interface UseSequentialKeyboardArgs {
  /**
   * Visible, numbered rows in row order -- the same array `SequentialGutter`
   * renders from (see `SequentialCanvas.tsx`), so ArrowUp/Down walk the exact
   * order screen readers traverse the DOM in (D8: `onlyRenderVisibleElements`
   * off means DOM order === row order).
   */
  rows: readonly SequentialKeyboardRow[];
  /** The single selected row's node id, if any (single-select contract). */
  selectedNodeId?: string;
  collapsedStepIds: ReadonlySet<string>;
  /**
   * Moves single selection to a row's node id. The canvas assembly wires this
   * through the same `onNodesChange` path a mouse click already uses (a
   * `select` NodeChange per touched node), so keyboard and pointer selection
   * are indistinguishable to the consumer's canonical state.
   */
  onSelectNode: (nodeId: string) => void;
  onCollapsedStepIdsChange?: (ids: string[]) => void;
  /**
   * Enter's primary action, if the host supplies one. `SequentialCanvas` does
   * not wire this today: a bar's toolbar actions are resolved per-node deep
   * inside `BaseNode`/`BaseNodeBar` via `resolveToolbar` + that node's own
   * manifest/status context (see `BaseNodeBar.tsx`'s `menuItems` memo), and are
   * never surfaced centrally to the canvas assembly. Reusing "the first
   * resolved action" here would require either lifting toolbar resolution out
   * of BaseNode (a BaseNode-owning change) or adding an event-bus side channel
   * the bars call into on mount -- both bigger than this component's scope.
   * Enter is therefore a documented no-op until a host supplies `onPrimaryAction`.
   */
  onPrimaryAction?: (nodeId: string) => void;
  /**
   * Alt+Arrow explorer-like tree move: Alt+ArrowUp = move
   * up, Alt+ArrowDown = move down, Alt+ArrowLeft = outdent, Alt+ArrowRight =
   * indent, applied to the selected row. Shares the SAME commit path the
   * kebab items use (see `useSequentialMoveMenuItems` / `commitMove` in
   * `SequentialCanvas.tsx`), so keyboard and kebab can never disagree.
   * Gated on `isDesignMode` (a topology mutation, D4) in addition to the
   * typing-target guard every other key already has; a plain Arrow key
   * without Alt is untouched by this and keeps navigating/collapsing exactly
   * as before.
   */
  onMoveNode?: (nodeId: string, direction: 'up' | 'down' | 'indent' | 'outdent') => void;
  /** Semantically removes the selected step and heals its graph seam. */
  onDeleteNode?: (nodeId: string) => void;
  isDesignMode?: boolean;
}

export interface UseSequentialKeyboardResult {
  /** Attach to a wrapper div around `BaseCanvas` (see `SequentialCanvas.tsx`). */
  onKeyDown: (event: ReactKeyboardEvent) => void;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * True when the event's target is an editable surface: an inline-rename
 * `<textarea>` (see `NodeLabel.tsx`), a host `<input>`/`<select>`, or any
 * `contenteditable` element. Arrow/Enter navigation must not hijack these --
 * a user typing "left" in a rename field must move the caret, not collapse a
 * step.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return TYPING_TAGS.has(target.tagName);
}

/**
 * Pure lookup: the visible row adjacent to `selectedNodeId` in row order.
 * When nothing is selected yet, `next` jumps to the first row and `prev` to
 * the last, so a first ArrowDown/ArrowUp press always lands somewhere useful.
 * Returns `undefined` at either boundary (no wraparound) or for an empty list.
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

/** Pure: the next `collapsedStepIds` array with `nodeId` added or removed. */
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
 * Keyboard navigation for the Sequential Canvas (D8):
 *  - ArrowUp/ArrowDown move single selection along the visible row order;
 *  - ArrowLeft collapses / ArrowRight expands the selected row when it is
 *    collapsible (no-op otherwise);
 *  - Enter fires an optional primary action (see {@link UseSequentialKeyboardArgs.onPrimaryAction});
 *  - Delete/Backspace invoke the sequential semantic delete operation, which
 *    heals the removed step's graph seam.
 *
 * Attach the returned `onKeyDown` to a wrapper `div` around `BaseCanvas`
 * (SequentialCanvas.tsx), not to `document`: a wrapper handler only reacts
 * once focus/bubbling genuinely lands inside this canvas, which composes
 * safely with multiple canvases on one page (unlike `PanShortcutTeachingUI`'s
 * `document.body` listeners, which are page-global by construction).
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
      if (isTypingTarget(event.target)) return;

      // Alt+Arrow tree move takes priority over plain arrow navigation/collapse
      // for the same keys: holding Alt is an unambiguous "move", not
      // "navigate" or "collapse", so it must not fall through to those below.
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
