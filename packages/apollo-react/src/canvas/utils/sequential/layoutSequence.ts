import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Waypoint } from '../../components/Edges/shared/types';
import {
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_HANDLE_LEFT_OFFSET,
  SEQ_INDENT_PX,
  SEQ_ROW_GAP,
} from '../../constants';
import type {
  LayoutSequenceOptions,
  SequenceLayout,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

/**
 * Pure geometry pass over a projection (D11 keeps this stateless so a toggle is
 * a cheap array swap):
 *  - `x = depth * indent`;
 *  - `y` accumulates a fixed pitch (`barHeight + rowGap`) over VISIBLE rows only,
 *    so collapsing a subtree closes the gap without renumbering;
 *  - hidden rows are parked at their collapsed ancestor's y (they render with
 *    `hidden` upstream, but a position keeps xyflow happy);
 *  - `merge-back` / `goto` connectors get orthogonal elbow waypoints conforming
 *    to the Waypoint shape (components/Edges/shared/types.ts); `step` connectors
 *    are handle-routed by the edge component, so they carry none; `branch-entry`
 *    connectors all share ONE vertical spine dropping from the owner's own
 *    source-handle column, then elbow right into each target - so every lane
 *    (Then, Else, ...) traces the same shape and a lower lane simply extends
 *    farther down the shared spine before turning.
 */
export function layoutSequence(
  projection: SequenceProjection,
  options?: LayoutSequenceOptions
): SequenceLayout {
  const barWidth = options?.barWidth ?? SEQ_BAR_WIDTH;
  const barHeight = options?.barHeight ?? SEQ_BAR_HEIGHT;
  const rowGap = options?.rowGap ?? SEQ_ROW_GAP;
  const indent = options?.indent ?? SEQ_INDENT_PX;
  const pitch = barHeight + rowGap;

  const positions = new Map<string, XYPosition>();
  const rowsById = new Map<string, SequenceRow>(projection.rows.map((row) => [row.nodeId, row]));

  let cursorY = 0;
  let maxRight = 0;
  let maxBottom = 0;
  let orphanGapInserted = false;

  for (const row of projection.rows) {
    const x = row.depth * indent;
    if (row.visible) {
      // Append placeholders (the trailing "+" after a lane's last step) are
      // layout-neutral overlays: they sit in the gap just below the previous row
      // and reserve NO vertical space, so showing/hiding the plus (e.g. toggling
      // readonly) never moves a node.
      if (row.placeholderKind === 'append') {
        positions.set(row.nodeId, { x, y: cursorY - rowGap });
        continue;
      }
      // Reserve one synthetic-row pitch before the trailing orphan section.
      // SequentialCanvas places its terminal "Add step" placeholder in this
      // gap, so visual order and DOM order are main sequence -> placeholder ->
      // de-emphasized orphans.
      if (row.orphan && !orphanGapInserted) {
        cursorY += pitch;
        orphanGapInserted = true;
      }
      const position = { x, y: cursorY };
      positions.set(row.nodeId, position);
      cursorY += pitch;
      maxRight = Math.max(maxRight, x + barWidth);
      maxBottom = Math.max(maxBottom, position.y + barHeight);
    } else {
      // Park under the nearest collapsed ancestor so hidden clones overlap it.
      const anchorY = collapsedAncestorY(row, rowsById, positions);
      positions.set(row.nodeId, { x, y: anchorY });
    }
  }

  const connectorWaypoints = new Map<string, Waypoint[]>();
  for (const connector of projection.connectors) {
    if (connector.kind === 'merge-back' || connector.kind === 'goto') {
      const source = positions.get(connector.sourceRowId);
      const target = positions.get(connector.targetRowId);
      if (!source || !target) continue;
      // A container's body-exit merge-back (its forward continuation after the
      // indented body) has its source and target at the SAME depth, so both
      // handles already sit on the same spine column and the only rows between
      // them are the container's body -- which are indented to the RIGHT and
      // never cross the spine. Route it straight down (no waypoints) rather
      // than through the corridor, which would otherwise jog it out to the
      // left of the spine and read as a broken dashed line.
      if (connector.kind === 'merge-back' && source.x === target.x) continue;

      // A branch-lane merge-back routes through a corridor to the left of the
      // shallower endpoint. Exit below the source, traverse that corridor, and
      // enter above the target on its real handle column. Every branch that
      // converges on the same target therefore shares the corridor + final
      // approach as one visual join trunk, while retaining its own canonical
      // edge and source-side insertion slot.
      //
      // Gotos use the same safe orthogonal shape. They may point upward, but the
      // explicit source/target stubs still keep the path out of either bar.
      const laneX = Math.min(source.x, target.x) - indent / 2;
      const sourceHandleX = source.x + SEQ_HANDLE_LEFT_OFFSET;
      const targetHandleX = target.x + SEQ_HANDLE_LEFT_OFFSET;
      const sourceExitY = source.y + barHeight + rowGap / 2;
      const targetEntryY = target.y - rowGap / 2;

      // The last branch normally exits into the very same gap where the target
      // entry starts. Route it straight to that entry instead of sending it
      // past the target handle to the outer corridor and then doubling back.
      // Earlier branches still descend through the shared outer trunk below.
      if (connector.kind === 'merge-back' && sourceExitY >= targetEntryY) {
        connectorWaypoints.set(connector.id, [
          { id: `${connector.id}:wp0`, x: sourceHandleX, y: sourceExitY },
          { id: `${connector.id}:wp1`, x: targetHandleX, y: targetEntryY },
        ]);
        continue;
      }

      connectorWaypoints.set(connector.id, [
        { id: `${connector.id}:wp0`, x: sourceHandleX, y: sourceExitY },
        { id: `${connector.id}:wp1`, x: laneX, y: sourceExitY },
        { id: `${connector.id}:wp2`, x: laneX, y: targetEntryY },
        { id: `${connector.id}:wp3`, x: targetHandleX, y: targetEntryY },
      ]);
      continue;
    }

    if (connector.kind === 'branch-entry') {
      const source = positions.get(connector.sourceRowId);
      const target = positions.get(connector.targetRowId);
      if (!source || !target) continue;

      // Every branch lane shares ONE vertical spine dropping from the owner's
      // OWN source-handle column (source.x + handle offset), then elbows right
      // into the child's LEFT face at its vertical middle. So the first lane
      // (Then) and every later lane (Else, ...) trace the same shape - the later
      // lane just extends farther down the shared spine before turning - instead
      // of each lane getting its own corridor. The horizontal turn lands on the
      // child's mid-left (an indent read), leaving the row gap above the child
      // clear. The spine at the owner's handle x is always strictly left of
      // every deeper target bar's left edge (targets sit at least one indent
      // deeper), so the vertical run never crosses an intervening bar.
      const ownerHandleX = source.x + SEQ_HANDLE_LEFT_OFFSET;
      const targetMidY = target.y + barHeight / 2;
      connectorWaypoints.set(connector.id, [
        { id: `${connector.id}:wp0`, x: ownerHandleX, y: targetMidY },
        { id: `${connector.id}:wp1`, x: target.x, y: targetMidY },
      ]);
    }
  }

  const bounds = { x: 0, y: 0, width: maxRight, height: maxBottom };
  return { positions, connectorWaypoints, bounds };
}

function collapsedAncestorY(
  row: SequenceRow,
  rowsById: Map<string, SequenceRow>,
  positions: Map<string, XYPosition>
): number {
  let parentId = row.parentRowId;
  while (parentId) {
    const parent = rowsById.get(parentId);
    if (!parent) break;
    const parentPosition = positions.get(parent.nodeId);
    if (parent.visible && parentPosition) return parentPosition.y;
    parentId = parent.parentRowId;
  }
  return 0;
}
