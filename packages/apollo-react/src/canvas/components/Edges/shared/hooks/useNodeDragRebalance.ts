import {
  type Position,
  type ReactFlowState,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useLayoutEffect, useRef } from 'react';
import type { Point, Waypoint } from '../types';
import { rebalanceWaypoints, waypointsEqual } from '../waypoints';
import { useEdgeWaypointWriter } from './useEdgeWaypointWriter';

export type UseNodeDragRebalanceArgs = {
  edgeId: string;
  source: string;
  target: string;
  /** Current source/target handle coordinates (as passed to the geometry). */
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  waypoints: Waypoint[];
  /** When false the stored waypoints are returned unchanged (no rebalancing). */
  enabled: boolean;
  onChange?: (next: Waypoint[]) => void;
};

/**
 * Makes an edge's waypoints follow a node drag. While either endpoint node is
 * being dragged, the stored waypoints are remapped (see {@link
 * rebalanceWaypoints}) relative to the anchor box captured at drag start, so
 * the bends track the moving node instead of being left behind. The remapped
 * positions are returned for rendering and persisted once the drag ends.
 *
 * Returns the waypoints to render/route with: rebalanced during a drag, the
 * stored ones otherwise.
 */
export function useNodeDragRebalance(args: UseNodeDragRebalanceArgs): Waypoint[] {
  const {
    edgeId,
    source,
    target,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    waypoints,
    enabled,
    onChange,
  } = args;

  // `enabled` first so disabled edges pay one boolean test per store update
  // instead of two Map lookups.
  const dragging = useStore(
    (state: ReactFlowState) =>
      enabled &&
      !!(state.nodeLookup.get(source)?.dragging || state.nodeLookup.get(target)?.dragging)
  );

  const write = useEdgeWaypointWriter(edgeId, onChange);

  // Pre-drag baseline: refreshed every non-dragging render, frozen during a
  // drag so the remap always maps from the original positions (mapping from the
  // continuously-updated stored waypoints would compound and drift).
  const baselineRef = useRef<{ s: Point; t: Point; waypoints: Waypoint[] }>({
    s: { x: sourceX, y: sourceY },
    t: { x: targetX, y: targetY },
    waypoints,
  });
  // Latest rebalanced result, captured so it can be persisted on drag end.
  const lastRebalancedRef = useRef<Waypoint[] | null>(null);
  const prevDraggingRef = useRef(false);

  const active = enabled && dragging && waypoints.length > 0;

  if (!dragging) {
    baselineRef.current = {
      s: { x: sourceX, y: sourceY },
      t: { x: targetX, y: targetY },
      waypoints,
    };
  }

  let display = waypoints;
  if (active) {
    const { s, t, waypoints: w0 } = baselineRef.current;
    display = rebalanceWaypoints(
      w0,
      { position: sourcePosition, from: s, to: { x: sourceX, y: sourceY } },
      { position: targetPosition, from: t, to: { x: targetX, y: targetY } }
    );
    lastRebalancedRef.current = display;
  }

  // Persist the final rebalanced positions when the drag ends, in a layout
  // effect so the write lands before paint and the line never flashes back to
  // the stale positions.
  useLayoutEffect(() => {
    const wasDragging = prevDraggingRef.current;
    prevDraggingRef.current = dragging;
    if (!wasDragging || dragging) return;

    const final = lastRebalancedRef.current;
    lastRebalancedRef.current = null;
    if (enabled && final && !waypointsEqual(waypoints, final)) {
      write(final);
    }
  });

  return display;
}
