import { calculateAutoWaypoints } from '../geometry';
import type { EdgeRouter, RoutedEdge, RouteRequest } from './types';

/**
 * Per-edge naive router — independent orthogonal routing for each edge with
 * no obstacle awareness. Equivalent to CanvasEdge's built-in fallback when no
 * waypoints exist. Useful as a baseline implementation, a starting point for
 * custom routers, or to satisfy the EdgeRouter contract without external deps.
 *
 * IDs are deterministic (`${edgeId}-r${i}`), so repeated calls with identical
 * positions produce value-equal waypoints (fresh objects each call) — which
 * keeps the `waypointsPositionallyEqual` write-guard stable and makes test
 * assertions predictable.
 */
export const defaultEdgeRouter: EdgeRouter = {
  route(req: RouteRequest): RoutedEdge[] {
    return req.edges.map((edge) => {
      const points = calculateAutoWaypoints(
        edge.source.x,
        edge.source.y,
        edge.source.position,
        edge.target.x,
        edge.target.y,
        edge.target.position
      );
      return {
        edgeId: edge.edgeId,
        waypoints: points.map((p, i) => ({ id: `${edge.edgeId}-r${i}`, x: p.x, y: p.y })),
      };
    });
  },
};
