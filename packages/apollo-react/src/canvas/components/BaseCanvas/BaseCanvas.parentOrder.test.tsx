import { render } from '@testing-library/react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from './BaseCanvas';

vi.mock('./BaseCanvas.hooks', () => ({
  useAutoLayout: () => ({ isLayouting: false, isReady: true }),
  useEnsureNodesInView: () => ({
    ensureNodesInView: vi.fn(),
    ensureAllNodesInView: vi.fn(),
    centerNode: vi.fn(),
  }),
  useMaintainNodesInView: vi.fn(),
  useReadOnlyBeforeDelete: () => undefined,
  useReadOnlyEdgeIds: () => new Set<string>(),
}));

let renderedNodes: Node[] | undefined;

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    ReactFlow: ({ nodes }: { nodes?: Node[] }) => {
      renderedNodes = nodes;
      return <div data-testid="react-flow" />;
    },
    Background: () => <div data-testid="background" />,
    Panel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    useReactFlow: () => ({
      fitView: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      setViewport: vi.fn(),
    }),
  };
});

describe('BaseCanvas parent ordering', () => {
  it('hands React Flow the nodes array by identity when parents already precede children', () => {
    const nodes: Node[] = [
      { id: 'c', type: 'container', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', type: 'step', position: { x: 0, y: 0 }, data: {}, parentId: 'c' },
    ];
    render(
      <ReactFlowProvider>
        <BaseCanvas nodes={nodes} edges={[]} nodeTypes={{}} />
      </ReactFlowProvider>
    );
    expect(renderedNodes).toBe(nodes);
  });

  it('puts a parent back in front of its child, since React Flow would otherwise drop the link', () => {
    // A reparenting commits as an in-place `replace`, so `b` keeps index 1 while its new
    // parent `c` sits at index 2.
    const nodes: Node[] = [
      { id: 'a', type: 'step', position: { x: 0, y: 0 }, data: {} },
      {
        id: 'b',
        type: 'step',
        position: { x: 0, y: 0 },
        data: {},
        parentId: 'c',
        extent: 'parent',
      },
      { id: 'c', type: 'container', position: { x: 0, y: 0 }, data: {} },
    ];
    render(
      <ReactFlowProvider>
        <BaseCanvas nodes={nodes} edges={[]} nodeTypes={{}} />
      </ReactFlowProvider>
    );
    expect(renderedNodes?.map((node) => node.id)).toEqual(['a', 'c', 'b']);
    // Only the order changed: every node object is the canonical one.
    for (const node of renderedNodes ?? []) {
      expect(nodes).toContain(node);
    }
  });
});
