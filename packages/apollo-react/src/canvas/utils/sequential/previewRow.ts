import { PREVIEW_NODE_ID } from '../../constants';
import { rowFor } from './graph-helpers';
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
    const sourceRow = rowFor(projection, sourceId);
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
 * Copy of `projection` with a synthetic {@link PREVIEW_NODE_ID} row spliced where the
 * Add Node insert would land, so `layoutSequence` opens the gap and reroutes every
 * connector. Depth and index mirror where `sequentialOnBeforeNodeAdded` parents the
 * committed node. Unchanged if the slot's anchor row cannot be found.
 */
export function projectionWithPreviewRow(
  projection: SequenceProjection,
  slot: InsertionSlot
): SequenceProjection {
  const { rows } = projection;

  // Empty lane: swap the placeholder row in place so the preview keeps the lane's
  // depth and parent (the generic append below would land at the owner's depth).
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
      depth = sourceRow.depth + 1;
      parentRowId = sourceId;
      insertIndex = sourceIndex + 1;
    } else {
      // Land after the source's whole subtree.
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
