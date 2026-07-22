import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useRef } from 'react';
import { moveSubtree } from '../../utils/sequential/mutations';
import type { InsertionSlot, SequenceProjection } from '../../utils/sequential/sequential.types';
import type { SequentialMoveActionsContextValue } from './SequentialMoveActionsContext';
import {
  graphChangeSetToEdgeChanges,
  graphChangeSetToNodeChanges,
} from './sequentialChangeFilters';
import {
  closesLoopToOwner,
  computeSequentialMoveOptions,
  resolveSlotForCommit,
  type SequentialMoveOptions,
} from './sequentialMoveActions';

const NO_MOVE_OPTIONS: SequentialMoveOptions = {
  up: undefined,
  down: undefined,
  indent: undefined,
  outdent: undefined,
};

export interface UseSequentialMoveActionsValueArgs<N extends Node, E extends Edge> {
  /** The current sequential projection; null in flow view. */
  projection: SequenceProjection | null;
  nodes: N[];
  edges: E[];
  /** Canonical id -> node map (for slot handle re-resolution at commit time). */
  canonicalById: ReadonlyMap<string, N>;
  /** Structural container predicate (drives move-availability). */
  isContainerNode: (nodeId: string) => boolean;
  /** Registry-backed default source handle lookup, used by resolveSlotForCommit. */
  getDefaultSourceHandleId: (nodeType: string) => string | undefined;
  onNodesChange?: (changes: NodeChange<N>[]) => void;
  onEdgesChange?: (changes: EdgeChange<E>[]) => void;
  /** Centers the viewport on a node (the goto reference chip, D9). */
  centerOnNode: (nodeId: string) => void;
}

/**
 * Builds the {@link SequentialMoveActionsContextValue} shared by the kebab move
 * items ({@link useSequentialMoveMenuItems}) and Alt+Arrow keyboard moves, so
 * both read move-availability and commit through the SAME binding.
 *
 * The returned value is consumed by every `SequentialStepNode` through context,
 * so its identity must be stable across a selection or data-only change:
 * context updates bypass `React.memo`, so a value that churns on every `nodes`
 * reference change would re-render every bar on each click. It is rebuilt only
 * when the structural `projection` changes, exactly when kebab move-availability
 * can actually differ. The commit path reads the latest nodes/edges at call
 * time so it never needs the value to churn to stay current.
 */
export function useSequentialMoveActionsValue<N extends Node, E extends Edge>(
  args: UseSequentialMoveActionsValueArgs<N, E>
): SequentialMoveActionsContextValue {
  const { projection } = args;

  // Latest inputs, read at call time so the returned callbacks (and thus the
  // context value) never change identity on a selection or data-only change.
  // Only `projection` (structural, selection-independent) keys the memos below.
  const latest = useRef(args);
  latest.current = args;

  // Keyed on the structural `projection` (used directly below): a selection
  // never changes it, so the value is reused and the memoized
  // `SequentialStepNode` consumers do not re-render on every click. The
  // churn-prone predicate/edges are read from `latest` at call time instead of
  // being listed as deps, so they never force a rebuild.
  const getMoveOptions = useCallback(
    (nodeId: string): SequentialMoveOptions => {
      if (!projection) return NO_MOVE_OPTIONS;
      const { isContainerNode, edges } = latest.current;
      const options = computeSequentialMoveOptions(projection, nodeId, isContainerNode);
      if (options.outdent && closesLoopToOwner(projection, nodeId, edges)) {
        return { ...options, outdent: undefined };
      }
      return options;
    },
    [projection]
  );

  const commitMove = useCallback((nodeId: string, slot: InsertionSlot) => {
    const {
      projection: proj,
      canonicalById,
      getDefaultSourceHandleId,
      nodes,
      edges,
    } = latest.current;
    if (!proj) return;
    const resolvedSlot = resolveSlotForCommit(slot, canonicalById, getDefaultSourceHandleId);
    const changeSet = moveSubtree(proj, nodeId, resolvedSlot, { nodes, edges });
    if (
      changeSet.addNodes.length === 0 &&
      changeSet.addEdges.length === 0 &&
      changeSet.removeNodeIds.length === 0 &&
      changeSet.removeEdgeIds.length === 0
    ) {
      return;
    }
    latest.current.onNodesChange?.(graphChangeSetToNodeChanges<N>(changeSet));
    latest.current.onEdgesChange?.(graphChangeSetToEdgeChanges<E>(changeSet));
  }, []);

  const centerOnNode = useCallback((nodeId: string) => {
    latest.current.centerOnNode(nodeId);
  }, []);

  return useMemo(
    () => ({ getMoveOptions, commitMove, centerOnNode }),
    [getMoveOptions, commitMove, centerOnNode]
  );
}
