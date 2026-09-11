/**
 * Pure-function benchmarks for the canvas hot paths that run per node.
 *
 * Run with: pnpm --filter @uipath/apollo-react bench
 *
 * Every function here executes once per node per invalidation on a live
 * canvas, so at 500 nodes a 0.1ms regression per call costs 50ms per sweep.
 */
import { bench } from 'vitest';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { HandleGroupManifest } from '../schema/node-definition';
import { resolveDisplay, resolveHandles } from './manifest-resolver';
import { resolveCollisions } from './NodeUtils';
import { areNodePropsEqualIgnoringPosition } from './nodePropsEqual';

const NODE_COUNT = 500;

// ---------------------------------------------------------------------------
// manifest-resolver: runs inside BaseNode's memos (and again in useButtonHandles)
// ---------------------------------------------------------------------------

const STATIC_HANDLE_GROUPS: HandleGroupManifest[] = [
  {
    position: 'left',
    handles: [{ id: 'in', type: 'target', handleType: 'input' }],
  },
  {
    position: 'right',
    handles: [
      { id: 'out', type: 'source', handleType: 'output', showButton: true },
      { id: 'error', type: 'source', handleType: 'output', visible: 'hasErrorBranch' },
    ],
  },
] as HandleGroupManifest[];

const REPEAT_HANDLE_GROUPS: HandleGroupManifest[] = [
  {
    position: 'bottom',
    handles: [
      {
        id: 'case-{index}',
        type: 'source',
        handleType: 'output',
        label: 'Case {index}: {item.label}',
        repeat: 'cases',
        itemVar: 'item',
        indexVar: 'index',
      },
    ],
  },
] as HandleGroupManifest[];

const contexts = Array.from({ length: NODE_COUNT }, (_, i) => ({
  nodeId: `node-${i}`,
  display: { label: `Node ${i}` },
  inputs: { hasErrorBranch: i % 2 === 0 },
  cases: Array.from({ length: 5 }, (_, c) => ({ label: `Case ${c}` })),
}));

bench(`resolveHandles: static manifest x ${NODE_COUNT} nodes`, () => {
  for (const ctx of contexts) {
    resolveHandles(STATIC_HANDLE_GROUPS, ctx);
  }
});

bench(`resolveHandles: repeat expansion (5 items) x ${NODE_COUNT} nodes`, () => {
  for (const ctx of contexts) {
    resolveHandles(REPEAT_HANDLE_GROUPS, ctx);
  }
});

const MANIFEST_DISPLAY = {
  label: 'Task',
  canvasLabel: 'Task',
  icon: 'timer',
  shape: 'square' as const,
  color: '#333',
};

bench(`resolveDisplay x ${NODE_COUNT} nodes`, () => {
  for (const ctx of contexts) {
    resolveDisplay(MANIFEST_DISPLAY, ctx);
  }
});

// ---------------------------------------------------------------------------
// nodePropsEqual: the memo comparator runs for EVERY node on EVERY parent sweep
// (e.g. 60x/second for all nodes inside a dragged container)
// ---------------------------------------------------------------------------

type AnyNodeProps = NodeProps<Node<Record<string, unknown>>>;

const makeProps = (i: number): AnyNodeProps =>
  ({
    id: `node-${i}`,
    type: 'task',
    data: { display: { label: `Node ${i}` } },
    selected: false,
    dragging: false,
    draggable: true,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: i * 10,
    positionAbsoluteY: i * 10,
    selectable: true,
    deletable: true,
  }) as AnyNodeProps;

const prevProps = Array.from({ length: NODE_COUNT }, (_, i) => makeProps(i));
const movedProps = prevProps.map((p) => ({
  ...p,
  positionAbsoluteX: (p.positionAbsoluteX as number) + 5,
  positionAbsoluteY: (p.positionAbsoluteY as number) + 5,
}));

bench(`areNodePropsEqualIgnoringPosition: position-only sweep x ${NODE_COUNT}`, () => {
  for (let i = 0; i < NODE_COUNT; i++) {
    areNodePropsEqualIgnoringPosition(prevProps[i]!, movedProps[i]!);
  }
});

// ---------------------------------------------------------------------------
// resolveCollisions: bulk layout pass over the whole canvas (O(n^2) per sweep)
// ---------------------------------------------------------------------------

const overlappingNodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: `node-${i}`,
  type: 'task',
  // 20-column grid at 80px pitch with 96px nodes → neighbors overlap slightly.
  position: { x: (i % 20) * 80, y: Math.floor(i / 20) * 80 },
  width: 96,
  height: 96,
  data: {},
}));

bench(
  `resolveCollisions: ${NODE_COUNT} overlapping nodes`,
  () => {
    resolveCollisions(overlappingNodes, { maxIterations: 10 });
  },
  { time: 1000 }
);
