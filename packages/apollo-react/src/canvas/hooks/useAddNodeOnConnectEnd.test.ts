import { renderHook } from '@testing-library/react';
import {
  type Edge,
  type FinalConnectionState,
  type Node,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { InternalNodeBase } from '@xyflow/system';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeRegistryContext, type NodeTypeRegistry } from '../core';
import type { NodeManifest } from '../schema/node-definition';

const mockReactFlowInstance = {
  screenToFlowPosition: vi.fn(),
  getNode: vi.fn(),
  getNodes: vi.fn(),
  getEdges: vi.fn(),
  setNodes: vi.fn(),
  setEdges: vi.fn(),
};
const mockUseReactFlow = vi.fn();
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/apollo-react/canvas/xyflow/react')),
  useReactFlow: () => mockUseReactFlow(),
}));

vi.mock('../utils', () => ({
  showPreviewGraph: vi.fn(),
}));

import * as utils from '../utils';
// Import after mocks are set up
import { useAddNodeOnConnectEnd } from './useAddNodeOnConnectEnd';

const mockShowPreviewGraph = vi.mocked(utils.showPreviewGraph);

const loopManifest = {
  nodeType: 'loop',
  display: { label: 'Loop', icon: 'repeat', shape: 'container' },
  handleConfiguration: [
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
} as NodeManifest;

function createRegistryWrapper(registry: NodeTypeRegistry) {
  return function RegistryWrapper({ children }: { children: ReactNode }) {
    return createElement(NodeRegistryContext.Provider, { value: { registry } }, children);
  };
}

const loopNode: Node = {
  id: 'loop-1',
  type: 'loop',
  position: { x: 0, y: 0 },
  style: { width: 704, height: 368 },
  data: {},
};

const loopChildNode: Node = {
  id: 'task-1',
  type: 'task',
  parentId: loopNode.id,
  position: { x: 240, y: 112 },
  measured: { width: 96, height: 96 },
  data: {},
};

const mockFlowPosition = { x: 100, y: 100 };

function createLoopRegistry(): NodeTypeRegistry {
  return {
    getManifest: vi.fn((type: string) => (type === 'loop' ? loopManifest : undefined)),
  } as unknown as NodeTypeRegistry;
}

describe('useAddNodeOnConnectEnd', () => {
  const mockFromNode = {
    id: 'node-1',
    position: { x: 0, y: 0 },
    data: {},
    measured: {},
    internals: ({} as Pick<InternalNodeBase, 'internals'>).internals,
  };

  const mockMouseEvent = { clientX: 200, clientY: 200 } as MouseEvent;
  const mockTouchEventWithTouches = {
    touches: [{ clientX: 200, clientY: 200 }],
    changedTouches: [],
  } as unknown as TouchEvent;
  const mockTouchEventWithChangedTouches = {
    touches: [],
    changedTouches: [{ clientX: 200, clientY: 200 }],
  } as unknown as TouchEvent;

  const connectionStateBase: FinalConnectionState = {
    from: { x: 0, y: 0 },
    fromNode: mockFromNode,
    fromHandle: {
      type: 'source',
      nodeId: 'node-1',
      id: 'mock-output',
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      position: Position.Right,
    },
    fromPosition: Position.Right,
    to: { x: 200, y: 200 },
    toNode: null,
    toHandle: null,
    toPosition: Position.Left,
    isValid: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReactFlow.mockReturnValue(mockReactFlowInstance);
    mockReactFlowInstance.getNode.mockReset();
    mockReactFlowInstance.getNodes.mockReset();
    mockReactFlowInstance.getEdges.mockReset();
  });

  function mockFlowGraph(nodes: Node[], edges: Edge[] = []) {
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue(mockFlowPosition);
    mockReactFlowInstance.getNode.mockImplementation((id: string) =>
      nodes.find((node) => node.id === id)
    );
    mockReactFlowInstance.getNodes.mockReturnValue(nodes);
    mockReactFlowInstance.getEdges.mockReturnValue(edges);
  }

  function renderWithLoopRegistry() {
    return renderHook(() => useAddNodeOnConnectEnd(), {
      wrapper: createRegistryWrapper(createLoopRegistry()),
    });
  }

  it('should return a callback function', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());
    expect(typeof result.current).toBe('function');
  });

  it('should not add preview if reactFlowInstance is null', () => {
    mockUseReactFlow.mockReturnValue(null);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current({} as MouseEvent, connectionStateBase);

    expect(mockShowPreviewGraph).not.toHaveBeenCalled();
  });

  it('should show preview graph when connection ends on empty space', () => {
    const mockFlowPosition = { x: 100, y: 100 };
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue(mockFlowPosition);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockMouseEvent, connectionStateBase);

    expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith({ x: 200, y: 200 });
    expect(mockShowPreviewGraph).toHaveBeenCalledWith({
      source: {
        nodeId: 'node-1',
        handleId: 'mock-output',
      },
      reactFlowInstance: mockReactFlowInstance,
      position: mockFlowPosition,
      sourceHandleType: 'source',
      handlePosition: Position.Right,
      ignoredNodeTypes: [],
    });
  });

  it("should use handle id if provided, default to 'output' if not", () => {
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 100 });

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromHandle: {
        type: 'source',
        nodeId: 'node-1',
        id: undefined,
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        position: Position.Right,
      },
    };

    result.current(mockTouchEventWithTouches, connectionState);

    expect(mockShowPreviewGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        source: {
          nodeId: 'node-1',
          handleId: 'output',
        },
        reactFlowInstance: mockReactFlowInstance,
        position: expect.any(Object),
        sourceHandleType: 'source',
        handlePosition: Position.Right,
        ignoredNodeTypes: [],
      })
    );
  });

  it('should not add preview if fromNode is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromNode: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockShowPreviewGraph).not.toHaveBeenCalled();
  });

  it('should not add preview if fromHandle is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromHandle: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockShowPreviewGraph).not.toHaveBeenCalled();
  });

  it("should not add preview if 'to' is missing", () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      to: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockShowPreviewGraph).not.toHaveBeenCalled();
  });

  it('should not add preview if connection already has a target handle', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const mockToNode = {
      id: 'node-2',
      position: { x: 100, y: 100 },
      data: {},
      measured: {},
      internals: ({} as Pick<InternalNodeBase, 'internals'>).internals,
    };

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      toNode: mockToNode,
      toHandle: {
        type: 'target',
        nodeId: 'node-2',
        id: 'input',
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        position: Position.Left,
      },
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockShowPreviewGraph).not.toHaveBeenCalled();
  });

  it('should delegate preview creation to showPreviewGraph', () => {
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 100 });

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockTouchEventWithChangedTouches, connectionStateBase);

    expect(mockShowPreviewGraph).toHaveBeenCalledOnce();
  });

  it('should parent loop inner start-handle drags without switching to sequence insertion', () => {
    mockFlowGraph(
      [loopNode, loopChildNode],
      [
        {
          id: 'loop-1-task-1',
          source: loopNode.id,
          sourceHandle: 'start',
          target: loopChildNode.id,
          targetHandle: 'input',
        },
      ]
    );

    const { result } = renderWithLoopRegistry();

    result.current(mockMouseEvent, {
      ...connectionStateBase,
      fromNode: {
        ...mockFromNode,
        id: loopNode.id,
      },
      fromHandle: {
        ...connectionStateBase.fromHandle!,
        nodeId: loopNode.id,
        id: 'start',
      },
    });

    const previewOptions = mockShowPreviewGraph.mock.calls[0]?.[0];

    expect(previewOptions).toMatchObject({
      source: {
        nodeId: loopNode.id,
        handleId: 'start',
      },
      position: mockFlowPosition,
      sourceHandleType: 'source',
      handlePosition: Position.Right,
      ignoredNodeTypes: [],
      containerId: loopNode.id,
    });
    expect(previewOptions).not.toHaveProperty('target');
    expect(previewOptions).not.toHaveProperty('positionMode');
    expect(previewOptions).not.toHaveProperty('data');
  });

  it('should parent loop inner continue-handle drags', () => {
    mockFlowGraph([loopNode]);

    const { result } = renderWithLoopRegistry();

    result.current(mockMouseEvent, {
      ...connectionStateBase,
      fromNode: {
        ...mockFromNode,
        id: loopNode.id,
      },
      fromHandle: {
        ...connectionStateBase.fromHandle!,
        type: 'target',
        nodeId: loopNode.id,
        id: 'continue',
        position: Position.Left,
      },
    });

    const previewOptions = mockShowPreviewGraph.mock.calls[0]?.[0];

    expect(previewOptions).toMatchObject({
      source: {
        nodeId: loopNode.id,
        handleId: 'continue',
      },
      position: mockFlowPosition,
      sourceHandleType: 'target',
      handlePosition: Position.Left,
      ignoredNodeTypes: [],
      containerId: loopNode.id,
    });
    expect(previewOptions).not.toHaveProperty('target');
    expect(previewOptions).not.toHaveProperty('positionMode');
    expect(previewOptions).not.toHaveProperty('data');
  });

  it('should keep loop child handle drags on the generic drop-position path', () => {
    mockFlowGraph(
      [loopNode, loopChildNode],
      [
        {
          id: 'task-1-continue',
          source: loopChildNode.id,
          sourceHandle: 'output',
          target: loopNode.id,
          targetHandle: 'continue',
        },
      ]
    );

    const { result } = renderWithLoopRegistry();

    result.current(mockMouseEvent, {
      ...connectionStateBase,
      fromNode: {
        ...mockFromNode,
        id: loopChildNode.id,
      },
      fromHandle: {
        ...connectionStateBase.fromHandle!,
        nodeId: loopChildNode.id,
        id: 'output',
      },
    });

    const previewOptions = mockShowPreviewGraph.mock.calls[0]?.[0];

    expect(previewOptions).toMatchObject({
      source: {
        nodeId: loopChildNode.id,
        handleId: 'output',
      },
      position: mockFlowPosition,
      sourceHandleType: 'source',
      handlePosition: Position.Right,
      ignoredNodeTypes: [],
    });
    expect(previewOptions).not.toHaveProperty('containerId');
    expect(previewOptions).not.toHaveProperty('target');
    expect(previewOptions).not.toHaveProperty('positionMode');
    expect(previewOptions).not.toHaveProperty('data');
  });

  it('should memoize callback with reactFlowInstance dependency', () => {
    const { result, rerender } = renderHook(() => useAddNodeOnConnectEnd());
    const firstCallback = result.current;

    rerender();
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it('should update callback when reactFlowInstance changes', () => {
    const { result, rerender } = renderHook(() => useAddNodeOnConnectEnd());
    const firstCallback = result.current;

    const newMockInstance = {
      ...mockReactFlowInstance,
      screenToFlowPosition: vi.fn(),
    };

    mockUseReactFlow.mockReturnValue(newMockInstance);

    rerender();
    const secondCallback = result.current;

    expect(firstCallback).not.toBe(secondCallback);
  });
});
