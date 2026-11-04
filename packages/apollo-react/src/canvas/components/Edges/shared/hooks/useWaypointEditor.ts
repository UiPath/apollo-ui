import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { snapPointToGrid } from '../geometry';
import type { PathVertex, Point, Segment, Waypoint } from '../types';
import {
  insertWaypoint,
  isCornerWaypoint,
  materializePathWaypoints,
  moveCornerWaypoint,
  moveSegmentByDelta,
  moveWaypointConstrained,
  normalizeWaypoints,
  type PathBuilder,
  removeWaypoint,
  waypointsEqual,
} from '../waypoints';
import { useEdgeWaypointWriter } from './useEdgeWaypointWriter';

type DragState =
  | { type: 'none' }
  | {
      type: 'waypoint';
      waypointIndex: number;
      initialWaypoints: Waypoint[];
      /** Drawn path at drag start; corner drags read the runs meeting the waypoint from it. */
      initialPathPoints: PathVertex[];
      /** A corner drags both of its runs; a waypoint on a straight run moves off it only. */
      mode: 'corner' | 'run';
    }
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
  /**
   * Rebuilds the rendered path for a candidate waypoint list (from
   * `useEdgeGeometry`), so drags can be previewed against the drawn route.
   */
  buildPath: PathBuilder;
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
 *
 * A waypoint drag picks its mode at mousedown from the drawn path: a corner
 * drags both runs meeting at it ({@link moveCornerWaypoint}); a waypoint on a
 * straight run moves off the run only ({@link moveWaypointConstrained}). On
 * release, waypoints the drag left off a corner are tidied without changing
 * the drawn route ({@link normalizeWaypoints}).
 */
export function useWaypointEditor(args: UseWaypointEditorArgs): WaypointEditor {
  const { edgeId, waypoints, pathPoints, enabled, onChange, buildPath } = args;
  const { screenToFlowPosition } = useReactFlow();
  const writeWaypoints = useEdgeWaypointWriter(edgeId, onChange);

  const [dragState, setDragState] = useState<DragState>({ type: 'none' });
  const dragStartRef = useRef<Point | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPointerRef = useRef<Point | null>(null);

  // Refs track the latest waypoints/pathPoints so the callbacks below stay
  // stable across renders. This keeps the mousemove effect from tearing down
  // listeners every drag tick and ensures the no-op dedupe compares against the
  // most recent waypoints.
  const waypointsRef = useRef(waypoints);
  const pathPointsRef = useRef(pathPoints);
  const buildPathRef = useRef(buildPath);
  useEffect(() => {
    waypointsRef.current = waypoints;
    pathPointsRef.current = pathPoints;
    buildPathRef.current = buildPath;
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

    // Last grid cell a waypoint drag resolved to. A waypoint drag's result
    // depends only on that cell, so frames that stay inside it are skipped
    // (stub ids are minted per call, so they would otherwise write every frame).
    let lastTarget: Point | null = null;

    // Waypoints for the cursor at `client`, always computed from the drag-start
    // state so ticks never compound. Returns null when there is nothing to write.
    const computeDrag = (client: Point, skipSameCell: boolean): Waypoint[] | null => {
      // Unsnapped conversion: the move helpers snap the resulting positions
      // themselves; snapping the deltas here would double-quantize the drag.
      const start = screenToFlowPosition(dragStartRef.current!, { snapToGrid: false });
      const current = screenToFlowPosition(client, { snapToGrid: false });
      const delta: Point = { x: current.x - start.x, y: current.y - start.y };

      if (dragState.type === 'waypoint') {
        const { initialWaypoints, waypointIndex, initialPathPoints, mode } = dragState;
        const initial = initialWaypoints[waypointIndex];
        if (!initial) return null;
        const target = snapPointToGrid({ x: initial.x + delta.x, y: initial.y + delta.y });
        if (skipSameCell && lastTarget?.x === target.x && lastTarget.y === target.y) return null;
        lastTarget = target;
        return mode === 'corner'
          ? moveCornerWaypoint(initialWaypoints, waypointIndex, target, initialPathPoints)
          : moveWaypointConstrained(initialWaypoints, waypointIndex, target, buildPathRef.current);
      }
      if (dragState.type === 'segment') {
        return moveSegmentByDelta(
          dragState.initialWaypoints,
          dragState.segment,
          delta,
          dragState.initialPathPoints
        );
      }
      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const client = { x: e.clientX, y: e.clientY };
      lastPointerRef.current = client;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const next = computeDrag(client, true);
        if (next) updateWaypoints(next);
      });
    };

    const handleMouseUp = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Settle on the final pointer position (a pending frame may have been
      // dropped above), then tidy any waypoint the drag left off a corner.
      // Only after an actual move: a plain click must not touch the edge, and
      // a just-inserted waypoint legitimately sits on its segment.
      const pointer = lastPointerRef.current;
      const final = pointer && computeDrag(pointer, false);
      if (final && !waypointsEqual(final, dragState.initialWaypoints)) {
        updateWaypoints(
          dragState.type === 'waypoint' ? normalizeWaypoints(final, buildPathRef.current) : final
        );
      }
      setDragState({ type: 'none' });
      dragStartRef.current = null;
      lastPointerRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, dragState, updateWaypoints, screenToFlowPosition]);

  const beginDrag = useCallback((e: React.MouseEvent, state: DragState) => {
    e.stopPropagation();
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    lastPointerRef.current = null;
    setDragState(state);
  }, []);

  const waypointHandlers = useMemo<WaypointHandlers>(
    () => ({
      onMouseDown: (index: number, e: React.MouseEvent) => {
        if (!enabled) return;
        const initialPathPoints = [...pathPointsRef.current];
        beginDrag(e, {
          type: 'waypoint',
          waypointIndex: index,
          initialWaypoints: [...waypointsRef.current],
          initialPathPoints,
          mode: isCornerWaypoint(initialPathPoints, index) ? 'corner' : 'run',
        });
      },
      onDoubleClick: (index: number) => {
        if (!enabled) return;
        updateWaypoints(removeWaypoint(waypointsRef.current, index));
      },
    }),
    [enabled, beginDrag, updateWaypoints]
  );

  const segmentHandlers = useMemo<SegmentHandlers>(
    () => ({
      onMouseDown: (segment: Segment, e: React.MouseEvent) => {
        if (!enabled) return;
        // Materialize the full derived path so segment math runs on a clean
        // 1:1 waypoint list; the grabbed segment's indices already match it.
        const materialized = materializePathWaypoints(pathPointsRef.current, waypointsRef.current);

        beginDrag(e, {
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
    [enabled, beginDrag, screenToFlowPosition, updateWaypoints]
  );

  const isDragging = enabled && dragState.type !== 'none';

  return useMemo(
    () => ({ isDragging, waypointHandlers, segmentHandlers }),
    [isDragging, waypointHandlers, segmentHandlers]
  );
}
