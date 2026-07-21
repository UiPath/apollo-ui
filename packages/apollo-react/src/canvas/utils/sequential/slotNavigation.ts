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
 *
 * Move up/down are LANE-scoped first and level-crossing second: at the top or
 * bottom BOUND of a lane they fall back to "move up/down and out", placing the
 * row immediately before/after its owner at the owner's own level (the
 * file-explorer behavior of dragging an item past the top/bottom edge of its
 * folder), rather than disabling. See {@link findMoveUpSlot} /
 * {@link findMoveDownSlot} for which fallback each direction uses and
 * Callers do not need to know WHICH path produced a slot: the soundness gate in
 * `computeSequentialMoveOptions` inspects the returned slot's own shape (see
 * {@link appendSourceNodeId}), so no predicate reconstructing that decision is
 * exported from here.
 */

/**
 * Whether two rows sit in the SAME LANE, which is what "same level" has to mean
 * for a reorder. `parentRowId` alone is NOT a lane: it is the owning container
 * OR branch owner, so an `If`'s Then-child and Else-child both carry
 * `parentRowId === ifId` while sitting in different lanes, and a lane's tail
 * carries a slot-bearing `merge-back` into a merge node that lives at the
 * OWNER's level, one depth up. Comparing `depth` as well pins both rows to the
 * same indent level under the same owner, which is the only relation for which
 * "swap these two" is expressible as the single-edge splice `moveSubtree`
 * performs.
 *
 * Deliberately structural rather than a `merge-back` kind exclusion: a
 * CONTAINER's own forward continuation is reclassified `merge-back` by
 * `projectSequence` purely for dashed rendering (see its `stepToSuccessor`),
 * yet it is a genuine same-level spine link - the wireframe's
 * `For Each -> Send Message` and the container chain's
 * `Container -> B` both depend on it staying a sibling link.
 *
 * Known imprecision, harmless: two DISTINCT lanes of the same owner at the same
 * depth (Then vs Else) satisfy this predicate. It is only ever applied to a
 * connector that already exists between the two rows, and a direct edge between
 * two lanes of one owner is exactly what `projectSequence` would have projected
 * as a single lane (or as the merge) instead, so the pair can never actually be
 * conflated.
 */
