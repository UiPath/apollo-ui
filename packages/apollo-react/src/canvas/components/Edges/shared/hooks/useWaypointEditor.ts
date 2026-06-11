import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { snapPointToGrid } from '../geometry';
import type { PathVertex, Point, Segment, Waypoint } from '../types';
import {
  insertWaypoint,
  materializePathWaypoints,
  moveSegmentByDelta,
  moveWaypoint,
  removeWaypoint,
  waypointsEqual,
} from '../waypoints';
import { useEdgeWaypointWriter } from './useEdgeWaypointWriter';

type DragState =
  | { type: 'none' }
  | { type: 'waypoint'; waypointIndex: number; initialWaypoints: Waypoint[] }
  | {
      type: 'segment';
      segment: Segment;
      initialWaypoints: Waypoint[];
      initialPathPoints: Point[];
    };

export type UseWaypointEditorArgs = {
  edgeId: string;
  waypoints: Waypoint[];
  pathPoints: PathVertex[];
  /**
   * When false the editor returns inert handlers, registers no listeners,
   * and reports `isDragging: false`. The hook still runs (rules of hooks)
   * but does no work.
   */
  enabled: boolean;
  /**
   * When provided, the editor calls this instead of writing to React Flow
   * state. The consumer owns persistence (controlled mode).
   */
  onChange?: (next: Waypoint[]) => void;
};

export type WaypointHandlers = {
  onMouseDown: (index: number, e: React.MouseEvent) => void;
  onDoubleClick: (index: number) => void;
};

export type SegmentHandlers = {
  onMouseDown: (segment: Segment, e: React.MouseEvent) => void;
  onDoubleClick: (segmentIndex: number, e: React.MouseEvent) => void;
};

export type WaypointEditor = {
  isDragging: boolean;
  /** Stable handlers for the SVG group rendering each waypoint. */
  waypointHandlers: WaypointHandlers;
  /** Stable handlers for each segment's interaction line. */
  segmentHandlers: SegmentHandlers;
};

/**
 * Owns drag state, window listeners, and waypoint mutation for a single edge.
 *
 * Mouse positions are converted to flow coordinates via the viewport so
 * dragging feels 1:1 in canvas coordinates regardless of pan/zoom. Mutations
 * are throttled via requestAnimationFrame to coalesce rapid mousemove events.
 *
 * The full derived path is materialized into concrete waypoints once at
 * segment-drag start so subsequent move ticks reuse stable waypoint IDs and
 * the segment indices line up with the stored list.
 */
export function useWaypointEditor(args: UseWaypointEditorArgs): WaypointEditor {
  const { edgeId, waypoints, pathPoints, enabled, onChange } = args;
  const { screenToFlowPosition } = useReactFlow();
  const writeWaypoints = useEdgeWaypointWriter(edgeId, onChange);

  const [dragState, setDragState] = useState<DragState>({ type: 'none' });
  const dragStartRef = useRef<Point | null>(null);
  const rafRef = useRef<number | null>(null);

  // Refs track the latest waypoints/pathPoints so the callbacks below stay
  // stable across renders. This keeps the mousemove effect from tearing down
  // listeners every drag tick and ensures the no-op dedupe compares against the
  // most recent waypoints.
  const waypointsRef = useRef(waypoints);
  const pathPointsRef = useRef(pathPoints);
  useEffect(() => {
    waypointsRef.current = waypoints;
    pathPointsRef.current = pathPoints;
  });

  const updateWaypoints = useCallback(
    (next: Waypoint[]) => {
      if (waypointsEqual(waypointsRef.current, next)) return;
      writeWaypoints(next);
    },
    [writeWaypoints]
  );

  useEffect(() => {
    if (!enabled || dragState.type === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        // Unsnapped conversion: moveWaypoint/moveSegmentByDelta snap the
        // resulting positions themselves; snapping the deltas here would
        // double-quantize the drag.
        const start = screenToFlowPosition(dragStartRef.current!, { snapToGrid: false });
        const current = screenToFlowPosition({ x: e.clientX, y: e.clientY }, { snapToGrid: false });
        const delta: Point = { x: current.x - start.x, y: current.y - start.y };

        if (dragState.type === 'waypoint') {
          const initial = dragState.initialWaypoints[dragState.waypointIndex];
          if (!initial) return;
          updateWaypoints(
            moveWaypoint(dragState.initialWaypoints, dragState.waypointIndex, {
              x: initial.x + delta.x,
              y: initial.y + delta.y,
            })
          );
        } else if (dragState.type === 'segment') {
          updateWaypoints(
            moveSegmentByDelta(
              dragState.initialWaypoints,
              dragState.segment,
              delta,
              dragState.initialPathPoints
            )
          );
        }
      });
    };

    const handleMouseUp = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setDragState({ type: 'none' });
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, dragState, updateWaypoints, screenToFlowPosition]);

  const waypointHandlers = useMemo<WaypointHandlers>(
    () => ({
      onMouseDown: (index: number, e: React.MouseEvent) => {
        if (!enabled) return;
        e.stopPropagation();
        e.preventDefault();
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setDragState({
          type: 'waypoint',
          waypointIndex: index,
          initialWaypoints: [...waypointsRef.current],
        });
      },
      onDoubleClick: (index: number) => {
        if (!enabled) return;
        updateWaypoints(removeWaypoint(waypointsRef.current, index));
      },
    }),
    [enabled, updateWaypoints]
  );

  const segmentHandlers = useMemo<SegmentHandlers>(
    () => ({
      onMouseDown: (segment: Segment, e: React.MouseEvent) => {
        if (!enabled) return;
        e.stopPropagation();
        e.preventDefault();
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        // Materialize the full derived path so segment math runs on a clean
        // 1:1 waypoint list; the grabbed segment's indices already match it.
        const materialized = materializePathWaypoints(pathPointsRef.current, waypointsRef.current);

        setDragState({
          type: 'segment',
          segment,
          initialWaypoints: materialized,
          initialPathPoints: [...pathPointsRef.current],
        });
      },
      onDoubleClick: (segmentIndex: number, e: React.MouseEvent) => {
        if (!enabled) return;
        // Keep React Flow's edge-level double-click handlers (selection,
        // onEdgeDoubleClick) out of waypoint insertion. Canvas double-click
        // zoom is suppressed separately via `nopan` on the handle element.
        e.stopPropagation();
        e.preventDefault();
        // Convert screen coords to canvas/flow coords so the new waypoint
        // lands at the cursor regardless of pan/zoom.
        const flowPoint = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const snapped = snapPointToGrid(flowPoint);
        updateWaypoints(
          insertWaypoint(pathPointsRef.current, waypointsRef.current, segmentIndex, snapped)
        );
      },
    }),
    [enabled, screenToFlowPosition, updateWaypoints]
  );

  const isDragging = enabled && dragState.type !== 'none';

  return useMemo(
    () => ({ isDragging, waypointHandlers, segmentHandlers }),
    [isDragging, waypointHandlers, segmentHandlers]
  );
}
