import { render } from '@testing-library/react';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseCanvas } from './BaseCanvas';
import type { BaseCanvasProps } from './BaseCanvas.types';

// Only the viewport hooks are stubbed, so the change guards are exercised for
// real. They cover the direct-caller path: React Flow's own deletion paths go
// through `onBeforeDelete` instead.
vi.mock('./BaseCanvas.hooks', async () => {
  const actual = await vi.importActual<typeof import('./BaseCanvas.hooks')>('./BaseCanvas.hooks');
  return {
    ...actual,
    useAutoLayout: () => ({ isLayouting: false, isReady: true }),
    useEnsureNodesInView: () => ({
      ensureNodesInView: vi.fn(),
      ensureAllNodesInView: vi.fn(),
      centerNode: vi.fn(),
    }),
    useMaintainNodesInView: vi.fn(),
  };
});

// Capture the change and connection handlers BaseCanvas hands to ReactFlow so
// we can invoke them directly with synthetic interactions.
let capturedOnEdgesChange: ((changes: EdgeChange[]) => void) | undefined;
let capturedOnNodesChange: ((changes: NodeChange[]) => void) | undefined;
let capturedIsValidConnection: BaseCanvasProps['isValidConnection'];
let capturedOnConnect: BaseCanvasProps['onConnect'];

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    ReactFlow: ({
      children,
      isValidConnection,
      onConnect,
      onEdgesChange,
      onNodesChange,
    }: {
      children?: ReactNode;
      isValidConnection?: BaseCanvasProps['isValidConnection'];
      onConnect?: BaseCanvasProps['onConnect'];
      onEdgesChange?: (changes: EdgeChange[]) => void;
      onNodesChange?: (changes: NodeChange[]) => void;
    }) => {
      capturedIsValidConnection = isValidConnection;
      capturedOnConnect = onConnect;
      capturedOnEdgesChange = onEdgesChange;
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

const edge: Edge = { id: 'locked-free', source: 'locked', target: 'free' };
const editableEdge: Edge = { id: 'free-outside', source: 'free', target: 'outside' };
const lockedToFreeConnection: Connection = {
  source: 'locked',
  target: 'free',
  sourceHandle: null,
  targetHandle: null,
};

const renderCanvas = (props: Partial<BaseCanvasProps>) =>
  render(
    <ReactFlowProvider>
      <BaseCanvas nodes={nodes} edges={[]} nodeTypes={{}} {...props} />
    </ReactFlowProvider>
  );

describe('BaseCanvas node changes when nodes are locked', () => {
  beforeEach(() => {
    capturedOnEdgesChange = undefined;
    capturedIsValidConnection = undefined;
    capturedOnConnect = undefined;
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

describe('BaseCanvas edge changes when connected nodes are locked', () => {
  beforeEach(() => {
    capturedOnEdgesChange = undefined;
  });

  it('forwards only editable edge removals when an edge joins two locked nodes', () => {
    const onEdgesChange = vi.fn();
    renderCanvas({
      edges: [edge, editableEdge],
      onEdgesChange,
      readOnlyNodeIds: new Set(['locked', 'free']),
    });

    capturedOnEdgesChange?.([
      { type: 'remove', id: edge.id },
      { type: 'remove', id: editableEdge.id },
    ]);

    expect(onEdgesChange).toHaveBeenCalledWith([{ type: 'remove', id: editableEdge.id }]);
  });
});

// The guard semantics live in `useReadOnlyConnectionCallbacks.test.ts`; this
// only proves the guarded callbacks are the ones handed to ReactFlow.
describe('BaseCanvas connection callbacks when nodes are locked', () => {
  it('gives ReactFlow the guarded connection callbacks', () => {
    const consumerIsValidConnection = vi.fn(() => true);
    const onConnect = vi.fn();
    renderCanvas({
      mode: 'design',
      edges: [edge],
      isValidConnection: consumerIsValidConnection,
      onConnect,
      readOnlyNodeIds: new Set(['locked', 'free']),
    });

    expect(capturedIsValidConnection?.(lockedToFreeConnection)).toBe(false);
    capturedOnConnect?.(lockedToFreeConnection);

    expect(consumerIsValidConnection).not.toHaveBeenCalled();
    expect(onConnect).not.toHaveBeenCalled();
  });
});
