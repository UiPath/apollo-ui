import { act, renderHook } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../../../constants';
import type { EdgeToolbarPositionData } from './EdgeToolbar.types';
import { useEdgeToolbarState } from './useEdgeToolbarState';

// Mock dependencies
const mockReactFlowInstance = {
  setEdges: vi.fn(),
  getNode: vi.fn(),
  getNodes: vi.fn(),
  getEdges: vi.fn(),
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

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/apollo-react/canvas/xyflow/react')),
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

const { useEdgeToolbarPositioning } = await import('./useEdgeToolbarPositioning');

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

describe('useEdgeToolbarState', () => {
  const sourceNode = {
    id: 'node-1',
    position: { x: 0, y: 0 },
    data: {},
  };

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
    vi.useFakeTimers();
    mockBaseCanvasMode.mode = 'design';
    mockReactFlowInstance.getNode.mockImplementation((id: string) =>
      id === sourceNode.id ? sourceNode : undefined
    );
    mockReactFlowInstance.getNodes.mockReturnValue([sourceNode]);
    mockReactFlowInstance.getEdges.mockReturnValue([
      {
        id: 'edge-1',
        source: 'node-1',
        sourceHandle: 'output',
        target: 'node-2',
        targetHandle: 'input',
        type: 'default',
      },
    ]);
    vi.mocked(useEdgeToolbarPositioning).mockReturnValue({
      positionData: mockPositionData,
      handleMouseMoveOnPath: mockHandleMouseMoveOnPath,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('should not show toolbar when source is preview node', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
          source: PREVIEW_NODE_ID,
        })
      );

      expect(result.current.showToolbar).toBe(false);
    });

    it('should not show toolbar when target is preview node', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
          target: PREVIEW_NODE_ID,
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

    it('should disable positioning tracking for preview edges', () => {
      const pathElementRef = {
        current: document.createElementNS('http://www.w3.org/2000/svg', 'path'),
      };

      renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          pathElementRef,
          isHovered: true,
          source: PREVIEW_NODE_ID,
        })
      );

      expect(useEdgeToolbarPositioning).toHaveBeenCalledWith({
        pathElementRef,
        isEnabled: false,
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
    it('replaces the original edge with preview edges at the requested position', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      const position = { x: 150, y: 100 };

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', position);
        vi.runAllTimers();
      });

      expect(mockReactFlowInstance.setNodes).toHaveBeenCalledOnce();
      expect(mockReactFlowInstance.setEdges).toHaveBeenCalledOnce();

      const nextNodes = getRequiredSetNodesUpdater()([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: true },
        { id: PREVIEW_NODE_ID, position: { x: 25, y: 25 }, data: {}, selected: true },
      ]);
      const nextEdges = getRequiredSetEdgesUpdater()([
        { id: 'edge-1', source: 'node-1', target: 'node-2', selected: true },
        { id: 'stale-preview-edge', source: PREVIEW_NODE_ID, target: 'old-target', selected: true },
      ]);

      expect(nextNodes).toEqual([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: false },
        expect.objectContaining({
          id: PREVIEW_NODE_ID,
          position: { x: 150, y: 52 },
          type: 'preview',
        }),
      ]);
      expect(nextEdges.map((edge) => edge.id)).toEqual([
        PREVIEW_EDGE_ID,
        `${PREVIEW_NODE_ID}-node-2`,
      ]);
      expect(nextEdges).toEqual([
        expect.objectContaining({
          id: PREVIEW_EDGE_ID,
          source: 'node-1',
          target: PREVIEW_NODE_ID,
          sourceHandle: 'output',
        }),
        expect.objectContaining({
          id: `${PREVIEW_NODE_ID}-node-2`,
          source: PREVIEW_NODE_ID,
          target: 'node-2',
          targetHandle: 'input',
        }),
      ]);
    });

    it('reparents the preview node into the requested preview container', () => {
      mockReactFlowInstance.getNode.mockImplementation((id: string) =>
        id === sourceNode.id
          ? sourceNode
          : id === 'loop-container'
            ? { id: 'loop-container', position: { x: 20, y: 10 }, data: {} }
            : undefined
      );
      mockReactFlowInstance.getNodes.mockReturnValue([
        sourceNode,
        { id: 'loop-container', position: { x: 20, y: 10 }, data: {} },
      ]);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
          parentId: 'loop-container',
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
        vi.runAllTimers();
      });

      const nextNodes = getRequiredSetNodesUpdater()([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {} },
      ]);

      expect(nextNodes).toEqual([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {}, selected: false },
        expect.objectContaining({
          id: PREVIEW_NODE_ID,
          parentId: 'loop-container',
          extent: 'parent',
          position: { x: 130, y: 42 },
        }),
      ]);
    });

    it('stores preview container metadata on the restore edge', () => {
      mockReactFlowInstance.getEdges.mockReturnValue([
        {
          id: 'edge-1',
          source: 'node-1',
          sourceHandle: 'output',
          target: 'node-2',
          targetHandle: 'input',
          type: 'custom-edge',
          animated: true,
          style: { stroke: 'red' },
          data: { label: 'Keep me' },
        },
      ]);
      mockReactFlowInstance.getNode.mockImplementation((id: string) =>
        id === sourceNode.id
          ? sourceNode
          : id === 'loop-container'
            ? { id: 'loop-container', position: { x: 20, y: 10 }, data: {} }
            : undefined
      );
      mockReactFlowInstance.getNodes.mockReturnValue([
        sourceNode,
        { id: 'loop-container', position: { x: 20, y: 10 }, data: {} },
      ]);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
          parentId: 'loop-container',
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
        vi.runAllTimers();
      });

      const nextNodes = getRequiredSetNodesUpdater()([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {} },
      ]);
      const previewNode = nextNodes.find((node) => node.id === PREVIEW_NODE_ID);

      expect(previewNode).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            originalEdge: expect.objectContaining({
              id: 'edge-1',
              type: 'custom-edge',
              animated: true,
              style: { stroke: 'red' },
              data: { label: 'Keep me', parentId: 'loop-container' },
            }),
          }),
        })
      );
    });

    it('reparents from the source node parent when edge metadata is missing', () => {
      const sourceNodeInLoop = { ...sourceNode, parentId: 'loop-container' };
      mockReactFlowInstance.getNode.mockImplementation((id: string) => {
        if (id === sourceNode.id) return sourceNodeInLoop;
        if (id === 'loop-container')
          return { id: 'loop-container', position: { x: 20, y: 10 }, data: {} };
        if (id === 'node-2')
          return { id: 'node-2', parentId: 'loop-container', position: { x: 0, y: 0 }, data: {} };
        return undefined;
      });
      mockReactFlowInstance.getNodes.mockReturnValue([
        { id: 'loop-container', position: { x: 20, y: 10 }, data: {} },
        { ...sourceNode, parentId: 'loop-container' },
        { id: 'node-2', parentId: 'loop-container', position: { x: 200, y: 40 }, data: {} },
      ]);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
        vi.runAllTimers();
      });

      const nextNodes = getRequiredSetNodesUpdater()([
        { id: 'existing-node', position: { x: 0, y: 0 }, data: {} },
      ]);
      const previewNode = nextNodes.find((node) => node.id === PREVIEW_NODE_ID);

      expect(previewNode).toBeDefined();
      expect(previewNode?.parentId).toBe('loop-container');
      expect(previewNode?.extent).toBe('parent');
      expect(previewNode?.position).toEqual({ x: 130, y: 42 });
      expect(previewNode?.data).not.toHaveProperty('parentId');
      expect(previewNode?.data).toEqual(
        expect.objectContaining({
          originalEdge: expect.objectContaining({
            id: 'edge-1',
            data: undefined,
          }),
        })
      );
    });

    it('should not create nodes if the source node is missing', () => {
      mockReactFlowInstance.getNode.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
        vi.runAllTimers();
      });

      expect(mockReactFlowInstance.setNodes).not.toHaveBeenCalled();
      expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
    });
  });
});
