import { renderHook } from '@testing-library/react';
import { type FinalConnectionState, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { InternalNodeBase } from '@xyflow/system';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('../utils', () => ({
  showPreviewGraph: vi.fn(),
}));

import * as utils from '../utils';
// Import after mocks are set up
import { useAddNodeOnConnectEnd } from './useAddNodeOnConnectEnd';

const mockShowPreviewGraph = vi.mocked(utils.showPreviewGraph);

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
  });

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
      sourceNodeId: 'node-1',
      sourceHandleId: 'mock-output',
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
        sourceNodeId: 'node-1',
        sourceHandleId: 'output',
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
