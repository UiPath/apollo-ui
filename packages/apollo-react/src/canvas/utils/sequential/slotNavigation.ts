import { DEFAULT_SOURCE_HANDLE_ID } from '../../constants';
import { rowsById } from './graph-helpers';
import { incomingSeams, ownIncomingConnector, ownOutgoingConnector } from './mutations';
import type {
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

/**
 * Pure slot finders for the four tree operations (move up/down, indent, outdent).
 * Each returns either an existing `projection.slots` entry or a synthetic slot in
 * the shape `moveSubtree` accepts (source-only appends, target-only prepends).
 * Move up/down are lane-scoped; at a lane bound they fall back to "and out",
 * landing before/after the owner at the owner's level.
 */

/**
 * `parentRowId` alone is not a lane: an If's Then and Else children share it, and a
 * lane tail's `merge-back` targets a merge one depth up. Comparing `depth` too pins
 * both rows to one lane, the only relation `moveSubtree`'s single-edge splice can swap.
 */
function isSameLane(rows: ReadonlyMap<string, SequenceRow>, aId: string, bId: string): boolean {
  const a = rows.get(aId);
  const b = rows.get(bId);
  return (
    a !== undefined && b !== undefined && a.depth === b.depth && a.parentRowId === b.parentRowId
  );
}

/**
 * Lane-internal predecessor/successor. A `branch-entry` incomer makes `nodeId` the
 * first row of its lane, not a sibling. `merge-back` is accepted (a container's own
 * continuation is reclassified as one), so the `isSameLane` check is mandatory:
 * a lane tail's merge-back carries a slot and would otherwise teleport the row out.
 */
function stepInto(
  projection: SequenceProjection,
  nodeId: string,
  rows: ReadonlyMap<string, SequenceRow>
): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) =>
      c.kind !== 'branch-entry' &&
      c.targetRowId === nodeId &&
      c.slot &&
      isSameLane(rows, c.sourceRowId, nodeId)
  );
}

function stepFrom(
  projection: SequenceProjection,
  nodeId: string,
  rows: ReadonlyMap<string, SequenceRow>
): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) =>
      c.kind !== 'branch-entry' &&
      c.sourceRowId === nodeId &&
      c.slot &&
      isSameLane(rows, c.targetRowId, nodeId)
  );
}

/**
 * The source node of an append-shaped slot (source only, no target or edge), else
 * `undefined`. Appending is the one slot shape whose soundness depends on the source's
 * manifest: a bare branch owner's source handles are lanes, so the view layer
 * (`computeSequentialMoveOptions`) uses this to refuse such moves.
 */
export function appendSourceNodeId(slot: InsertionSlot): string | undefined {
  if (slot.graphEdgeId !== undefined || slot.target !== undefined) return undefined;
  return slot.source?.nodeId;
}

/** Whether `nodeId` opens branch lanes; appending from such a node adds a lane, not a step. */
function sourcesBranchEntry(projection: SequenceProjection, nodeId: string): boolean {
  return projection.connectors.some((c) => c.kind === 'branch-entry' && c.sourceRowId === nodeId);
}

/**
 * Slot placing `nodeId` immediately before its owner, at the owner's level. Sound for
 * a bare branch owner too, since the owner only gains an incoming edge (unlike the
 * `findOutdentSlot` append).
 */
function findMoveUpAndOutSlot(
  projection: SequenceProjection,
  rows: ReadonlyMap<string, SequenceRow>,
  nodeId: string
): InsertionSlot | undefined {
  const ownerId = rows.get(nodeId)?.parentRowId;
  if (ownerId === undefined) return undefined;
  // A merge row has no single seam before it; disable rather than half-move.
  if (incomingSeams(projection, ownerId).length > 1) return undefined;

  const incoming = ownIncomingConnector(projection, ownerId);
  if (incoming?.slot) return incoming.slot;

  // Owner is first in its scope: prepend. Its scope is read off its outgoing slot,
  // since a node's incoming and outgoing edges share the same `containerId`.
  return {
    id: `slot:moveUpOut:${ownerId}`,
    target: { nodeId: ownerId },
    containerId: ownOutgoingConnector(projection, ownerId)?.slot?.containerId,
  };
}

/**
 * Slot placing `nodeId` before its previous same-lane sibling, or before its owner
 * when it is first in its lane. `undefined` when there is nowhere to go.
 * Does not self-guard against `nodeId` being a bare branch owner; callers gate on
 * `isBareBranchOwner` first (see `computeSequentialMoveOptions`).
 */
