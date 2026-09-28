import { render, waitFor } from '@testing-library/react';
import {
  type Edge,
  type Node,
  ReactFlowProvider,
  useEdges,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';

// The global canvas test setup stubs React Flow out entirely; this hook is
// store-orchestration logic, so it needs the real provider/store/subscription.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

import type { CanvasEdgeData } from '../types';
import type { EdgeRouter, RouteRequest } from './types';
import { useGraphRouter } from './useGraphRouter';

const nodes: Node[] = [
  { id: 'a', position: { x: 0, y: 0 }, width: 100, height: 40, data: {} },
  { id: 'b', position: { x: 300, y: 0 }, width: 100, height: 40, data: {} },
];

function makeEdge(id: string, data: CanvasEdgeData = {}): Edge {
  return { id, source: 'a', target: 'b', data };
}

/** An edge that opted into graph routing (`routing: 'waypoint'` declared). */
function makeRoutableEdge(id: string, data: CanvasEdgeData = {}): Edge {
  return makeEdge(id, { routing: 'waypoint', ...data });
}

/** Routes every requested edge through one fixed bend, recording requests. */
function makeRecordingRouter() {
  const requests: RouteRequest[] = [];
  const router: EdgeRouter = {
    route(request) {
      requests.push(request);
      return request.edges.map((edge) => ({
        edgeId: edge.edgeId,
        waypoints: [{ id: `${edge.edgeId}-r0`, x: 200, y: 100 }],
      }));
    },
  };
  return { router, requests };
}

function Probe({ router, latestEdges }: { router: EdgeRouter; latestEdges: { current: Edge[] } }) {
  useGraphRouter(router);
  latestEdges.current = useEdges();
  return null;
}

function renderRouter(initialEdges: Edge[], router: EdgeRouter, graphNodes: Node[] = nodes) {
  const latestEdges = { current: initialEdges };
  render(
    // defaultNodes/defaultEdges (not initial*) make the store own the elements,
    // so the hook's setEdges writes land instead of no-opping as "controlled".
    <ReactFlowProvider defaultNodes={graphNodes} defaultEdges={initialEdges}>
      <Probe router={router} latestEdges={latestEdges} />
    </ReactFlowProvider>
  );
  return latestEdges;
}

describe('useGraphRouter', () => {
  it('routes only opted-in edges — handle, manual-waypoint, and undeclared edges are excluded', async () => {
    const { router, requests } = makeRecordingRouter();
    renderRouter(
      [
        makeRoutableEdge('routable'),
        makeEdge('preset', { routing: 'handle' }),
        makeRoutableEdge('manual', { waypoints: [{ id: 'w1', x: 150, y: 50 }] }),
        // SequenceEdge at the store level: its preset applies routing: 'handle'
        // at render time only, so store data carries no routing field. Routing
        // is opt-in precisely so edges like this are never touched.
        makeEdge('sequenceLike', { enableExecution: true }),
      ],
      router
    );

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
    expect(requests[0]!.edges.map((edge) => edge.edgeId)).toEqual(['routable']);
  });

  it('writes routedWaypoints to routable edges without touching other edge data', async () => {
    const { router } = makeRecordingRouter();
    const latest = renderRouter(
      [makeRoutableEdge('routable'), makeEdge('sequenceLike', { enableExecution: true })],
      router
    );

    await waitFor(() => {
      const routed = latest.current.find((edge) => edge.id === 'routable');
      expect((routed?.data as CanvasEdgeData).routedWaypoints).toEqual([
        { id: 'routable-r0', x: 200, y: 100 },
      ]);
    });
    const sequenceLike = latest.current.find((edge) => edge.id === 'sequenceLike');
    expect('routedWaypoints' in (sequenceLike?.data as CanvasEdgeData)).toBe(false);
  });

  it('removes stale routedWaypoints when an edge has been taken over manually', async () => {
    const { router } = makeRecordingRouter();
    const latest = renderRouter(
      [
        makeRoutableEdge('takenOver', {
          waypoints: [{ id: 'w1', x: 150, y: 50 }],
          routedWaypoints: [{ id: 'stale', x: 1, y: 2 }],
        }),
      ],
      router
    );

    await waitFor(() => {
      const edge = latest.current.find((e) => e.id === 'takenOver');
      expect('routedWaypoints' in (edge?.data as CanvasEdgeData)).toBe(false);
    });
    // the manual waypoints themselves are untouched
    const edge = latest.current.find((e) => e.id === 'takenOver');
    expect((edge?.data as CanvasEdgeData).waypoints).toEqual([{ id: 'w1', x: 150, y: 50 }]);
  });

  it('does not re-run the router in response to its own routedWaypoints write', async () => {
    const { router, requests } = makeRecordingRouter();
    const latest = renderRouter([makeRoutableEdge('routable')], router);

    await waitFor(() => {
      const edge = latest.current.find((e) => e.id === 'routable');
      expect((edge?.data as CanvasEdgeData).routedWaypoints).toBeDefined();
    });
    expect(requests.length).toBe(1);
  });

  it('requests nested nodes in absolute coordinates, not parent-relative ones', async () => {
    const { router, requests } = makeRecordingRouter();
    renderRouter(
      [{ id: 'nested', source: 'child', target: 'b', data: { routing: 'waypoint' } }],
      router,
      [
        { id: 'container', position: { x: 500, y: 300 }, width: 400, height: 200, data: {} },
        {
          id: 'child',
          parentId: 'container',
          // Parent-relative, as React Flow stores it for a child node.
          position: { x: 40, y: 20 },
          width: 100,
          height: 40,
          data: {},
        },
        { id: 'b', position: { x: 1000, y: 320 }, width: 100, height: 40, data: {} },
      ]
    );

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));

    const child = requests[0]!.nodes.find((node) => node.id === 'child');
    expect(child).toMatchObject({ x: 540, y: 320 });

    // Anchors sit on the child's absolute box, so the route is planned in the
    // same coordinate frame the edge is drawn in.
    const routed = requests[0]!.edges[0]!;
    expect(routed.source).toMatchObject({ x: 640, y: 340 });
    expect(routed.target).toMatchObject({ x: 1000, y: 340 });
  });

  it('never invokes the router when no edge is routable and nothing is stale', async () => {
    const { router, requests } = makeRecordingRouter();
    const latest = renderRouter(
      [makeEdge('p1', { routing: 'handle' }), makeEdge('p2', { enableExecution: true })],
      router
    );

    await waitFor(() => expect(latest.current.length).toBe(2));
    expect(requests.length).toBe(0);
  });
});
