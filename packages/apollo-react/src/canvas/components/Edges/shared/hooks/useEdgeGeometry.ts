import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { useEdgePath } from '../../../../hooks';
import { ARROW_ANGLE_MAP, ARROW_OFFSETS, EDGE_CONSTANTS } from '../constants';
import { useEdgeLineJumps } from '../crossings';
import {
  buildPathVertices,
  createRoundedPath,
  extractSegments,
  getPathArcMidpoint,
} from '../geometry';
import type { EdgeRouting, PathVertex, Point, Segment, Waypoint } from '../types';

const EMPTY_VERTICES: PathVertex[] = [];
const EMPTY_SEGMENTS: Segment[] = [];

export type UseEdgeGeometryArgs = {
  routing: EdgeRouting;
  /** Edge id — the key this edge's polyline is published under for line jumps. */
  edgeId: string;
  /** Source node id — used by handle routing for loop detection. */
  sourceNodeId: string;
  /** Target node id — used by handle routing for loop detection. */
  targetNodeId: string;
  sourceHandleId?: string | null;
  targetHandleId?: string | null;
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  /**
   * Waypoints for `waypoint` routing. Either manual (user-placed) or
   * router-produced. `autoRouted` distinguishes the two and controls whether
   * bends get face-clearance.
   */
  waypoints: Waypoint[];
  /**
   * True when `waypoints` are router-produced (not user-placed), so the path
   * builder may shift bends off the node faces. Manual waypoints render as-is.
   */
  autoRouted?: boolean;
  /**
   * When false, `segments` is always empty and segment extraction is skipped.
   * Segments are only consumed by the editing chrome, so consumers with
   * editing disabled avoid the per-render allocation. Defaults to true.
   */
  enableSegments?: boolean;
  /**
   * When true, target endpoint is inset by `ARROW_OFFSETS[targetPosition]`
   * so the line stops at the same visual distance from the target as the
   * arrow polygon would have filled.
   */
  hideArrowHead?: boolean;
  /**
   * When true, this edge shares its polyline with the other opted-in edges and
   * hops over the ones it crosses. Waypoint routing only — handle-routed edges
   * produce a path string with no vertices to intersect.
   */
  enableLineJumps?: boolean;
  /**
   * Corner radius (px) for the rounded (smooth-step) waypoint path. Defaults to
   * `EDGE_CONSTANTS.BORDER_RADIUS`. `createRoundedPath` clamps it to half the
   * shorter adjacent segment, so an over-large value degrades gracefully on
   * short segments. Only affects `waypoint` routing.
   */
  borderRadius?: number;
};

export type EdgeGeometry = {
  /** SVG path `d` attribute. */
  edgePath: string;
  /** Ordered, provenance-tagged vertices of the path. Empty for handle routing. */
  pathPoints: PathVertex[];
  /** Per-segment metadata for hit-testing and editing. Empty for handle routing. */
  segments: Segment[];
  /** Position recommended for centered labels along the path. */
  labelPoint: Point;
  /** Arrow geometry (independent of routing strategy). */
  arrow: {
    angle: number;
    offset: Point;
  };
};

/**
 * Compute edge geometry for the active routing strategy. The waypoint pipeline
 * (vertices → segments → rounded path) runs only for `waypoint` routing;
 * handle-routed edges skip it entirely. The handle strategy (`useEdgePath`) is
 * a memoized hook that must be called unconditionally (rules of hooks), so for
 * waypoint routing it is fed constant inputs — its memo never invalidates and
 * no smooth-step path is recomputed on coordinate changes.
 */
export function useEdgeGeometry(args: UseEdgeGeometryArgs): EdgeGeometry {
  const {
    routing,
    edgeId,
    sourceNodeId,
    targetNodeId,
    sourceHandleId,
    targetHandleId,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    waypoints,
    autoRouted = false,
    enableSegments = true,
    hideArrowHead = false,
    enableLineJumps = false,
    borderRadius = EDGE_CONSTANTS.BORDER_RADIUS,
  } = args;

  const arrowOffset = ARROW_OFFSETS[targetPosition];
  const isWaypoint = routing === 'waypoint';
  const isHandle = routing === 'handle';

  const pathPoints = useMemo(
    () =>
      isWaypoint
        ? buildPathVertices(
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            waypoints,
            autoRouted
          )
        : EMPTY_VERTICES,
    [
      isWaypoint,
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      waypoints,
      autoRouted,
    ]
  );

  const segments = useMemo(
    () => (enableSegments ? extractSegments(pathPoints) : EMPTY_SEGMENTS),
    [enableSegments, pathPoints]
  );

  // Publishing the vertices and reading back the crossings happens between the
  // two halves of the waypoint pipeline: jumps are derived from `pathPoints` and
  // only ever change the path string, so this can't feed back into itself.
  const jumps = useEdgeLineJumps(edgeId, pathPoints, isWaypoint && enableLineJumps);

  const waypointPath = useMemo(
    () => createRoundedPath(pathPoints, borderRadius, jumps),
    [pathPoints, borderRadius, jumps]
  );

  const handle = useEdgePath({
    sourceNodeId: isHandle ? sourceNodeId : '',
    targetNodeId: isHandle ? targetNodeId : '',
    sourceHandleId: isHandle ? sourceHandleId : null,
    targetHandleId: isHandle ? targetHandleId : null,
    sourceX: isHandle ? sourceX : 0,
    sourceY: isHandle ? sourceY : 0,
    sourcePosition,
    targetX: isHandle ? (hideArrowHead ? targetX + arrowOffset.x : targetX) : 0,
    targetY: isHandle ? (hideArrowHead ? targetY + arrowOffset.y : targetY) : 0,
    targetPosition,
  });

  const labelPoint = useMemo(
    () => (isHandle ? { x: handle.labelX, y: handle.labelY } : getPathArcMidpoint(pathPoints)),
    [isHandle, handle.labelX, handle.labelY, pathPoints]
  );

  const arrow = { angle: ARROW_ANGLE_MAP[targetPosition], offset: arrowOffset };

  if (isHandle) {
    return {
      edgePath: handle.edgePath,
      pathPoints: EMPTY_VERTICES,
      segments: EMPTY_SEGMENTS,
      labelPoint,
      arrow,
    };
  }

  return {
    edgePath: waypointPath,
    pathPoints,
    segments,
    labelPoint,
    arrow,
  };
}