export function findMoveUpSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const rows = rowsById(projection);
  const intoNode = stepInto(projection, nodeId, rows);
  if (!intoNode?.slot) return findMoveUpAndOutSlot(projection, rows, nodeId);
  const prevId = intoNode.sourceRowId;

  if (incomingSeams(projection, prevId).length > 1) return undefined;

  const intoPrev = ownIncomingConnector(projection, prevId);
  if (intoPrev?.slot) return intoPrev.slot;

  // `prevId` has no predecessor: prepend before it.
  return {
    id: `slot:moveUp:${nodeId}`,
    target: { nodeId: prevId },
    containerId: intoNode.slot.containerId,
  };
}

/**
 * Slot placing `nodeId` after its next same-lane sibling, or after its owner when it
 * is last in its lane (delegates to `findOutdentSlot`). `undefined` when there is
 * nowhere to go. The "and out" append is unsound for a bare branch owner; callers
 * detect that via {@link appendSourceNodeId} and refuse.
 */
export function findMoveDownSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const rows = rowsById(projection);
  const fromNode = stepFrom(projection, nodeId, rows);
  if (!fromNode?.slot) return findOutdentSlot(projection, nodeId);
  const nextId = fromNode.targetRowId;

  const fromNext = ownOutgoingConnector(projection, nextId);
  if (fromNext?.slot) return fromNext.slot;

  // Appending from a bare branch owner's source handle would add a lane, not a step.
  // Over-broad for a terminal container (greys out a menu item, never corrupts).
  if (sourcesBranchEntry(projection, nextId)) return undefined;

  return {
    id: `slot:moveDown:${nodeId}`,
    source: { nodeId: nextId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: fromNode.slot.containerId,
  };
}

/**
 * Slot immediately after `nodeId`'s owner, at the owner's depth (one level out, not
 * necessarily top level). `undefined` when `nodeId` is already top-level. The append
 * fallback is unsound for a bare branch owner; see {@link appendSourceNodeId}.
 */
export function findOutdentSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const rows = rowsById(projection);
  const ownerId = rows.get(nodeId)?.parentRowId;
  if (ownerId === undefined) return undefined;

  const outgoing = ownOutgoingConnector(projection, ownerId);
  if (outgoing?.slot) return outgoing.slot;

  // Owner is last at its level: append after it, in its own scope (read off its
  // incoming slot, since a node's incoming and outgoing edges share `containerId`).
  const incoming = ownIncomingConnector(projection, ownerId);
  return {
    id: `slot:outdent:${ownerId}`,
    source: { nodeId: ownerId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: incoming?.slot?.containerId,
  };
}

/**
 * Slot at the tail of the previous sibling's body, when that sibling is collapsible.
 * `undefined` otherwise. With multiple lanes the first lane's tail is used.
 * Does not self-guard against `nodeId` being a bare branch owner, and the tail
 * itself may be one; callers gate via `isBareBranchOwner` and {@link appendSourceNodeId}.
 */
export function findIndentSlot(
  projection: SequenceProjection,
  nodeId: string
): InsertionSlot | undefined {
  const rows = rowsById(projection);
  const intoNode = stepInto(projection, nodeId, rows);
  if (!intoNode) return undefined;
  const prevId = intoNode.sourceRowId;

  const prevRow = rows.get(prevId);
  if (!prevRow?.collapsible) return undefined;

  const firstEntry = projection.connectors.find(
    (c) => c.kind === 'branch-entry' && c.sourceRowId === prevId
  );
  if (!firstEntry?.slot) {
    // Empty body: the branch-entry connector into the lane placeholder carries no
    // slot, so the placeholder's registered empty-body slot is the tail.
    return projection.slots.find(
      (slot) => slot.containerId === prevId && slot.source?.nodeId === prevId && !slot.target
    );
  }

  const firstRow = rows.get(firstEntry.targetRowId);
  if (!firstRow || firstRow.parentRowId !== prevId) {
    // Empty lane (dead-ends straight into the merge): the branch-entry slot is the tail.
    return firstEntry.slot;
  }

  // Find the tail by scanning rows (pre-order), not by walking connectors: a walk
  // stops dead at a bare branch owner inside the body (`X -> If -> {P, Q} -> M`)
  // and would append from the If's source handle, i.e. add a third lane.
  const startIndex = projection.rows.indexOf(firstRow);
  let tailId = firstRow.nodeId;
  for (let index = startIndex + 1; index < projection.rows.length; index += 1) {
    const row = projection.rows[index];
    if (row === undefined) break;
    if (row.depth < firstRow.depth) break;
    if (row.depth > firstRow.depth) continue;
    // `branch` metadata is stamped only on a lane's first row, so this starts a sibling lane.
    if (row.branch !== undefined) break;
    // A populated lane's trailing 'append' placeholder sits right after the real tail.
    if (row.lanePlaceholder) continue;
    if (row.parentRowId !== prevId) continue;
    tailId = row.nodeId;
  }

  return {
    id: `slot:indentTail:${prevId}:${tailId}`,
    source: { nodeId: tailId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: firstEntry.slot.containerId,
  };
}
