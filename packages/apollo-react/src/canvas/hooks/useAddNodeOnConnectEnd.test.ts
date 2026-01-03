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
  applyPreviewToReactFlow: vi.fn(),
  createPreviewNode: vi.fn(),
}));

import * as utils from '../utils';
// Import after mocks are set up
import { useAddNodeOnConnectEnd } from './useAddNodeOnConnectEnd';

const mockApplyPreviewToReactFlow = vi.mocked(utils.applyPreviewToReactFlow);
const mockCreatePreviewNode = vi.mocked(utils.createPreviewNode);

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

    expect(mockCreatePreviewNode).not.toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
  });

  it('should create and apply preview node when connection ends on empty space', () => {
    const mockPreview = {
      node: { id: 'preview-node', position: { x: 100, y: 100 }, data: {} },
      edge: { id: 'preview-edge', source: 'node-1', target: 'preview-node' },
    };

    const mockFlowPosition = { x: 100, y: 100 };
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue(mockFlowPosition);
    mockCreatePreviewNode.mockReturnValue(mockPreview);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockMouseEvent, connectionStateBase);

    expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith({ x: 200, y: 200 });
    expect(mockCreatePreviewNode).toHaveBeenCalledWith(
      'node-1',
      'mock-output',
      mockReactFlowInstance,
      mockFlowPosition,
      undefined,
      'source',
      undefined, // previewNodeSize (uses default)
      Position.Right // handlePosition from connectionState.fromHandle.position
    );
    expect(mockApplyPreviewToReactFlow).toHaveBeenCalledWith(mockPreview, mockReactFlowInstance);
  });

  it("should use handle id if provided, default to 'output' if not", () => {
    const mockPreview = {
      node: { id: 'preview-node', position: { x: 100, y: 100 }, data: {} },
      edge: { id: 'preview-edge', source: 'node-1', target: 'preview-node' },
    };

    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 100 });
    vi.mocked(mockCreatePreviewNode).mockReturnValue(mockPreview);

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

    expect(mockCreatePreviewNode).toHaveBeenCalledWith(
      'node-1',
      'output',
      mockReactFlowInstance,
      expect.any(Object),
      undefined,
      'source',
      undefined, // previewNodeSize (uses default)
      Position.Right // handlePosition from connectionState.fromHandle.position
    );
  });

  it('should not add preview if fromNode is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromNode: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockCreatePreviewNode).not.toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
  });

  it('should not add preview if fromHandle is missing', () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      fromHandle: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockCreatePreviewNode).not.toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
  });

  it("should not add preview if 'to' is missing", () => {
    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    const connectionState: FinalConnectionState = {
      ...connectionStateBase,
      to: null,
    };

    result.current({} as MouseEvent, connectionState);

    expect(mockCreatePreviewNode).not.toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
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

    expect(mockCreatePreviewNode).not.toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
  });

  it('should not apply preview if createPreviewNode returns null', () => {
    mockReactFlowInstance.screenToFlowPosition = vi.fn().mockReturnValue({ x: 100, y: 100 });
    mockCreatePreviewNode.mockReturnValueOnce(null);

    const { result } = renderHook(() => useAddNodeOnConnectEnd());

    result.current(mockTouchEventWithChangedTouches, connectionStateBase);

    expect(mockCreatePreviewNode).toHaveBeenCalled();
    expect(mockApplyPreviewToReactFlow).not.toHaveBeenCalled();
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
