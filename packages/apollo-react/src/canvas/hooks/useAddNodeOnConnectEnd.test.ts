import { renderHook } from '@testing-library/react';
import { type FinalConnectionState, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { InternalNodeBase } from '@xyflow/system';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';

const mockReactFlowInstance = {
  screenToFlowPosition: vi.fn(),
  getNode: vi.fn(),
  getNodes: vi.fn(),
  setNodes: vi.fn(),
  setEdges: vi.fn(),
};
const mockUseReactFlow = vi.fn();
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/apollo-react/canvas/xyflow/react')),
  useReactFlow: () => mockUseReactFlow(),
}));

import { useAddNodeOnConnectEnd } from './useAddNodeOnConnectEnd';

describe('useAddNodeOnConnectEnd', () => {
  const mockFromNode = {
    id: 'node-1',
    position: { x: 0, y: 0 },
    data: {},
    measured: {},
    internals: ({} as Pick<InternalNodeBase, 'internals'>).internals,
  };

  const mockMouseEvent = { clientX: 200, clientY: 200 } as MouseEvent;
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

  function getRequiredSetNodesUpdater() {
    const updater = mockReactFlowInstance.setNodes.mock.calls[0]?.[0];
    if (typeof updater !== 'function') {
      throw new Error('Expected setNodes to receive an updater function');
    }

    return updater as (nodes: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  }

  function getRequiredSetEdgesUpdater() {
    const updater = mockReactFlowInstance.setEdges.mock.calls[0]?.[0];
    if (typeof updater !== 'function') {
      throw new Error('Expected setEdges to receive an updater function');
    }

    return updater as (edges: Array<Record<string, unknown>>) => Array<Record<string, unknown>>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseReactFlow.mockReturnValue(mockReactFlowInstance);
    mockReactFlowInstance.getNode.mockImplementation((id: string) =>
      id === mockFromNode.id ? mockFromNode : undefined
    );
    mockReactFlowInstance.getNodes.mockReturnValue([mockFromNode as Record<string, unknown>]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a callback function', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());
    expect(typeof result.current).toBe('function');
  });

  it('should not add preview if reactFlowInstance is null', () => {
    mockUseReactFlow.mockReturnValue(null);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current({} as MouseEvent, connectionStateBase);

    expect(mockReactFlowInstance.setNodes).not.toHaveBeenCalled();
    expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
  });

  it('should add a preview node and edge when connection ends on empty space', () => {
    const mockFlowPosition = { x: 100, y: 100 };
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue(mockFlowPosition);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockMouseEvent, connectionStateBase);

    expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith({ x: 200, y: 200 });
    vi.runAllTimers();

    const nextNodes = getRequiredSetNodesUpdater()([
      { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: true },
      { id: PREVIEW_NODE_ID, position: { x: 1, y: 1 }, data: {}, selected: true },
    ]);
    const nextEdges = getRequiredSetEdgesUpdater()([
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'stale-preview-edge', source: PREVIEW_NODE_ID, target: 'node-2' },
    ]);

    expect(nextNodes).toEqual([
      { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: false },
      expect.objectContaining({
        id: PREVIEW_NODE_ID,
        position: { x: 100, y: 52 },
        type: 'preview',
      }),
    ]);
    expect(nextEdges).toEqual([
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      expect.objectContaining({
        id: PREVIEW_EDGE_ID,
        source: 'node-1',
        sourceHandle: 'mock-output',
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      }),
    ]);
  });

  it('should parent the preview node when the source node is inside a loop container', () => {
    const mockFlowPosition = { x: 100, y: 100 };
    const loopNode = {
      id: 'loop-1',
      position: { x: 20, y: 10 },
      data: {},
      measured: {},
    };
    const loopChildNode = {
      ...mockFromNode,
      parentId: 'loop-1',
      position: { x: 40, y: 30 },
    };

    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue(mockFlowPosition);
    mockReactFlowInstance.getNode.mockImplementation((id: string) => {
      if (id === loopChildNode.id) return loopChildNode;
      if (id === loopNode.id) return loopNode;
      return undefined;
    });
    mockReactFlowInstance.getNodes.mockReturnValue([
      loopNode as Record<string, unknown>,
      loopChildNode as Record<string, unknown>,
    ]);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockMouseEvent, {
      ...connectionStateBase,
      fromNode: loopChildNode,
      fromHandle: {
        ...connectionStateBase.fromHandle!,
        nodeId: loopChildNode.id,
      },
    });

    vi.runAllTimers();

    const nextNodes = getRequiredSetNodesUpdater()([
      { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: true },
    ]);

    expect(nextNodes).toEqual([
      { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: false },
      expect.objectContaining({
        id: PREVIEW_NODE_ID,
        parentId: 'loop-1',
        extent: 'parent',
        position: { x: 80, y: 42 },
        type: 'preview',
      }),
    ]);
  });

  it('should not add preview if fromNode is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromNode: null,
    };

    result.current(mockMouseEvent, connectionState);

    expect(mockReactFlowInstance.setNodes).not.toHaveBeenCalled();
    expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
  });

  it('should not add preview if fromHandle is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromHandle: null,
    };

    result.current(mockMouseEvent, connectionState);

    expect(mockReactFlowInstance.setNodes).not.toHaveBeenCalled();
    expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
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

    expect(mockReactFlowInstance.setNodes).not.toHaveBeenCalled();
    expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
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
