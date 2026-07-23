import { DEFAULT_SOURCE_HANDLE_ID } from '../../constants';
import { ownIncomingConnector, ownOutgoingConnector } from './mutations';
import type {
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

/**
 * Slot navigation for the four file-explorer-like tree operations (move
 * up/down, indent, outdent) that the view layer (kebab items + Alt+Arrow
 * keyboard) needs to compute targets for. Every helper here is a pure reader
 * of an existing {@link SequenceProjection} - none of them mutate anything;
 * the caller passes the returned slot straight into `moveSubtree` (see its
 * doc comment in mutations.ts for why `moveSubtree`, not `moveStep`, is the
 * right op for all four - even a plain leaf crosses a container boundary on
 * indent/outdent).
 *
 * All four helpers return a slot that is EITHER a reference into
 * `projection.slots` (whenever the target position already has a real edge to
 * split/extend) or a well-formed synthetic slot built from the same
 * `{source?, target?, graphEdgeId?, containerId?}` shape `insertAtSlot` and
 * `moveSubtree` already understand (a source-only slot appends; a
 * target-only slot prepends) - so `moveSubtree(projection, nodeId, slot,
 * graph)` works uniformly regardless of which case produced the slot.
 */

function buildRowsById(projection: SequenceProjection): Map<string, SequenceRow> {
  return new Map(projection.rows.map((row) => [row.nodeId, row]));
}

/**
 * The strict lane-internal predecessor/successor relationship: a
 * `branch-entry` incomer means `nodeId` is the FIRST row of its lane (owned
 * by, not preceded by, the connector's source), so it must not count as "has
 * a previous sibling" here - unlike `ownIncomingConnector`, which is
 * deliberately kind-agnostic for seam-healing purposes elsewhere.
 *
 * Excludes `branch-entry` rather than allowlisting `step`, so a container's
 * own body-exit continuation - reclassified `merge-back` by `projectSequence`
 * purely for dashed rendering, but still a genuine single-edge spine splice -
 * is accepted here too. This never widens to a branch lane's OWN merge-back
 * (into its outer join) or a `goto`: neither ever carries a slot, and both
 * are filtered out by the `c.slot` check regardless of kind.
 */
function stepInto(projection: SequenceProjection, nodeId: string): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) => c.kind !== 'branch-entry' && c.targetRowId === nodeId && c.slot
  );
}

function stepFrom(projection: SequenceProjection, nodeId: string): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) => c.kind !== 'branch-entry' && c.sourceRowId === nodeId && c.slot
  );
}

/**
 * Whether `nodeId` opens one or more branch lanes (it is the source of a
 * `branch-entry` connector). Such a node's own source handles ARE its branch
 * outputs, so "append a new edge from this node" splices a fresh lane into the
 * branch structure rather than continuing past it. Used to keep
 * {@link findMoveDownSlot} from stepping a node "past" a bare branch owner
 * whose only exit is a multi-incomer merge, which is not expressible as a
 * single-edge splice in v1.
 */
function sourcesBranchEntry(projection: SequenceProjection, nodeId: string): boolean {
  return projection.connectors.some((c) => c.kind === 'branch-entry' && c.sourceRowId === nodeId);
}

/**
 * The `InsertionSlot` that would place `nodeId` (with its subtree, via
 * `moveSubtree`) BEFORE its previous visible sibling at the same depth and
 * lane. Returns `undefined` when `nodeId` is already first in its lane (its
 * only incomer, if any, is a `branch-entry` - i.e. it IS the lane), or has no
 * step-connected predecessor at all (e.g. the previous sibling is only
 * reachable across a `goto`, which carries no slot).
 *
 * WARNING: this helper does NOT self-guard against `nodeId` being a bare
 * branch owner (a row whose only outgoing edges are branch lanes - see
 * `isBareBranchOwner` in `../../components/SequentialCanvas/sequentialMoveActions.ts`).
 * For such a node this can still return a slot even though none of the four
 * move operations are meaningful for it. Callers MUST gate all four
 * directions (up/down/indent/outdent) on `isBareBranchOwner` first;
 * `computeSequentialMoveOptions` in that same file is the canonical call site
 * that does so - do not call this helper directly without that gate.
 */
export function findMoveUpSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const intoNode = stepInto(projection, nodeId);
  if (!intoNode?.slot) return undefined;
  const prevId = intoNode.sourceRowId;

  const intoPrev = ownIncomingConnector(projection, prevId);
  if (intoPrev?.slot) return intoPrev.slot;

  // `prevId` has no predecessor of its own (it is the absolute first row of
  // the whole sequence, or of a top-level lane with no owner) - prepend
  // directly before it.
  return {
    id: `slot:moveUp:${nodeId}`,
    target: { nodeId: prevId },
    containerId: intoNode.slot.containerId,
  };
}

/**
 * The `InsertionSlot` that would place `nodeId` (with its subtree, via
 * `moveSubtree`) AFTER its next visible sibling at the same depth and lane.
 * Returns `undefined` when `nodeId` is already last in its lane, or has no
 * step-connected successor at all (e.g. reachable only across a `goto`).
 */
