import { render } from '@testing-library/react';
import type { Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from './BaseCanvas';
import type { BaseCanvasProps } from './BaseCanvas.types';

// Only the viewport hooks are stubbed, so the change guard is exercised for
// real. This covers the direct-caller path: React Flow's own deletion paths go
// through `onBeforeDelete` instead.
vi.mock('./BaseCanvas.hooks', async () => ({
  ...(await vi.importActual('./BaseCanvas.hooks')),
  useAutoLayout: () => ({ isLayouting: false, isReady: true }),
  useEnsureNodesInView: () => ({
    ensureNodesInView: vi.fn(),
    ensureAllNodesInView: vi.fn(),
    centerNode: vi.fn(),
  }),
  useMaintainNodesInView: vi.fn(),
}));

let capturedOnNodesChange: ((changes: NodeChange[]) => void) | undefined;

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    ReactFlow: ({
      children,
      onNodesChange,
    }: {
      children?: ReactNode;
      onNodesChange?: (changes: NodeChange[]) => void;
    }) => {
      capturedOnNodesChange = onNodesChange;
      return <div data-testid="react-flow">{children}</div>;
    },
    Background: () => <div data-testid="background" />,
    Panel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    useReactFlow: () => ({
      fitView: vi.fn(),
      getNodes: vi.fn(() => []),
      getEdges: vi.fn(() => []),
    }),
  };
});

const nodes: Node[] = [
  { id: 'locked', position: { x: 0, y: 0 }, data: {} },
  { id: 'free', position: { x: 100, y: 0 }, data: {} },
];

const renderCanvas = (props: Partial<BaseCanvasProps>) =>
  render(
    <ReactFlowProvider>
      <BaseCanvas nodes={nodes} edges={[]} nodeTypes={{}} {...props} />
    </ReactFlowProvider>
  );

describe('BaseCanvas node changes when nodes are locked', () => {
  beforeEach(() => {
    capturedOnNodesChange = undefined;
  });

  it('ignores removal requests for locked nodes', () => {
    const onNodesChange = vi.fn();
    renderCanvas({ onNodesChange, readOnlyNodeIds: new Set(['locked']) });

    capturedOnNodesChange?.([
      { type: 'remove', id: 'locked' },
      { type: 'remove', id: 'free' },
    ]);

    expect(onNodesChange).toHaveBeenCalledWith([{ type: 'remove', id: 'free' }]);
  });

  it('does not report changes when every removal targets a locked node', () => {
    const onNodesChange = vi.fn();
    renderCanvas({ onNodesChange, readOnlyNodeIds: new Set(['locked']) });

    capturedOnNodesChange?.([{ type: 'remove', id: 'locked' }]);

    expect(onNodesChange).not.toHaveBeenCalled();
  });

  it('allows locked nodes to move', () => {
    const onNodesChange = vi.fn();
    renderCanvas({ onNodesChange, readOnlyNodeIds: new Set(['locked']) });

    const changes: NodeChange[] = [{ type: 'position', id: 'locked', position: { x: 5, y: 5 } }];
    capturedOnNodesChange?.(changes);

    expect(onNodesChange).toHaveBeenCalledWith(changes);
  });

  it('allows selection and resize changes for locked nodes', () => {
    const onNodesChange = vi.fn();
    renderCanvas({ onNodesChange, readOnlyNodeIds: new Set(['locked']) });

    const changes: NodeChange[] = [
      { type: 'select', id: 'locked', selected: true },
      { type: 'dimensions', id: 'locked', dimensions: { width: 10, height: 10 } },
    ];
    capturedOnNodesChange?.(changes);

    expect(onNodesChange).toHaveBeenCalledWith(changes);
  });

  it('uses the original change handler when no nodes are locked', () => {
    const onNodesChange = vi.fn();
    renderCanvas({ onNodesChange });

    expect(capturedOnNodesChange).toBe(onNodesChange);
  });
});
