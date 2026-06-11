import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Waypoint } from '../types';

/** Per-edge anchor point. Coordinates are absolute canvas coords. */
export type RouteAnchor = {
  nodeId: string;
  handleId?: string | null;
  x: number;
  y: number;
  position: Position;
};

/** A single edge as seen by the router. */
export type RouteEdgeRequest = {
  edgeId: string;
  source: RouteAnchor;
  target: RouteAnchor;
};

/** A node as seen by the router. Width/height let routers do obstacle avoidance. */
export type RouteNodeRequest = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RouteRequest = {
  edges: RouteEdgeRequest[];
  nodes: RouteNodeRequest[];
};

export type RoutedEdge = {
  edgeId: string;
  /** Intermediate waypoints (excluding source/target endpoints). */
  waypoints: Waypoint[];
};

/**
 * Pluggable router contract. Per-edge routers ignore `req.nodes`; obstacle-aware
 * routers (ELK, dagre, custom) consume the full graph. Implementations may be
 * synchronous (return RoutedEdge[] directly) or asynchronous (return a Promise,
 * for routers running in a worker).
 */
export interface EdgeRouter {
  route(req: RouteRequest): RoutedEdge[] | Promise<RoutedEdge[]>;
}