export function findMoveDownSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const fromNode = stepFrom(projection, nodeId);
  if (!fromNode?.slot) return undefined;
  const nextId = fromNode.targetRowId;

  const fromNext = ownOutgoingConnector(projection, nextId);
  if (fromNext?.slot) return fromNext.slot;

  // `nextId` has no forward spine continuation of its own. If it opens branch
  // lanes (a bare branch owner like `If`, whose branches rejoin at a
  // multi-incomer merge), "after nextId" cannot be expressed as a single-edge
  // splice: appending via nextId's own source handle would add a THIRD lane to
  // the branch instead of continuing past it (the exact corruption this guards
  // against). Disable the move rather than corrupt the graph (v1 limitation;
  // the same class of node the view layer's isBareBranchOwner gate covers).
  if (sourcesBranchEntry(projection, nextId)) return undefined;

  // `nextId` is a genuine terminal leaf (no outgoing edge at all) - append
  // directly after it.
  return {
    id: `slot:moveDown:${nodeId}`,
    source: { nodeId: nextId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: fromNode.slot.containerId,
  };
}

/**
 * The `InsertionSlot` immediately after the node's owning container/branch
 * subtree, at the OWNER's own depth (exiting the container body or branch
 * lane `nodeId` currently sits in - a plain leaf inside a branch lane exits
 * to the enclosing container's body level, one depth up, not necessarily all
 * the way to the top). Returns `undefined` when `nodeId` is already top-level
 * (no owning row at all).
 *
 * KNOWN LIMITATION: see `moveSubtree`'s doc comment on container idioms that
 * close a loop body via an edge back into the container itself - that edge
 * is invisible here and is not relocated when the body's tail changes.
 */
export function findOutdentSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const rows = buildRowsById(projection);
  const ownerId = rows.get(nodeId)?.parentRowId;
  if (ownerId === undefined) return undefined;

  const outgoing = ownOutgoingConnector(projection, ownerId);
  if (outgoing?.slot) return outgoing.slot;

  // The owner has no genuine forward step of its own (it is the last thing at
  // its own level) - append directly after it, in ITS OWN scope (read off its
  // own incoming slot, since incoming/outgoing edges of the same node always
  // share the same graph-level `containerId`).
  const incoming = ownIncomingConnector(projection, ownerId);
  return {
    id: `slot:outdent:${ownerId}`,
    source: { nodeId: ownerId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: incoming?.slot?.containerId,
  };
}

/**
 * The `InsertionSlot` at the TAIL of the immediately-preceding visible
 * sibling's body, when that sibling is a container or branch owner
 * (file-explorer "move into the folder above"). Returns `undefined` when
 * there is no previous sibling, or it is not `collapsible`. For an owner with
 * multiple lanes (a multi-entry container body, or a multi-way branch), the
 * FIRST lane's tail is used (first connector in projection order, which
 * mirrors `entriesForScope`'s flow-y ordering / the branch's out-edge order).
 *
 * WARNING: this helper does NOT self-guard against `nodeId` itself being a
 * bare branch owner (a row whose only outgoing edges are branch lanes - see
 * `isBareBranchOwner` in `../../components/SequentialCanvas/sequentialMoveActions.ts`).
 * It only checks the PRECEDING sibling's `collapsible` flag, not whether
 * `nodeId` is one. Callers MUST gate all four directions
 * (up/down/indent/outdent) on `isBareBranchOwner` first;
 * `computeSequentialMoveOptions` in that same file is the canonical call site
 * that does so - do not call this helper directly without that gate.
 */
export function findIndentSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const intoNode = stepInto(projection, nodeId);
  if (!intoNode) return undefined;
  const prevId = intoNode.sourceRowId;

  const rows = buildRowsById(projection);
  const prevRow = rows.get(prevId);
  if (!prevRow?.collapsible) return undefined;

  const firstEntry = projection.connectors.find(
    (c) => c.kind === 'branch-entry' && c.sourceRowId === prevId
  );
  if (!firstEntry?.slot) {
    // A container with a genuinely empty body never emits a branch-entry
    // connector at all (see projectSequence's walkContainerBody); its own
    // registered empty-body slot IS the tail.
    return projection.slots.find(
      (slot) => slot.containerId === prevId && slot.source?.nodeId === prevId && !slot.target
    );
  }

  const firstRow = rows.get(firstEntry.targetRowId);
  if (!firstRow || firstRow.parentRowId !== prevId) {
    // An empty lane (the branch dead-ends straight into the merge/outer
    // node, with no row of its own inside the lane): the branch-entry
    // connector's own slot IS the tail - splicing there makes the indented
    // node the lane's sole content.
    return firstEntry.slot;
  }

  let tailId = firstRow.nodeId;
  for (;;) {
    const next = stepFrom(projection, tailId);
    if (!next) break;
    tailId = next.targetRowId;
  }

  return {
    id: `slot:indentTail:${prevId}:${tailId}`,
    source: { nodeId: tailId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: firstEntry.slot.containerId,
  };
}
