import {
  type ConnectionMode,
  type Edge,
  type ReactFlowState,
  useReactFlow,
  useStore,
  useStoreApi,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect } from 'react';
import { getNodeDimensions } from '../../../../utils/container';
import type { CanvasEdgeData } from '../types';
import { waypointsPositionallyEqual } from '../waypoints';
import { type RouteNodeLookup, resolveRouteAnchors, toRouteNode } from './anchors';
import type { EdgeRouter, RoutedEdge, RouteEdgeRequest, RouteRequest } from './types';

/**
 * An edge is router-controlled only while it explicitly declares
 * `routing: 'waypoint'` in its data and the user hasn't taken over with
 * manual waypoints. Routing is opt-in by design: presets that apply their
 * routing mode at render time (SequenceEdge sets `routing: 'handle'` in the
 * component, not in store data) and custom/legacy edge types are
 * indistinguishable from waypoint edges at the store level, so anything that
 * doesn't declare itself is left untouched rather than silently polluted
 * with router output. Note this is stricter than rendering: CanvasEdge
 * *renders* waypoint routing when `routing` is unset, but is only
 * router-fed when it declares it.
 *
 * The manual-waypoints clause is load-bearing: it is what makes the router
 * yield to `useWaypointEditor` (which materializes routed points into
 * `data.waypoints` on the first segment drag) and what arms the stale
 * `routedWaypoints` cleanup. Custom predicates should compose with it rather
 * than replace it: `(edge) => defaultIsRoutable(edge) && isMyEdge(edge)`.
 */
export function defaultIsRoutable(edge: Edge): boolean {
  const data = edge.data as CanvasEdgeData | undefined;
  return data?.routing === 'waypoint' && !data.waypoints?.length;
}

/**
 * Subscribes to graph changes, runs the supplied router, and writes the
 * results back to each edge's `data.routedWaypoints`. Manual `data.waypoints`
 * always take priority over routed output (CanvasEdge picks manual first).
 *
 * Only routable edges are included in requests and written to: by default
 * those declaring `routing: 'waypoint'` without manual waypoints (see
 * {@link defaultIsRoutable}; overridable for graphs with their own
 * discriminator). When an edge leaves router control — the user materialized
 * manual waypoints, or the predicate changed — its stale `routedWaypoints`
 * key is removed so render-only routing metadata never leaks into
 * persistence or undo state.
 *
 * The subscription is a fingerprint of the routing-relevant store state (node
 * geometry, edge connectivity, routability), so selection changes and the
 * hook's own `routedWaypoints` writes do not re-run the router. Position
 * changes still re-route at frame rate during a drag. The cleanup flag drops
 * stale RESULTS, but does NOT abort the router's in-flight work. For
 * expensive routers (e.g. ELK in a worker), gate routing on `onNodeDragStop`
 * or wrap the router in a debouncer; otherwise the worker burns CPU on every
 * superseded request.
 *
 * Both `router` and `isRoutable` must be referentially stable (module
 * constants or memoized) — new identities re-run routing every render.
 *
 * Anchors and node boxes are absolute canvas coordinates resolved from React
 * Flow's measured handle bounds (see {@link resolveRouteAnchors}), so nested
 * graphs and multi-handle nodes are routed from the same points the renderer
 * draws from. Before handles are measured, anchors fall back to the node-box
 * faces of a left-to-right flow.
 */
