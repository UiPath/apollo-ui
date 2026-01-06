import { act, renderHook } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_NODE_ID } from '../../../constants';
import type { EdgeToolbarPositionData } from './EdgeToolbar.types';
import { useEdgeToolbarState } from './useEdgeToolbarState';

// Mock dependencies
const mockReactFlowInstance = {
  setEdges: vi.fn(),
  getNode: vi.fn(),
  getNodes: vi.fn(),
  setNodes: vi.fn(),
};

const mockBaseCanvasMode = {
  mode: 'design',
  setMode: vi.fn(),
};

const mockPositionData: EdgeToolbarPositionData = {
  offsetPosition: { x: 150, y: 50 },
  pathPosition: { x: 150, y: 100 },
};

const mockHandleMouseMoveOnPath = vi.fn();

vi.mock('@uipath/uix/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/uix/xyflow/react')),
  useReactFlow: () => mockReactFlowInstance,
}));

vi.mock('../../BaseCanvas/BaseCanvasModeProvider', () => ({
  useBaseCanvasMode: () => mockBaseCanvasMode,
}));

vi.mock('./useEdgeToolbarPositioning', () => ({
  useEdgeToolbarPositioning: vi.fn(() => ({
    positionData: mockPositionData,
    handleMouseMoveOnPath: mockHandleMouseMoveOnPath,
  })),
}));

vi.mock('../../../utils/createPreviewNode', () => ({
  createPreviewNode: vi.fn(
    (
      source,
      sourceHandleId,
      _reactFlow,
      position,
      _metadata,
      _handleType,
      _nodeSize,
      _sourcePosition
    ) => ({
      node: {
        id: PREVIEW_NODE_ID,
        type: 'default',
        position,
        data: {},
      },
      edge: {
        id: `${source}-${PREVIEW_NODE_ID}`,
        source,
        sourceHandle: sourceHandleId,
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
        type: 'default',
      },
    })
  ),
  applyPreviewToReactFlow: vi.fn(),
}));

const { useEdgeToolbarPositioning } = await import('./useEdgeToolbarPositioning');
const { createPreviewNode, applyPreviewToReactFlow } = await import(
  '../../../utils/createPreviewNode'
);

describe('useEdgeToolbarState', () => {
  const defaultProps = {
    edgeId: 'edge-1',
    pathElementRef: { current: document.createElementNS('http://www.w3.org/2000/svg', 'path') },
    isHovered: false,
    source: 'node-1',
    target: 'node-2',
    sourceHandleId: 'output',
    targetHandleId: 'input',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBaseCanvasMode.mode = 'design';
    vi.mocked(useEdgeToolbarPositioning).mockReturnValue({
      positionData: mockPositionData,
      handleMouseMoveOnPath: mockHandleMouseMoveOnPath,
    });
  });

  describe('toolbar visibility', () => {
    it('should not show toolbar when not hovered', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: false,
        })
      );

      expect(result.current.showToolbar).toBe(false);
    });

    it('should show toolbar when hovered in design mode', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      expect(result.current.showToolbar).toBe(true);
    });

    it('should not show toolbar in view mode', () => {
      mockBaseCanvasMode.mode = 'view';

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      expect(result.current.showToolbar).toBe(false);
    });

    it('should not show toolbar when positionData is null', () => {
      vi.mocked(useEdgeToolbarPositioning).mockReturnValue({
        positionData: null,
        handleMouseMoveOnPath: undefined,
      });

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      expect(result.current.showToolbar).toBe(false);
    });
  });

  describe('toolbar positioning', () => {
    it('should pass correct parameters to useEdgeToolbarPositioning', () => {
      const pathElementRef = {
        current: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
      };

      renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          pathElementRef,
          isHovered: true,
        })
      );

      expect(useEdgeToolbarPositioning).toHaveBeenCalledWith({
        pathElementRef,
        isEnabled: true,
        targetPosition: Position.Left,
      });
    });

    it('should return positionData from useEdgeToolbarPositioning', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      expect(result.current.toolbarPositioning).toBe(mockPositionData);
    });

    it('should return handleMouseMoveOnPath from useEdgeToolbarPositioning', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      expect(result.current.handleMouseMoveOnPath).toBe(mockHandleMouseMoveOnPath);
    });
  });

  describe('add node action', () => {
    it('should create preview node at given position', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      const position = { x: 150, y: 100 };

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', position);
      });

      expect(createPreviewNode).toHaveBeenCalledWith(
        'node-1',
        'output',
        mockReactFlowInstance,
        position,
        expect.objectContaining({
          originalEdge: expect.objectContaining({
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
          }),
        }),
        'source',
        undefined,
        Position.Right
      );
    });

    it('should not create nodes if createPreviewNode returns null', () => {
      vi.mocked(createPreviewNode).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
      });

      expect(applyPreviewToReactFlow).not.toHaveBeenCalled();
      expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
    });
  });
});
