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

/**
 * A crossing on a rendered path where the line hops over another edge with a
 * small arc. `segmentIndex` indexes the polyline segment the jump sits on:
 * segment `i` runs from `points[i]` to `points[i + 1]`.
 */
export type PathJump = {
  segmentIndex: number;
  point: Point;
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

  /**
   * Draw a small arc where this edge crosses another edge, so criss-crossing
   * lines read as passing over rather than joining. Waypoint routing only.
   *
   * Only edges that opt in take part, both as the line that hops and as the
   * line hopped over, and at each crossing it is the horizontal segment that
   * arcs. Set it uniformly across a graph (via `defaultEdgeOptions` or the edge
   * factory) for a consistent result: with a mixed config, a crossing between an
   * opted-in edge and an opted-out one is drawn flat.
   */
  enableLineJumps?: boolean;

  // Data the editing behavior operates on
  waypoints?: Waypoint[];

  /**
   * Pre-computed waypoints from a graph router (see `EdgeRouter`) or a host's
   * own layout engine. Used as the path geometry when no manual `waypoints` are
   * present. Manual edits always take priority — the moment the user drags a
   * routed segment, the routed points materialize into `waypoints` and the edge
   * becomes manual.
   *
   * Routes supplied here are treated as auto-routed (see {@link autoRouted}),
   * which is what a layout engine wants: bends get node-face clearance, so an
   * edge leaving a multi-handle node face does not kink at the handle.
   *
   * A host with its own layout engine should match the renderer's fallback
   * convention for the no-route case, or every laid-out edge visibly jumps the
   * first time its node is dragged. For nodes in adjacent layers the fallback
   * (`calculateAutoWaypoints`) puts the turn at the **midpoint between the two
   * handles**, i.e. at half the layer gap.
   */
  routedWaypoints?: Waypoint[];

  /**
   * Whether this edge's route came from a router/layout engine rather than from
   * the user. Auto-routed bends get node-face clearance applied at render time;
   * manual bends are drawn exactly where they were placed.
   *
   * Defaults to `waypoints.length === 0`, i.e. a route arriving in
   * `routedWaypoints` is auto-routed and one in `waypoints` is manual. Set it
   * explicitly when that inference is wrong for your graph — for instance when a
   * host persists both fields and needs the distinction to survive a round trip
   * independently of which key the route landed in.
   *
   * Setting it makes the edge's provenance yours to maintain. The default
   * inference self-corrects when the user drags a routed segment (the points
   * materialize into `waypoints`, so the edge reads as manual from then on); an
   * explicit `true` does not, and in controlled mode — where
   * `onWaypointsChange` is supplied — the editor never touches `data`, so
   * nothing but the host can clear it. Reset it there, or the user's own bends
   * keep getting face clearance applied to them.
   */
  autoRouted?: boolean;

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
