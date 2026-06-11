import type { Edge, EdgeProps, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';

export type Point = XYPosition;

export type Waypoint = Point & {
  id: string;
};

/**
 * A point on the rendered path, tagged with provenance. `waypointIndex` is the
 * index of the stored waypoint this vertex represents, or `-1` for the source/
 * target anchors and for derived elbows (stub corners, interior orthogonal
 * joints). Lets the editor map a rendered segment back to the stored waypoints.
 */
export type PathVertex = Point & {
  waypointIndex: number;
};

export type SegmentOrientation = 'horizontal' | 'vertical';

export type Segment = {
  id: string;
  start: Point;
  end: Point;
  orientation: SegmentOrientation;
  /** Index of the waypoint before this segment (-1 for source) */
  waypointIndexBefore: number;
  /** Index of the waypoint after this segment (waypoints.length for target) */
  waypointIndexAfter: number;
};

export type EdgeStrokeStyle = 'solid' | 'dashed';

/**
 * Edge routing strategy.
 *
 * - `waypoint` — orthogonal segments with optional draggable waypoints.
 * - `handle`   — smooth-step path resolved from handle positions, including
 *                support for self-loops and `loopBack` target handles.
 *
 * Rendering defaults to `waypoint` when unset, but graph routers
 * (`useGraphRouter`) only feed edges that declare `'waypoint'` explicitly —
 * undeclared edges are never written to.
 */
export type EdgeRouting = 'waypoint' | 'handle';

/**
 * Single data shape for the unified canvas edge.
 *
 * Visual fields render unconditionally. Behavior fields (`enable*`) gate the
 * downstream effects of each hook (event listeners, callbacks, animations).
 * Underlying store subscriptions still run — turning a flag off avoids
 * listener installs and renders driven by the hook's outputs, not the
 * subscription itself.
 */
export type CanvasEdgeData = {
  // Visual
  strokeStyle?: EdgeStrokeStyle;
  hideArrowHead?: boolean;
  label?: string | null;

  // Visual state flags
  isInvalid?: boolean;
  isDiffAdded?: boolean;
  isDiffRemoved?: boolean;

  // Routing strategy. Defaults to 'waypoint'.
  routing?: EdgeRouting;

  // Behavior enablement
  enableEditing?: boolean;
  enableExecution?: boolean;
  enableToolbar?: boolean;

  // Data the editing behavior operates on
  waypoints?: Waypoint[];

  /**
   * Pre-computed waypoints from a graph router (see `EdgeRouter`). Used as
   * the path geometry when no manual `waypoints` are present. Manual edits
   * always take priority — the moment the user drags a routed segment, the
   * routed points materialize into `waypoints` and the edge becomes manual.
   */
  routedWaypoints?: Waypoint[];

  /**
   * Controlled-mutation callback. When present, the editor calls this instead
   * of writing to React Flow state — the consumer is responsible for
   * persisting the new waypoints (e.g., to enable undo/redo, debouncing,
   * server sync, or validation rejection). When absent, the editor mutates
   * `setEdges` directly (uncontrolled mode).
   */
  onWaypointsChange?: (next: Waypoint[]) => void;
};

export type CanvasEdgeProps = EdgeProps<Edge<CanvasEdgeData>>;
