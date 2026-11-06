import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_SOURCE_HANDLE_ID } from '../../constants';
import { rowFor } from '../../utils/sequential/graph-helpers';
import type { InsertionSlot, SequenceProjection } from '../../utils/sequential/sequential.types';
import {
  appendSourceNodeId,
  findIndentSlot,
  findMoveDownSlot,
  findMoveUpSlot,
  findOutdentSlot,
} from '../../utils/sequential/slotNavigation';

/** Pure, React-free core for the tree move operations; SequentialMoveActionsContext binds it. */

export type SequentialMoveDirection = 'up' | 'down' | 'indent' | 'outdent';

/** A candidate move: `slot` is the target `moveSubtree` would use; `undefined` means disabled. */
export interface SequentialMoveOptions {
  up: InsertionSlot | undefined;
  down: InsertionSlot | undefined;
  indent: InsertionSlot | undefined;
  outdent: InsertionSlot | undefined;
}

/**
 * True when `nodeId`'s row is a bare branch owner: collapsible (If/Switch) but not a
 * structural container. Such a node has no genuine outgoing seam (only `branch-entry`
 * connectors), so splicing a new outgoing edge onto it reads as a third lane.
 */
export function isBareBranchOwner(
  projection: SequenceProjection,
  nodeId: string,
  isContainerNode: (nodeId: string) => boolean
): boolean {
  const row = rowFor(projection, nodeId);
  return !!row?.collapsible && !isContainerNode(nodeId);
}

/**
 * Computes the four move candidates for `nodeId`. A bare branch owner gets all four
 * disabled, since none of the `find*Slot` helpers guarantees a source-only slot. Down,
 * indent and outdent also refuse any slot that would append a new outgoing edge onto a
 * bare branch owner; `up` only ever splices an incoming seam, so it needs no gate.
 */
export function computeSequentialMoveOptions(
  projection: SequenceProjection,
  nodeId: string,
  isContainerNode: (nodeId: string) => boolean
): SequentialMoveOptions {
  if (isBareBranchOwner(projection, nodeId, isContainerNode)) {
    return { up: undefined, down: undefined, indent: undefined, outdent: undefined };
  }
  // Decided on the returned slot, not the owner's identity, so it cannot drift from the
  // branch `find*Slot` actually took.
  const refuseIfItAppendsOntoALaneOwner = (
    slot: InsertionSlot | undefined
  ): InsertionSlot | undefined => {
    const appendsAfter = slot ? appendSourceNodeId(slot) : undefined;
    return appendsAfter !== undefined &&
      isBareBranchOwner(projection, appendsAfter, isContainerNode)
      ? undefined
      : slot;
  };

  return {
    up: findMoveUpSlot(projection, nodeId),
    down: refuseIfItAppendsOntoALaneOwner(findMoveDownSlot(projection, nodeId)),
    indent: refuseIfItAppendsOntoALaneOwner(findIndentSlot(projection, nodeId)),
    outdent: refuseIfItAppendsOntoALaneOwner(findOutdentSlot(projection, nodeId)),
  };
}

/** A loop-body tail cannot be outdented by splicing its close edge as a forward seam. */
export function closesLoopToOwner(
  projection: SequenceProjection,
  nodeId: string,
  edges: readonly Edge[]
): boolean {
  const ownerId = rowFor(projection, nodeId)?.parentRowId;
  return !!ownerId && edges.some((edge) => edge.source === nodeId && edge.target === ownerId);
}

/** Reads the slot for a single direction (used by the keyboard handler). */
export function getSequentialMoveSlot(
  options: SequentialMoveOptions,
  direction: SequentialMoveDirection
): InsertionSlot | undefined {
  switch (direction) {
    case 'up':
      return options.up;
    case 'down':
      return options.down;
    case 'indent':
      return options.indent;
    case 'outdent':
      return options.outdent;
  }
}

/**
 * Re-resolves a synthesized slot's source handle before committing: slotNavigation's
 * fallback slots stamp the generic `DEFAULT_SOURCE_HANDLE_ID`, which a node type without a
 * literal `output` handle needs replaced by its registry default. No-op otherwise.
 */
export function resolveSlotForCommit(
  slot: InsertionSlot,
  nodesById: ReadonlyMap<string, Node>,
  getDefaultSourceHandleId: (nodeType: string) => string | undefined
): InsertionSlot {
  if (!slot.source || slot.source.handleId !== DEFAULT_SOURCE_HANDLE_ID) return slot;
  const sourceType = nodesById.get(slot.source.nodeId)?.type;
  if (!sourceType) return slot;
  const resolved = getDefaultSourceHandleId(sourceType);
  if (!resolved || resolved === DEFAULT_SOURCE_HANDLE_ID) return slot;
  return { ...slot, source: { ...slot.source, handleId: resolved } };
}

/** The graph shape `moveSubtree` needs for cross-container `parentId` rewrites. */
export interface CanonicalGraph {
  nodes: Node[];
  edges: Edge[];
}

/** Builds the terminal append slot without assuming a literal `output` handle. */
export function resolveTailInsertionSlot<N extends Node>(
  projection: SequenceProjection | null,
  nodes: readonly N[],
  getDefaultSourceHandleId: (nodeType: string) => string | undefined,
  isStartNode?: (node: N) => boolean
): InsertionSlot | undefined {
  const topRows = projection?.rows.filter((row) => row.depth === 0 && row.visible && !row.orphan);
  const last = topRows?.[topRows.length - 1];
  // Start nodes fold into the synthetic start row; a lone start node still serves as the
  // append source so an otherwise-empty flow can open a valid insertion.
  const startNodes = !last && isStartNode ? nodes.filter(isStartNode) : [];
  const loneStart = startNodes.length === 1 ? startNodes[0] : undefined;
  const sourceNode = last ? nodes.find((node) => node.id === last.nodeId) : loneStart;
  if (!sourceNode) return undefined;
  const nodeType = sourceNode.type;
  return {
    id: `slot:tail:${sourceNode.id}`,
    source: {
      nodeId: sourceNode.id,
      handleId:
        (nodeType ? getDefaultSourceHandleId(nodeType) : undefined) ?? DEFAULT_SOURCE_HANDLE_ID,
    },
  };
}
