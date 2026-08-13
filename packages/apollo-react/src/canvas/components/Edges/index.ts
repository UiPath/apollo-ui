export { CanvasEdge } from './CanvasEdge';
export * from './SequenceEdge';
export { EdgeCrossingsProvider } from './shared/crossings';
// Pure route geometry. Exported so a host that moves nodes itself (auto-layout,
// paste, subflow expand/collapse, container auto-fit) can keep stored routes
// attached with the same math the drag path uses, instead of reimplementing it.
export { calculateAutoWaypoints, snapPointToGrid } from './shared/geometry';
export type {
  EdgeRouter,
  RouteAnchor,
  RouteAnchorPair,
  RoutedEdge,
  RouteEdgeRequest,
  RouteNodeLookup,
  RouteNodeRequest,
  RouteRequest,
} from './shared/routing';
export {
  defaultEdgeRouter,
  defaultIsRoutable,
  resolveRouteAnchors,
  toRouteNode,
  useGraphRouter,
} from './shared/routing';
export type {
  CanvasEdgeData,
  CanvasEdgeProps,
  EdgeRouting,
  EdgeStrokeStyle,
  PathJump,
  Point,
  Segment,
  SegmentOrientation,
  Waypoint,
} from './shared/types';
export type { RebalanceEndpoint } from './shared/waypoints';
export {
  generateWaypointId,
  moveWaypoint,
  rebalanceWaypoints,
  waypointsEqual,
  waypointsPositionallyEqual,
} from './shared/waypoints';
