import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { type ComponentProps, createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as stories from './BaseCanvas.stories';

const { specializedNodeStores, connectionStores } = vi.hoisted(() => ({
  specializedNodeStores: new Map<number, { getState: () => unknown }>(),
  connectionStores: new Map<number, { getState: () => unknown }>(),
}));

// Cancels the global xyflow stub from `src/test/canvas-mocks.ts` (loaded for every
// file by `test/setup.ts`): these stories need the real store, not the stub.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
}));

vi.mock('../AgentCanvas/nodes/AgentNode', async () => {
  const [{ useNodeTypeRegistry }, { createElement }] = await Promise.all([
    import('../../core'),
    import('react'),
  ]);

  return {
    AgentNodeElement: () => {
      const nodeTypeRegistry = useNodeTypeRegistry();
      const hasAgentManifest =
        nodeTypeRegistry.getManifest('uipath.agent.autonomous') !== undefined;

      return createElement(
        'span',
        undefined,
        hasAgentManifest ? 'Agent manifest available' : 'Manifest Undefined'
      );
    },
  };
});

vi.mock('./BaseCanvas', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./BaseCanvas')>();
  const [{ useStoreApi }, { createElement }] = await Promise.all([
    import('@uipath/apollo-react/canvas/xyflow/react'),
    import('react'),
  ]);

  return {
    ...actual,
    BaseCanvas: (props: ComponentProps<typeof actual.BaseCanvas>) => {
      const store = useStoreApi();

      if (props.edges?.some((edge) => edge.id === 'connection-comparison-edge')) {
        connectionStores.set(props.readOnlyNodeIds?.size ?? 0, store);
        return createElement('div');
      }

      if (props.nodes?.[0]?.type === 'comparison-agent') {
        specializedNodeStores.set(props.readOnlyNodeIds?.size ?? 0, store);

        const node = props.nodes[0];
        const NodeComponent = props.nodeTypes?.[node.type ?? ''];
        if (NodeComponent) {
          return createElement(NodeComponent, {
            id: node.id,
            type: node.type,
            data: node.data,
            selected: node.selected ?? false,
            dragging: node.dragging ?? false,
            draggable: node.draggable ?? true,
            selectable: node.selectable ?? true,
            deletable: node.deletable ?? true,
            isConnectable: node.connectable ?? true,
            positionAbsoluteX: node.position.x,
            positionAbsoluteY: node.position.y,
            zIndex: node.zIndex ?? 0,
          });
        }
      }

      return createElement('div');
    },
  };
});

const { PerNodeReadOnly } = composeStories(stories);

describe('specialized node comparison previews', () => {
  it('keeps locked and unlocked previews independent when a node tab renders', () => {
    specializedNodeStores.clear();

    render(createElement(PerNodeReadOnly));

    expect([...specializedNodeStores.keys()].sort()).toEqual([0, 1]);
    expect(new Set([...specializedNodeStores.values()].map((store) => store.getState)).size).toBe(
      2
    );
  });

  it('provides the agent manifest when AgentNode comparisons render', () => {
    render(createElement(PerNodeReadOnly));

    expect(screen.getAllByText('Agent manifest available')).toHaveLength(2);
    expect(screen.queryByText('Manifest Undefined')).not.toBeInTheDocument();
  });

  it('keeps the connection comparison previews independent', () => {
    connectionStores.clear();

    render(createElement(PerNodeReadOnly));

    // Neither, one, and both endpoints locked, each on its own store.
    expect([...connectionStores.keys()].sort()).toEqual([0, 1, 2]);
    expect(new Set([...connectionStores.values()].map((store) => store.getState)).size).toBe(3);
  });
});
