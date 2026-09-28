import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

// The suite-wide mock in `src/test/setup.ts` renders ReactFlow as a bare div
// that never emits changes, which hides how the real store round-trips our
// nodes. These tests deliberately run against real React Flow.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

import type {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from './BaseCanvas';

const LOCKED_IDS: ReadonlySet<string> = new Set(['locked']);

/** One locked node plus one free node; `lockedProps` seeds the locked one. */
const makeNodes = (lockedProps: Partial<Node> = {}): Node[] => [
  { id: 'locked', position: { x: 0, y: 0 }, data: { v: 1 }, ...lockedProps },
  { id: 'free', position: { x: 100, y: 0 }, data: { v: 1 } },
];

const renderWithRealFlow = (nodes: Node[], edges: Edge[] = []) => {
  const changes: NodeChange[] = [];
  const edgeChanges: EdgeChange[] = [];
  let instance: ReactFlowInstance | undefined;

  const Harness = () => {
    instance = useReactFlow();
    return (
      <div style={{ width: 800, height: 600 }}>
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          readOnlyNodeIds={LOCKED_IDS}
          onNodesChange={(c) => changes.push(...c)}
          onEdgesChange={(c) => edgeChanges.push(...c)}
        />
      </div>
    );
  };

  render(
    <ReactFlowProvider>
      <Harness />
    </ReactFlowProvider>
  );

  return {
    changes,
    edgeChanges,
    flush: async (run: (instance: ReactFlowInstance) => void) => {
      await act(async () => {
        run(instance as ReactFlowInstance);
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    },
    replaceItem: (id: string) =>
      changes.find(
        (c): c is NodeChange & { id: string; item: Node } => c.type === 'replace' && c.id === id
      )?.item,
  };
};

describe('BaseCanvas read-only enforcement against real React Flow', () => {
  // `'absent'` means the node must come back with no `deletable` key at all.
  // Otherwise consumers persist our lock as their own data and unlocking the
  // node can never undo it.
  it.each([
    ['a locked node authored without the key', {}, 'locked', 'absent'],
    ['a locked node authored deletable: true', { deletable: true }, 'locked', true],
    ['a consumer-owned deletable: false', { deletable: false }, 'locked', false],
    ['an unlocked node', {}, 'free', 'absent'],
  ] as const)('round-trips %s through a replace change', async (_, lockedProps, id, expected) => {
    const { flush, replaceItem } = renderWithRealFlow(makeNodes(lockedProps));

    await flush((instance) => instance.updateNodeData(id, { v: 99 }));

    const item = replaceItem(id);
    expect(item?.data).toEqual({ v: 99 });
    if (expected === 'absent') {
      expect(item && 'deletable' in item).toBe(false);
    } else {
      expect(item?.deletable).toBe(expected);
    }
  });

  // The reason enforcement is a delete-time veto rather than a flag: whatever
  // the store holds is what a consumer saves, and a persisted `deletable: false`
  // is indistinguishable from their own, so unlocking could never undo it.
  it('keeps enforcement flags out of the saved graph', async () => {
    const { flush } = renderWithRealFlow(makeNodes());
    let saved: ReturnType<ReactFlowInstance['toObject']> | undefined;

    await flush((instance) => {
      saved = instance.toObject();
    });

    for (const node of saved?.nodes ?? []) {
      expect('deletable' in node).toBe(false);
    }
  });

  // Vetoing the node is only half the job: React Flow collects the edges of
  // every node in the delete set, so its connections have to come back out too.
  it('keeps the edges of a locked node when its deletion is vetoed', async () => {
    const edges: Edge[] = [{ id: 'locked-free', source: 'locked', target: 'free' }];
    const { edgeChanges, flush } = renderWithRealFlow(makeNodes(), edges);

    await flush((instance) => instance.deleteElements({ nodes: [{ id: 'locked' }] }));

    expect(edgeChanges.filter((c) => c.type === 'remove')).toEqual([]);
  });

  // Kept at this level because the veto runs inside `deleteElements`, a path the
  // mocked-flow suites cannot exercise.
  it('still blocks deletion of a locked node', async () => {
    const { changes, flush } = renderWithRealFlow(makeNodes());

    await flush((instance) =>
      instance.deleteElements({ nodes: [{ id: 'locked' }, { id: 'free' }] })
    );

    const removed = changes.filter((c) => c.type === 'remove').map((c) => c.id);
    expect(removed).not.toContain('locked');
    expect(removed).toContain('free');
  });
});