function isSameLane(rows: ReadonlyMap<string, SequenceRow>, aId: string, bId: string): boolean {
  const a = rows.get(aId);
  const b = rows.get(bId);
  return (
    a !== undefined && b !== undefined && a.depth === b.depth && a.parentRowId === b.parentRowId
  );
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
 * is accepted here too. That widening is why the {@link isSameLane} check is
 * mandatory rather than belt-and-braces: a branch lane's OWN merge-back into
 * its outer join DOES carry a slot, so without it a lane tail's "next sibling"
 * resolved to the merge node one level out and Move down silently teleported
 * the row out of its branch. `goto` connectors need no such care - they never
 * carry a slot and are filtered by the `c.slot` check regardless of kind.
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
 * The node a slot would hang a BRAND-NEW outgoing edge off, if it is an
 * append-shaped slot (source only: no `target` to splice against and no
 * `graphEdgeId` to split), else `undefined`.
 *
 * This is the one slot shape whose soundness depends on the source node's
 * manifest rather than on graph structure: appending needs the source to HAVE a
 * forward continuation handle, and a bare branch owner's source handles are its
 * branch outputs, so the new edge reads as an extra lane. A splice
 * (`source` + `target` + `graphEdgeId`) never has that problem - it reuses an
 * edge that already leaves the node - and neither does a prepend (`target` only),
 * which adds an INCOMING edge.
 *
 * Exported so the view layer can apply that judgement where the registry lives
 * (`computeSequentialMoveOptions`), keeping this module free of manifest
 * knowledge. See {@link findIndentSlot}'s SECOND CALLER GATE.
 */
export function appendSourceNodeId(slot: InsertionSlot): string | undefined {
  if (slot.graphEdgeId !== undefined || slot.target !== undefined) return undefined;
  return slot.source?.nodeId;
}

/**
 * Whether more than one slot-bearing connector lands on `nodeId` - i.e. it is a
 * MERGE (a branch's join, or an unstructured convergence). There is no single
 * seam "immediately before" such a row: a splice into any one of its incoming
 * edges would leave the others still pointing straight at it, so the moved row
 * would sit on only one of the paths that reach it. Move up must disable rather
 * than half-move (v1 limitation, mirroring {@link findMoveDownSlot}'s refusal to
 * step past a bare branch owner).
 *
 * No mirror is needed on the way down: `projectSequence` emits at most ONE
 * non-`branch-entry` outgoing connector per row (multiple forward edges become
 * lanes), so "immediately after" is never ambiguous the way "immediately
 * before" is.
 */
function hasMultipleIncomingSeams(projection: SequenceProjection, nodeId: string): boolean {
  return incomingSeams(projection, nodeId).length > 1;
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
 * The slot that places `nodeId` immediately BEFORE its OWNER, at the owner's
 * own level ("move up and out"): the file-explorer behavior for dragging the
 * first item of a folder past the folder's top edge. Used by
 * {@link findMoveUpSlot} at the top bound of a lane.
 *
 * Splicing at the owner's INCOMING seam is what makes this sound for a bare
 * branch owner too (unlike the mirror-image {@link findOutdentSlot} append,
 * which has to synthesize an edge from the owner's SOURCE handle and therefore
 * reads as a third lane): the owner only ever gains an incoming edge here, and
 * the moved row's vacated lane position is healed by `moveSubtree`'s own seam
 * logic - the lane simply becomes shorter, or empty.
 */
function findMoveUpAndOutSlot(
  projection: SequenceProjection,
  rows: ReadonlyMap<string, SequenceRow>,
  nodeId: string
): InsertionSlot | undefined {
  const ownerId = rows.get(nodeId)?.parentRowId;
  if (ownerId === undefined) return undefined;
  if (hasMultipleIncomingSeams(projection, ownerId)) return undefined;

  const incoming = ownIncomingConnector(projection, ownerId);
  if (incoming?.slot) return incoming.slot;

  // The owner is itself the first row of its own scope - prepend directly
  // before it. The owner's scope is read off its OUTGOING slot: this branch is
  // only reached when the owner has no incoming slot to read it from, and a
  // node's incoming and outgoing edges always share the same graph-level
  // `containerId`.
  return {
    id: `slot:moveUpOut:${ownerId}`,
    target: { nodeId: ownerId },
    containerId: ownOutgoingConnector(projection, ownerId)?.slot?.containerId,
  };
}

/**
 * The `InsertionSlot` that would place `nodeId` (with its subtree, via
 * `moveSubtree`) BEFORE its previous visible sibling in the SAME LANE (see
 * {@link isSameLane}) - or, when `nodeId` is already the first row of its lane,
 * immediately before its OWNER at the owner's level ("move up and out", see
 * {@link findMoveUpAndOutSlot}).
 *
 * Returns `undefined` only when there is nowhere to go: `nodeId` is first in a
 * top-level lane with no owner, its previous sibling is reachable only across a
 * `goto` (which carries no slot), or the position it would land on is a
 * multi-incomer merge with no single seam before it (see
 * {@link hasMultipleIncomingSeams}). Callers that need to know WHICH of the two
 * paths produced the slot: up-and-out is always expressible, so unlike the down
 * direction it carries no caller gate.
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
  const rows = rowsById(projection);
  const intoNode = stepInto(projection, nodeId, rows);
  if (!intoNode?.slot) return findMoveUpAndOutSlot(projection, rows, nodeId);
  const prevId = intoNode.sourceRowId;

  // Landing "before prevId" means splicing prevId's own incoming seam, which
  // does not exist as a single edge when prevId is a merge.
  if (hasMultipleIncomingSeams(projection, prevId)) return undefined;

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
 * `moveSubtree`) AFTER its next visible sibling in the SAME LANE (see
 * {@link isSameLane}) - or, when `nodeId` is already the LAST row of its lane,
 * immediately after its OWNER at the owner's level ("move down and out"), which
 * is exactly {@link findOutdentSlot}'s semantics and is delegated to it rather
 * than duplicated.
 *
 * Returns `undefined` only when there is nowhere to go: `nodeId` is last in a
 * top-level lane with no owner, its next sibling is reachable only across a
 * `goto`, or stepping past it is not expressible as a single-edge splice (see
 * the `sourcesBranchEntry` guard below).
 *
 * CALLER GATE: unlike the up direction, the "and out" path here is NOT
 * self-evidently sound - it inherits `findOutdentSlot`'s append fallback, which
 * synthesizes an edge from the owner's own source handle and therefore reads as
 * a THIRD LANE when the owner is a bare branch owner. The gate needs no knowledge
 * of which path produced the slot: an append is visible in the returned slot's
 * own shape via {@link appendSourceNodeId}, and `computeSequentialMoveOptions`
 * (the canonical call site) refuses on exactly that, uniformly across down,
 * indent and outdent.
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

  // `nextId` has no forward spine continuation of its own. If it opens branch
  // lanes (a bare branch owner like `If`, whose branches rejoin at a
  // multi-incomer merge), "after nextId" cannot be expressed as a single-edge
  // splice: appending via nextId's own source handle would add a THIRD lane to
  // the branch instead of continuing past it (the exact corruption this guards
  // against). Disable the move rather than corrupt the graph (v1 limitation;
  // the same class of node the view layer's isBareBranchOwner gate covers).
  //
  // IMPRECISION, recorded so it is not mistaken for intent: `sourcesBranchEntry`
  // is also true for a CONTAINER (its body entry is a `branch-entry` connector
  // too), so a terminal container with no forward continuation of its own also
  // disables Move down for the row above it, even though appending past a
  // container would be representable. The consequence is one needlessly
  // greyed-out menu item, never a corrupt graph, so the over-broad test is left
  // as-is rather than narrowed with a registry predicate this layer cannot see.
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
 * Doubles as {@link findMoveDownSlot}'s "move down and out" fallback at the
 * bottom bound of a lane: the two operations mean the same thing there, so the
 * SAME caller gate applies to both (see that function's CALLER GATE note) - the
 * append fallback below is unsound for a bare branch owner, whose source
 * handles are its branch outputs.
 *
 * KNOWN LIMITATION: see `moveSubtree`'s doc comment on container idioms that
 * close a loop body via an edge back into the container itself - that edge
 * is invisible here and is not relocated when the body's tail changes.
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
 * The tail is resolved from ROW ORDER, not by walking connectors: see the scan
 * below for why a connector walk cannot cross a branch inside the body.
 *
 * WARNING: this helper does NOT self-guard against `nodeId` itself being a
 * bare branch owner (a row whose only outgoing edges are branch lanes - see
 * `isBareBranchOwner` in `../../components/SequentialCanvas/sequentialMoveActions.ts`).
 * It only checks the PRECEDING sibling's `collapsible` flag, not whether
 * `nodeId` is one. Callers MUST gate all four directions
 * (up/down/indent/outdent) on `isBareBranchOwner` first;
 * `computeSequentialMoveOptions` in that same file is the canonical call site
 * that does so - do not call this helper directly without that gate.
 *
 * SECOND CALLER GATE: when the resolved tail is ITSELF a bare branch owner whose
 * lanes never rejoin (the wireframe's loop body, which ends with an `If` whose
 * branches dead-end at the container boundary), the append below hangs a new
 * edge off that node's own source handle - which is a lane, not a next step. The
 * body genuinely has no "after the If" position in that shape. Callers detect it
 * with {@link appendSourceNodeId} + `isBareBranchOwner` and disable Indent, the
 * same conservative refusal Outdent and out-of-lane Move down already make.
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

  // Find the lane's tail POSITIONALLY, by scanning `projection.rows` forward
  // from the lane's first row, rather than by walking connectors from it.
  //
  // A connector walk cannot cross a branch, which is the whole problem: no
  // connector is ever sourced at a bare branch owner except its own
  // `branch-entry` lanes (the merge-backs that rejoin the lane are sourced at the
  // LANE TAILS, not at the owner), so a walk down a body shaped
  // `X -> If -> {P, Q} -> M` stops dead at the `If` and reports it as the tail -
  // then appends from the If's own source handle, i.e. a THIRD LANE. See
  // `makeMergedBranchBodyFixture`. Rows, by contrast, are emitted in pre-order,
  // so "the last row at this lane's level" is exactly the lane's last step no
  // matter how many branches and merges it runs through. The scan is also a
  // single bounded pass, which removes the need for the cycle guard the old
  // connector walk carried (a malformed projection can no longer spin it).
  // `firstRow` came out of a map built from this same array, so it is always
  // found. Indexed rather than sliced: the scan only reads forward, so copying
  // the tail of the array first would allocate for nothing.
  const startIndex = projection.rows.indexOf(firstRow);
  let tailId = firstRow.nodeId;
  for (let index = startIndex + 1; index < projection.rows.length; index += 1) {
    const row = projection.rows[index];
    if (row === undefined) break;
    // Left the owner's subtree entirely (back out to the owner's own level).
    if (row.depth < firstRow.depth) break;
    // Inside a nested container body or branch lane of one of THIS lane's rows.
    if (row.depth > firstRow.depth) continue;
    // A row at this level carrying `branch` metadata is the FIRST row of a
    // SIBLING lane (walkSpine only stamps that metadata on a lane's first row,
    // and clears it again after a merge), so this is where the first lane ends.
    // Tested on the metadata's presence rather than on a differing `handleId`,
    // which additionally covers a multi-ENTRY container body whose entries share
    // one source handle. Preserves the documented "first lane's tail" rule.
    if (row.branch !== undefined) break;
    // Synthetic add-step rows are not steps. REQUIRED, not defensive: a
    // populated lane's trailing 'append' placeholder is emitted at the same
    // depth and owner as the real tail, immediately AFTER it.
    if (row.lanePlaceholder) continue;
    // Defence-in-depth for a degraded projection: a row at this depth that is
    // owned by something else is not part of this lane, but it also must not
    // truncate the scan (the real tail may still follow).
    if (row.parentRowId !== prevId) continue;
    tailId = row.nodeId;
  }

  return {
    id: `slot:indentTail:${prevId}:${tailId}`,
    source: { nodeId: tailId, handleId: DEFAULT_SOURCE_HANDLE_ID },
    containerId: firstEntry.slot.containerId,
  };
}
