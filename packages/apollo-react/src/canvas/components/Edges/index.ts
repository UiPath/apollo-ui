export { CanvasEdge } from './CanvasEdge';
export * from './SequenceEdge';
export { EdgeCrossingsProvider } from './shared/crossings';
// Pure route geometry. Exported so a host that moves nodes itself (auto-layout,
// paste, subflow expand/collapse, container auto-fit) can keep stored routes
// attached with the same math the drag path uses, instead of reimplementing it.
export {
  calculateAutoWaypoints,
  isSegmentInteractable,
  isSegmentPerpendicular,
  snapPointToGrid,
} from './shared/geometry';
// Building blocks of `CanvasEdge`, for hosts that render their own edge types over their own
// edge model.
export { useEdgeGeometry, useNodeDragRebalance, useWaypointEditor } from './shared/hooks';
export type {
  EdgeArrowProps,
  EdgeLabelProps,
  EdgePathProps,
  SegmentDragHandleProps,
  WaypointHandleProps,
} from './shared/primitives';
export {
  EdgeArrow,
  EdgeLabel,
  EdgePath,
  SegmentDragHandle,
  WaypointHandle,
} from './shared/primitives';
export type { EdgeColorState } from './shared/resolveEdgeColor';
export { resolveEdgeColor } from './shared/resolveEdgeColor';
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