export function useGraphRouter(
  router: EdgeRouter,
  isRoutable: (edge: Edge) => boolean = defaultIsRoutable
): void {
  const { getEdges, setEdges } = useReactFlow();
  const store = useStoreApi();
  const signature = useStore(
    useCallback((state: ReactFlowState) => routeSignature(state, isRoutable), [isRoutable])
  );

  useEffect(() => {
    // `signature` is the dependency that drives this effect; the store is read
    // imperatively so the effect doesn't also re-run on unrelated store churn.
    if (!signature) return;

    let cancelled = false;

    const apply = (routes: RoutedEdge[]) => {
      if (cancelled) return;
      const byId = new Map(routes.map((r) => [r.edgeId, r]));
      setEdges((current) => {
        // Copy-on-write: drag frames usually reconcile to no change, so only
        // clone the array once an edge actually differs.
        let next: Edge[] | null = null;
        for (let i = 0; i < current.length; i++) {
          const edge = current[i]!;
          const reconciled = reconcileEdge(edge, byId, isRoutable);
          if (reconciled !== edge) {
            next ??= [...current];
            next[i] = reconciled;
          }
        }
        return next ?? current;
      });
    };

    const edges = getEdges();
    if (!edges.some(isRoutable)) {
      // Nothing to route. Reconcile only if some edge still carries stale
      // router output (it just became manual); otherwise skip the store
      // dispatch entirely — this is the steady state for handle-routed
      // graphs, hit on every drag frame.
      const hasStale = edges.some(
        (edge) => (edge.data as CanvasEdgeData | undefined)?.routedWaypoints !== undefined
      );
      if (hasStale) apply([]);
      return;
    }

    const { nodeLookup, connectionMode } = store.getState();
    const request = buildRequest(nodeLookup, edges, isRoutable, connectionMode);
    if (request.edges.length === 0) {
      // Routable edges exist but none could be resolved (dangling endpoints).
      apply([]);
      return;
    }

    const result = router.route(request);

    if (result instanceof Promise) {
      result.then(apply).catch((err) => {
        if (cancelled) return;
        console.error('[useGraphRouter] router.route() rejected:', err);
      });
    } else {
      apply(result);
    }

    return () => {
      cancelled = true;
    };
  }, [signature, router, isRoutable, store, getEdges, setEdges]);
}

/**
 * One edge's reconcile step: strip stale router output from edges that left
 * router control, write fresh routed waypoints when positions changed, and
 * return the same reference when nothing needs to happen.
 */
function reconcileEdge(
  edge: Edge,
  routesById: Map<string, RoutedEdge>,
  isRoutable: (edge: Edge) => boolean
): Edge {
  const data = edge.data as CanvasEdgeData | undefined;

  if (!isRoutable(edge)) {
    if (data?.routedWaypoints === undefined) return edge;
    // The edge left router control — drop the render-only cache so it can't
    // be persisted alongside the user's manual waypoints.
    const { routedWaypoints: _removed, ...rest } = data;
    return { ...edge, data: rest };
  }

  const route = routesById.get(edge.id);
  if (!route) return edge;
  const prev = data?.routedWaypoints ?? [];
  // Position-only compare: arbitrary consumer routers may generate fresh ids
  // each call, so id-aware equality would always miss and the
  // write→re-render→write cycle would never terminate.
  if (waypointsPositionallyEqual(prev, route.waypoints)) return edge;
  return { ...edge, data: { ...edge.data, routedWaypoints: route.waypoints } };
}

/**
 * Fingerprint of everything `buildRequest` reads. Excludes selection state and
 * edge `data` — except each edge's routability, so the transition to/from
 * manual waypoints triggers a reconcile (routing or cleanup) — and notably
 * excludes `routedWaypoints`, so the router's own output never re-triggers it.
 *
 * Node boxes are absolute, and each node carries its handle counts, so the first
 * measurement — and any port added or removed afterwards — re-routes even when
 * no node box changed. Resolving each edge's anchors here instead would be the
 * exact input, but it roughly triples the cost of a selector that runs on every
 * store update; anything that moves a handle without changing the handle set
 * moves the node box too.
 */
function routeSignature(state: ReactFlowState, isRoutable: (edge: Edge) => boolean): string {
  let sig = '';
  for (const node of state.nodeLookup.values()) {
    const { width, height } = getNodeDimensions(node);
    const { x, y } = node.internals.positionAbsolute;
    const bounds = node.internals.handleBounds;
    sig += `${node.id}:${x},${y},${width},${height},${bounds?.source?.length ?? -1},${bounds?.target?.length ?? -1}|`;
  }
  for (const edge of state.edges) {
    sig += `${edge.id}:${edge.source}/${edge.sourceHandle ?? ''}>${edge.target}/${edge.targetHandle ?? ''}:${isRoutable(edge) ? 'r' : 'm'}|`;
  }
  return sig;
}

function buildRequest(
  nodeLookup: RouteNodeLookup,
  edges: Edge[],
  isRoutable: (edge: Edge) => boolean,
  connectionMode: ConnectionMode
): RouteRequest {
  const routeNodes = Array.from(nodeLookup.values(), toRouteNode);

  const routeEdges: RouteEdgeRequest[] = [];
  for (const edge of edges) {
    if (!isRoutable(edge)) continue;
    const anchors = resolveRouteAnchors(nodeLookup, edge, connectionMode);
    if (!anchors) continue;

    routeEdges.push({
      edgeId: edge.id,
      source: anchors.source,
      target: anchors.target,
    });
  }

  return { nodes: routeNodes, edges: routeEdges };
}
