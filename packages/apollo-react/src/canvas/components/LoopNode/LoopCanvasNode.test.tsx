import type { NodeManifest } from '@uipath/apollo-react/canvas';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core';
import { fireEvent, render, screen } from '../../utils/testing';
import { BaseCanvasModeProvider } from '../BaseCanvas/BaseCanvasModeProvider';
import { LoopCanvasNode } from './LoopCanvasNode';
import { DEFAULT_LOOP_NODE_TYPE } from './LoopNode.constants';
import type { LoopNodeData } from './LoopNode.types';

const { mockCurrentCanvas, mockUpdateNodes, mockNodes, mockReactFlow } = vi.hoisted(() => ({
  mockCurrentCanvas: { current: null as unknown },
  mockUpdateNodes: { current: vi.fn() },
  mockNodes: { current: [] as Array<{ id: string; parentId?: string }> },
  mockReactFlow: {
    current: {
      getNode: vi.fn(),
      getNodes: vi.fn(),
      updateNode: vi.fn(),
      updateNodeData: vi.fn(),
    },
  },
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const React = await import('react');
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');

  return {
    ...actual,
    Handle: React.forwardRef(({ children, id, position, ...props }: any, ref) => (
      <div ref={ref} data-testid={`handle-${id}`} data-position={position} {...props}>
        {children}
      </div>
    )),
    useReactFlow: () => mockReactFlow.current,
    useStore: (selector?: (state: any) => unknown) =>
      selector?.({
        connection: { inProgress: false },
        nodes: mockNodes.current,
      }),
    useUpdateNodeInternals: () => vi.fn(),
  };
});

vi.mock('@xyflow/react', async () => ({
  ...(await vi.importActual('@xyflow/react')),
  useNodesData: () => undefined,
}));

vi.mock('../../stores/canvasStore', () => {
  const selectCurrentCanvas = () => null;
  const selectUpdateNodes = () => null;

  return {
    selectCurrentCanvas,
    selectUpdateNodes,
    useCanvasStore: (selector: unknown) => {
      if (selector === selectCurrentCanvas) return mockCurrentCanvas.current;
      if (selector === selectUpdateNodes) return mockUpdateNodes.current;
      return undefined;
    },
  };
});

vi.mock('./LoopNodePreview', () => ({
  showCenteredContainerPreview: vi.fn(),
}));

import { showCenteredContainerPreview } from './LoopNodePreview';

const versionOneManifest: NodeManifest = {
  nodeType: DEFAULT_LOOP_NODE_TYPE,
  version: '1.0.0',
  category: 'control-flow',
  tags: ['loop'],
  sortOrder: 0,
  display: {
    label: 'For Each',
    icon: 'repeat',
  },
  handleConfiguration: [
    {
      position: 'left',
      handles: [{ id: 'input', type: 'target', handleType: 'input' }],
    },
    {
      position: 'right',
      handles: [{ id: 'success', type: 'source', handleType: 'output' }],
    },
  ],
};

const versionTwoManifest: NodeManifest = {
  ...versionOneManifest,
  version: '2.0.0',
  handleConfiguration: [
    ...versionOneManifest.handleConfiguration,
    {
      position: 'left',
      boundary: 'inner',
      handles: [{ id: 'start', type: 'source', handleType: 'output' }],
    },
    {
      position: 'right',
      boundary: 'inner',
      handles: [{ id: 'continue', type: 'target', handleType: 'input' }],
    },
  ],
};

const baseProps = {
  id: 'loop-1',
  type: DEFAULT_LOOP_NODE_TYPE,
  data: {},
  selected: false,
  dragging: false,
  width: 320,
  height: 220,
} as unknown as NodeProps<Node<LoopNodeData>>;

function renderLoopCanvasNode(
  manifest: NodeManifest,
  props: Partial<NodeProps<Node<LoopNodeData>>> = {}
) {
  return render(
    <BaseCanvasModeProvider mode="design">
      <NodeRegistryProvider registrations={[manifest]}>
        <LoopCanvasNode {...baseProps} {...props} />
      </NodeRegistryProvider>
    </BaseCanvasModeProvider>
  );
}

describe('LoopCanvasNode', () => {
  beforeEach(() => {
    mockCurrentCanvas.current = null;
    mockUpdateNodes.current = vi.fn();
    mockNodes.current = [{ id: 'loop-1' }];
    mockReactFlow.current = {
      getNode: vi.fn().mockReturnValue({
        id: 'loop-1',
        position: { x: 0, y: 0 },
        width: 320,
        height: 220,
        measured: { width: 320, height: 220 },
        data: {},
      }),
      getNodes: vi.fn().mockReturnValue([{ id: 'loop-1', position: { x: 0, y: 0 }, data: {} }]),
      updateNode: vi.fn(),
      updateNodeData: vi.fn(),
    };
    vi.mocked(showCenteredContainerPreview).mockReset();
  });

  it('does not show the loop empty-state action for legacy loop manifests', () => {
    renderLoopCanvasNode(versionOneManifest, {
      data: { version: '1.0.0' },
    });

    expect(screen.queryByRole('button', { name: 'Add node to loop' })).not.toBeInTheDocument();
  });

  it('lets users add the first child from loop manifests with inner handles', () => {
    renderLoopCanvasNode(versionTwoManifest, {
      data: { version: '2.0.0' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add node to loop' }));

    expect(showCenteredContainerPreview).toHaveBeenCalledWith({
      containerId: 'loop-1',
      reactFlowInstance: mockReactFlow.current,
      previewHandles: {
        sourceHandleId: 'start',
        sourceHandlePosition: Position.Right,
        targetHandleId: 'continue',
      },
    });
  });
});
