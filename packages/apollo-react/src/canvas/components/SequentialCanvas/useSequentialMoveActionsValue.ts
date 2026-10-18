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
  /** Null in flow view. */
  projection: SequenceProjection | null;
  nodes: N[];
  edges: E[];
  canonicalById: ReadonlyMap<string, N>;
  isContainerNode: (nodeId: string) => boolean;
  getDefaultSourceHandleId: (nodeType: string) => string | undefined;
  /** Locked nodes offer no move options and refuse to commit. Pass a reference-stable set. */
  readOnlyNodeIds?: ReadonlySet<string>;
  onNodesChange?: (changes: NodeChange<N>[]) => void;
  onEdgesChange?: (changes: EdgeChange<E>[]) => void;
}

/**
 * Builds the {@link SequentialMoveActionsContextValue} shared by the kebab move items and
 * Alt+Arrow. Context updates bypass `React.memo`, so the value is rebuilt only when the
 * structural `projection` changes; the commit path reads the latest graph at call time.
 */
export function useSequentialMoveActionsValue<N extends Node, E extends Edge>(
  args: UseSequentialMoveActionsValueArgs<N, E>
): SequentialMoveActionsContextValue {
  const { projection, readOnlyNodeIds } = args;

  // Render-phase ref write, idempotent (stores this render's `args`). An effect would leave
  // the first commit reading stale nodes/edges.
  const latest = useRef(args);
  latest.current = args;

  const getMoveOptions = useCallback(
    (nodeId: string): SequentialMoveOptions => {
      if (!projection || readOnlyNodeIds?.has(nodeId)) return NO_MOVE_OPTIONS;
      const { isContainerNode, edges } = latest.current;
      const options = computeSequentialMoveOptions(projection, nodeId, isContainerNode);
      if (options.outdent && closesLoopToOwner(projection, nodeId, edges)) {
        return { ...options, outdent: undefined };
      }
      return options;
    },
    [projection, readOnlyNodeIds]
  );

  const commitMove = useCallback((nodeId: string, slot: InsertionSlot) => {
    const {
      projection: proj,
      canonicalById,
      getDefaultSourceHandleId,
      nodes,
      edges,
      readOnlyNodeIds: lockedIds,
    } = latest.current;
    if (!proj || lockedIds?.has(nodeId)) return;
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

  return useMemo(() => ({ getMoveOptions, commitMove }), [getMoveOptions, commitMove]);
}
