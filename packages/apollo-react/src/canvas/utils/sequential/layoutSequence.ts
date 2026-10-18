import type { XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Waypoint } from '../../components/Edges/shared/types';
import {
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_HANDLE_LEFT_OFFSET,
  SEQ_INDENT_PX,
  SEQ_ROW_GAP,
} from '../../constants';
import { rowsById } from './graph-helpers';
import type {
  LayoutSequenceOptions,
  SequenceLayout,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';

/**
 * Pure geometry pass: `x = depth * indent`, `y` accumulates a fixed pitch over visible
 * rows, hidden rows park at their collapsed ancestor's y. `merge-back`/`goto`/`branch-entry`
 * connectors get orthogonal waypoints; `step` connectors are handle-routed and carry none.
 */
export interface SequenceMetrics {
  barWidth: number;
  barHeight: number;
  rowGap: number;
  indent: number;
  /** Vertical distance between consecutive row tops: `barHeight + rowGap`. */
  pitch: number;
}

/** Resolves layout options against the SEQ_* defaults, so every consumer agrees on geometry. */
export function resolveSequenceMetrics(options?: LayoutSequenceOptions): SequenceMetrics {
  const barHeight = options?.barHeight ?? SEQ_BAR_HEIGHT;
  const rowGap = options?.rowGap ?? SEQ_ROW_GAP;
  return {
    barWidth: options?.barWidth ?? SEQ_BAR_WIDTH,
    barHeight,
    rowGap,
    indent: options?.indent ?? SEQ_INDENT_PX,
    pitch: barHeight + rowGap,
  };
}

export function layoutSequence(
  projection: SequenceProjection,
  options?: LayoutSequenceOptions
): SequenceLayout {
  const { barWidth, barHeight, rowGap, indent, pitch } = resolveSequenceMetrics(options);

  const positions = new Map<string, XYPosition>();
  const rowIndex = rowsById(projection);

  let cursorY = 0;
  let maxRight = 0;
  let maxBottom = 0;
  let orphanGapInserted = false;

  for (const row of projection.rows) {
    const x = row.depth * indent;
    if (row.visible) {
      // Append placeholders reserve no vertical space, so toggling them never moves a node.
      if (row.placeholderKind === 'append') {
        positions.set(row.nodeId, { x, y: cursorY - rowGap });
        continue;
      }
      // Reserve a pitch for the canvas's terminal "Add step" placeholder before orphans.
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
      const anchorY = collapsedAncestorY(row, rowIndex, positions);
      positions.set(row.nodeId, { x, y: anchorY });
    }
  }

  const connectorWaypoints = new Map<string, Waypoint[]>();
  for (const connector of projection.connectors) {
    if (connector.kind === 'merge-back' || connector.kind === 'goto') {
      const source = positions.get(connector.sourceRowId);
      const target = positions.get(connector.targetRowId);
      if (!source || !target) continue;
      // Same-depth merge-back (a container's continuation): the body between is indented
      // right and never crosses the spine, so route straight down with no waypoints.
      if (connector.kind === 'merge-back' && source.x === target.x) continue;

      // Route through a corridor left of the shallower endpoint so converging branches
      // share one visual trunk. Gotos use the same shape; stubs keep them clear of bars.
      const laneX = Math.min(source.x, target.x) - indent / 2;
      const sourceHandleX = source.x + SEQ_HANDLE_LEFT_OFFSET;
      const targetHandleX = target.x + SEQ_HANDLE_LEFT_OFFSET;
      const sourceExitY = source.y + barHeight + rowGap / 2;
      const targetEntryY = target.y - rowGap / 2;

      // The last branch exits into the target's own entry gap: route straight to it
      // instead of out to the corridor and back.
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

      // All lanes share one spine down from the owner's handle column, elbowing right
      // into each child's mid-left. Targets sit at least one indent deeper, so the
      // spine never crosses a bar.
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
  rowIndex: ReadonlyMap<string, SequenceRow>,
  positions: Map<string, XYPosition>
): number {
  let parentId = row.parentRowId;
  while (parentId) {
    const parent = rowIndex.get(parentId);
    if (!parent) break;
    const parentPosition = positions.get(parent.nodeId);
    if (parent.visible && parentPosition) return parentPosition.y;
    parentId = parent.parentRowId;
  }
  return 0;
}
