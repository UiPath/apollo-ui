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
 * reads as a third lane, not a 'next step')". None of `findMoveUpSlot`,
 * `findMoveDownSlot` or `findIndentSlot` guarantees a source-only slot (each can
 * return a splice or a prepend, both of which hand the owner a new outgoing
 * edge), so all three are just as unsound as Outdent for these nodes. Move down
 * is no exception even though such a node has no genuine forward step of its
 * own: it now falls back to the out-of-lane path, which for the wireframe's `If`
 * yields the `For Each -> Send Message` SPLICE and would give the `If` a third
 * outgoing edge. Disabling all four is the only interpretation that can't
 * corrupt the graph.
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
 * Computes the four move candidates for `nodeId`. A bare branch owner (see
 * {@link isBareBranchOwner}) gets all four disabled regardless of what the
 * individual `find*Slot` helpers return.
 *
 * Three of the four directions share ONE refusal, implemented as the local
 * `refuseIfItAppendsOntoALaneOwner` gate below: a slot that would hang a
 * brand-new outgoing edge off a node whose source handles are its branch lanes
 * is rejected, because such an edge reads as an extra lane rather than a next
 * step. See the comment on that gate for why it is expressed against the SLOT
 * rather than against the owner's identity, and why it is strictly safer than
 * the three separate gates it replaces.
 *
 * `up` is ungated: "move up and out" splices the owner's INCOMING seam, which
 * only ever adds an incoming edge to the owner, so it is sound even when the
 * owner is a bare branch owner (see `findMoveUpAndOutSlot`).
 *
 * Worked example of what the gate costs, verified against the engine both ways
 * using the wireframe with `send-message` re-parented under an `If.output` edge
 * (the exact graph an Indent onto that tail would commit): projected WITHOUT
 * `getBranchHandles`, `send-message` lands at depth 2 owned by the `If` as a
 * third lane labelled "output"; projected WITH `getBranchHandles`, the same edge
 * is classified as the If's continuation and `send-message` correctly lands at
 * the body's level as its last step. So the registry path does make it sound,
 * but only for a tail that genuinely HAS a continuation handle distinct from its
 * declared branches - which is precisely what a bare branch owner lacks. The
 * refusal therefore costs only the unmerged-branch-tail shape; a body ending in
 * a plain step, or in a MERGED branch (`makeMergedBranchBodyFixture`), is
 * unaffected.
 */
export function computeSequentialMoveOptions(
  projection: SequenceProjection,
  nodeId: string,
  isContainerNode: (nodeId: string) => boolean
): SequentialMoveOptions {
  if (isBareBranchOwner(projection, nodeId, isContainerNode)) {
    return { up: undefined, down: undefined, indent: undefined, outdent: undefined };
  }
  // ONE rule for down/indent/outdent: refuse any slot that would hang a BRAND-NEW
  // outgoing edge off a node whose source handles are its branch lanes, because
  // that edge reads as an extra lane rather than a next step.
  //
  // This replaces three differently-shaped gates that all decided the same thing.
  // The previous `outdent` gate asked about the OWNER's identity and the previous
  // `down` gate re-derived, in this module, which internal branch
  // `findMoveDownSlot` had taken (via `hasLaneSuccessor`) - two computations of
  // one condition on opposite sides of a module boundary, with nothing keeping
  // them in agreement. Asking `appendSourceNodeId` about the slot that was
  // actually returned cannot drift: it inspects the value, not a reconstruction
  // of how the value was produced.
  //
  // It is also correctly LESS conservative than the owner-identity test it
  // replaces. An `If` that declares true/false AND a continuation output is a
  // bare branch owner, yet `ownOutgoingConnector` finds its real forward seam, so
  // `findOutdentSlot` returns a sound splice; the old gate discarded it anyway.
  // The question was always about the SLOT, not the node.
  //
  // `up` needs no gate: `findMoveUpSlot` only ever returns a real edge slot or a
  // `target`-only prepend, never an append, so this would be a no-op there.
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
