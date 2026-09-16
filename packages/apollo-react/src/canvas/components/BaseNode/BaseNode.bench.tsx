/**
 * BaseNode component benchmarks at 500-node scale.
 *
 * Run with: pnpm --filter @uipath/apollo-react bench
 * (or from packages/apollo-react: pnpm bench)
 *
 * Measures the BaseNode render pipeline itself (manifest resolution, memo
 * comparison, geometry vars, handle elements) with xyflow store hooks stubbed,
 * so numbers isolate OUR per-node cost from xyflow's internals. Baselines on a
 * dev container (happy-dom, 2025-class CI hardware):
 *
 * - mount of 500 nodes should stay well under ~2s
 * - a position-only re-render sweep across 500 nodes should stay in the
 *   low-millisecond range (memo comparator fast path, no body renders)
 * - single-node interaction updates must not scale with node count
 *
 * These are benchmarks, not CI-gating tests; the deterministic render-count
 * guards live in BaseNode.perf.test.tsx.
 */
import { render } from '@testing-library/react';
import { bench, vi } from 'vitest';

const { rfNodeStore, rfState } = vi.hoisted(() => ({
  rfNodeStore: new Map<string, { height?: number }>(),
  rfState: { current: { connection: { inProgress: false } } },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return {
    ...actual,
    Handle: ({ id, type }: { id?: string; type?: string }) => (
      <div data-handleid={id} data-handletype={type} />
    ),
    useStore: (selector: (s: unknown) => unknown) => selector(rfState.current),
    useUpdateNodeInternals: () => () => {},
    useReactFlow: () => ({
      updateNodeData: () => {},
      updateNode: (id: string, patch: { height?: number }) => {
        rfNodeStore.set(id, { ...rfNodeStore.get(id), ...patch });
      },
      getNode: (id: string) => rfNodeStore.get(id),
    }),
  };
});

vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  useNodesData: () => null,
}));

import { makeNodes, NodeGrid, PERF_NODE_COUNT } from './BaseNode.perf-fixtures';

const baseNodes = makeNodes(PERF_NODE_COUNT);

bench(
  `mount ${PERF_NODE_COUNT} BaseNodes`,
  () => {
    const view = render(<NodeGrid nodes={baseNodes} />);
    view.unmount();
  },
  { time: 0, iterations: 5, warmupIterations: 1 }
);

bench(
  'mount 1 BaseNode (per-node cost floor)',
  () => {
    const view = render(<NodeGrid nodes={baseNodes.slice(0, 1)} />);
    view.unmount();
  },
  { time: 500 }
);

{
  // Container-drag frame: all 500 nodes get new absolute positions. The memo
  // comparator must swallow the sweep without rendering a single node body.
  let view: ReturnType<typeof render> | null = null;
  let offset = 0;
  bench(
    `position-only re-render sweep across ${PERF_NODE_COUNT} nodes (memo fast path)`,
    () => {
      if (!view) view = render(<NodeGrid nodes={baseNodes} />);
      offset += 1;
      view.rerender(
        <NodeGrid
          nodes={baseNodes.map((p) => ({
            ...p,
            positionAbsoluteX: p.positionAbsoluteX + offset,
          }))}
        />
      );
    },
    { time: 1000 }
  );
}

{
  // Single-node interaction: toggle selection on one node in a 500-node canvas.
  // Cost must track the one changed node, not the canvas size.
  let view: ReturnType<typeof render> | null = null;
  let selected = false;
  bench(
    `toggle selection of 1 node among ${PERF_NODE_COUNT}`,
    () => {
      if (!view) view = render(<NodeGrid nodes={baseNodes} />);
      selected = !selected;
      const next = [...baseNodes];
      next[0] = { ...baseNodes[0]!, selected };
      view.rerender(<NodeGrid nodes={next} />);
    },
    { time: 1000 }
  );
}
