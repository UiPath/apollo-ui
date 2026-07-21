import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_SOURCE_HANDLE_ID } from '../../constants';
import type { InsertionSlot, SequenceProjection } from '../../utils/sequential/sequential.types';
import {
  findIndentSlot,
  findMoveDownSlot,
  findMoveUpSlot,
  findOutdentSlot,
} from '../../utils/sequential/slotNavigation';

/**
 * Pure core for the explorer-like tree move operations (Move up/down,
 * indent/outdent), kept dependency-free from React so the disable logic and
 * handle-resolution are unit-testable without mounting BaseNode/BaseCanvas.
 * The React binding (SequentialMoveActionsContext) wires this to the
 * projection/canonical graph/registry and to onNodesChange/onEdgesChange.
 */

export type SequentialMoveDirection = 'up' | 'down' | 'indent' | 'outdent';

/** A candidate move: `slot` is the target `moveSubtree` would use; `undefined` means disabled. */
export interface SequentialMoveOptions {
  up: InsertionSlot | undefined;
  down: InsertionSlot | undefined;
  indent: InsertionSlot | undefined;
  outdent: InsertionSlot | undefined;
}

/**
 * True when `nodeId`'s row is a "bare branch owner": collapsible (per
 * `SequenceRow.collapsible`, which is true for BOTH containers and branch
 * owners like If/Switch) but NOT a structural container.
 *
 * ENGINE CONTRACT EXTENSION: the binding
 * contract text calls for this gate on Outdent only. This module applies it
 * to ALL FOUR operations instead, because the underlying limitation is not
 * outdent-specific. `moveSubtree`'s own doc comment (utils/sequential/mutations.ts)
 * and its `collectOwnSeam` helper establish that a bare branch owner has NO
 * genuine "own outgoing" connector -- `projectSequence` only ever emits
 * `branch-entry` connectors sourced at such a node (into its Then/Else lanes),
 * never a real forward `step` past it, because the flow only "continues"
 * again via the merge node reached through the branch tails.
 *
 * Consequence, verified against the engine's own
 * `makeCrossContainerBranchFixture` test (mutations.test.ts, "relocates a bare
 * branch owner WITH its lane content across a container boundary"): the ONLY
 * slot shape that test exercises for moving such a node is a SOURCE-ONLY
 * (append) slot with no `target`/`graphEdgeId` -- explicitly "so the splice
 * only ADDS an incoming edge to `If` and never a competing outgoing one...
 * splicing a new OUTGOING edge onto a bare branch owner is unsound (it always
 * reads as a third lane, not a 'next step')". `findMoveUpSlot` and
 * `findIndentSlot` do NOT guarantee a source-only slot (they can return a
 * splice or a prepend, both of which hand the owner a new outgoing edge), so
 * "Move up" and "Move into previous step" are just as unsound as Outdent for
 * these nodes -- not merely "no genuine forward step" (which already,
 * separately, makes `findMoveDownSlot` naturally return `undefined` with no
 * extra gate needed). Disabling all four is the only interpretation that
 * can't corrupt the graph.
 */
export function isBareBranchOwner(
  projection: SequenceProjection,
  nodeId: string,
  isContainerNode: (nodeId: string) => boolean
): boolean {
  const row = projection.rows.find((candidate) => candidate.nodeId === nodeId);
  return !!row?.collapsible && !isContainerNode(nodeId);
}

/**
 * Computes the four move candidates for `nodeId`. A bare branch owner (see
 * {@link isBareBranchOwner}) gets all four disabled regardless of what the
 * individual `find*Slot` helpers return.
 */
export function computeSequentialMoveOptions(
  projection: SequenceProjection,
  nodeId: string,
  isContainerNode: (nodeId: string) => boolean
): SequentialMoveOptions {
  if (isBareBranchOwner(projection, nodeId, isContainerNode)) {
    return { up: undefined, down: undefined, indent: undefined, outdent: undefined };
  }
  const row = projection.rows.find((candidate) => candidate.nodeId === nodeId);
  const ownerId = row?.parentRowId;
  const ownerIsBareBranch = ownerId
    ? isBareBranchOwner(projection, ownerId, isContainerNode)
    : false;
  return {
    up: findMoveUpSlot(projection, nodeId),
    down: findMoveDownSlot(projection, nodeId),
    indent: findIndentSlot(projection, nodeId),
    // A branch lane has no single semantic "after owner" seam. Synthesizing
    // owner.output would create a new branch instead of moving the row out.
    outdent: ownerIsBareBranch ? undefined : findOutdentSlot(projection, nodeId),
  };
}

/** A loop-body tail cannot be outdented by splicing its close edge as a forward seam. */
export function closesLoopToOwner(
  projection: SequenceProjection,
  nodeId: string,
  edges: readonly Edge[]
): boolean {
  const ownerId = projection.rows.find((row) => row.nodeId === nodeId)?.parentRowId;
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
 * Re-resolves a synthesized slot's SOURCE handle against the registry before
 * committing (engine contract): `slotNavigation.ts`'s fallback slots stamp the
 * generic `DEFAULT_SOURCE_HANDLE_ID` ('output') when there is no real edge to
 * read a handle id from. When the registry knows the source node's actual
 * default source handle (which may differ, e.g. a node type with no literal
 * "output" handle id), that real id is used instead. A no-op when the slot's
 * source handle is already something else (a real handle id copied from an
 * existing edge), or when the registry has nothing better to offer.
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
  // Start nodes are folded into the synthetic "Workflow start" row. When the
  // graph contains only one such node, use it as the terminal append source so
  // the otherwise-empty "Add step" row still opens a valid insertion.
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
