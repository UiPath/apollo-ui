import { PREVIEW_NODE_ID } from '../../constants';
import type {
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

const previewConnectorId = (slotId: string, side: 'incoming' | 'outgoing'): string =>
  `preview:${slotId}:${side}`;

function projectionWithPreviewConnectors(
  projection: SequenceProjection,
  slot: InsertionSlot,
  previewRow: SequenceRow,
  replacedLaneNodeId?: string
): SequenceConnector[] {
  const matchedIndex = projection.connectors.findIndex(
    (connector) =>
      connector.slot?.id === slot.id ||
      (replacedLaneNodeId !== undefined && connector.targetRowId === replacedLaneNodeId)
  );
  const matched = matchedIndex === -1 ? undefined : projection.connectors[matchedIndex];
  const connectors = matched
    ? projection.connectors.filter((_, index) => index !== matchedIndex)
    : [...projection.connectors];

  const sourceId = slot.source?.nodeId ?? matched?.sourceRowId;
  const targetId = slot.target?.nodeId ?? matched?.targetRowId;

  if (sourceId) {
    const sourceRow = projection.rows.find((row) => row.nodeId === sourceId);
    const ownsNestedRows = projection.rows.some((row) => row.parentRowId === sourceId);
    const inferredKind =
      previewRow.depth > (sourceRow?.depth ?? previewRow.depth)
        ? 'branch-entry'
        : ownsNestedRows
          ? 'merge-back'
          : 'step';
    connectors.push({
      id: previewConnectorId(slot.id, 'incoming'),
      kind: matched?.kind ?? inferredKind,
      sourceRowId: sourceId,
      targetRowId: PREVIEW_NODE_ID,
      label: matched?.label ?? previewRow.branch?.label,
      slot,
    });
  }

  if (targetId && targetId !== replacedLaneNodeId) {
    connectors.push({
      id: previewConnectorId(slot.id, 'outgoing'),
      kind: 'step',
      sourceRowId: PREVIEW_NODE_ID,
      targetRowId: targetId,
      slot,
    });
  }

  return connectors;
}

/**
 * Returns a copy of `projection` with one synthetic preview row (keyed by
 * {@link PREVIEW_NODE_ID}) spliced into `rows` at the position the Add Node
 * insert would land. Feeding this to {@link layoutSequence} while the Add Node
 * panel is open makes the gap open by exactly one row pitch, positions the
 * preview bar in its real slot, and recomputes EVERY connector's waypoints from
 * the shifted geometry -- so branch/merge/goto elbows follow the shift instead
 * of keeping stale absolute waypoints (the old position-only post-pass left
 * them behind). Pure: `projection` is never mutated, and the projection memo it
 * feeds stays untouched (D12) -- only the layout memo re-runs for the insert.
 *
 * The row's depth/index mirror where the committed node parents (see
 * `sequentialOnBeforeNodeAdded`, which parents on `slot.containerId`):
 *  - splice (slot.target): before the target row, at the target's depth;
 *  - append into an empty container (slot.containerId === slot.source): as the
 *    container's first child (one level deeper), right after the container row;
 *  - sibling/leaf append: after the source's whole subtree, at the source depth.
 * If the slot's anchor row can't be found, the projection is returned unchanged.
 */
export function projectionWithPreviewRow(
  projection: SequenceProjection,
  slot: InsertionSlot
): SequenceProjection {
  const { rows } = projection;

  // Inserting into an empty branch lane: swap that lane's placeholder row for the
  // preview IN PLACE, so the preview bar keeps the lane's depth, parent, and
  // mid-left entry (the generic append logic below would mis-place it at the
  // parent's depth). The stale placeholder node is dropped by the canvas while
  // this insert is active.
  const laneIndex = rows.findIndex((row) => row.lanePlaceholder?.id === slot.id);
  if (laneIndex !== -1) {
    const laneRow = rows[laneIndex]!;
    const swapped: SequenceRow = {
      nodeId: PREVIEW_NODE_ID,
      depth: laneRow.depth,
      parentRowId: laneRow.parentRowId,
      branch: laneRow.branch,
      collapsible: false,
      collapsed: false,
      visible: true,
    };
    return {
      ...projection,
      rows: [...rows.slice(0, laneIndex), swapped, ...rows.slice(laneIndex + 1)],
      connectors: projectionWithPreviewConnectors(projection, slot, swapped, laneRow.nodeId),
    };
  }

  const targetId = slot.target?.nodeId;
  const sourceId = slot.source?.nodeId;

  let insertIndex: number;
  let depth: number;
  let parentRowId: string | undefined;

  if (targetId) {
    const targetIndex = rows.findIndex((row) => row.nodeId === targetId);
    if (targetIndex === -1) return projection;
    const targetRow = rows[targetIndex]!;
    insertIndex = targetIndex;
    depth = targetRow.depth;
    parentRowId = targetRow.parentRowId;
  } else if (sourceId) {
    const sourceIndex = rows.findIndex((row) => row.nodeId === sourceId);
    if (sourceIndex === -1) return projection;
    const sourceRow = rows[sourceIndex]!;
    if (slot.containerId === sourceId) {
      // Append as the first child of an (empty) container body.
      depth = sourceRow.depth + 1;
      parentRowId = sourceId;
      insertIndex = sourceIndex + 1;
    } else {
      // Sibling / leaf append: land after the source's whole subtree (the
      // contiguous run of strictly-deeper rows immediately following it).
      depth = sourceRow.depth;
      parentRowId = sourceRow.parentRowId;
      let idx = sourceIndex + 1;
      while (idx < rows.length && rows[idx]!.depth > sourceRow.depth) idx++;
      insertIndex = idx;
    }
  } else {
    return projection;
  }

  const previewRow: SequenceRow = {
    nodeId: PREVIEW_NODE_ID,
    depth,
    parentRowId,
    collapsible: false,
    collapsed: false,
    visible: true,
  };

  return {
    ...projection,
    rows: [...rows.slice(0, insertIndex), previewRow, ...rows.slice(insertIndex)],
    connectors: projectionWithPreviewConnectors(projection, slot, previewRow),
  };
}
