import { act, renderHook } from '@testing-library/react';
import {
  type Edge,
  MarkerType,
  type Node,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_NODE_ID } from '../../../constants';
import { NodeRegistryContext, type NodeTypeRegistry } from '../../../core';
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

vi.mock('../../../utils/createPreviewNode', () => ({
  isPreviewEdge: vi.fn(
    ({ source, target }: { id: string; source: string; target: string }) =>
      source === PREVIEW_NODE_ID || target === PREVIEW_NODE_ID
  ),
}));

vi.mock('../../../utils/createPreviewGraph', () => ({
  showPreviewGraph: vi.fn(),
}));

const { useEdgeToolbarPositioning } = await import('./useEdgeToolbarPositioning');
const { showPreviewGraph } = await import('../../../utils/createPreviewGraph');

function createContainerRegistry(): NodeTypeRegistry {
  return {
    getManifest: vi.fn((nodeType: string) =>
      nodeType === 'loop'
        ? {
            nodeType,
            display: { label: 'Loop', shape: 'container' },
            handleConfiguration: [],
          }
        : {
            nodeType,
            display: { label: 'Task', shape: 'square' },
            handleConfiguration: [],
          }
    ),
  } as unknown as NodeTypeRegistry;
}

function createRegistryWrapper(registry: NodeTypeRegistry) {
  return function RegistryWrapper({ children }: { children: ReactNode }) {
    return createElement(NodeRegistryContext.Provider, { value: { registry } }, children);
  };
}

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
  const originalEdge: Edge = {
    id: 'edge-1',
    source: 'node-1',
    sourceHandle: 'output',
    target: 'node-2',
    targetHandle: 'input',
    type: 'smoothstep',
    data: { replaced: true },
    style: { stroke: 'var(--canvas-foreground)' },
    label: 'Original edge',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0f172a' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReactFlowInstance.getNode.mockReturnValue(undefined);
    mockReactFlowInstance.getNodes.mockReturnValue([]);
    mockReactFlowInstance.getEdges.mockReturnValue([originalEdge]);
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

      expect(showPreviewGraph).toHaveBeenCalledWith({
        source: {
          nodeId: 'node-1',
          handleId: 'output',
        },
        reactFlowInstance: mockReactFlowInstance,
        position,
        positionMode: 'drop',
        data: {
          originalEdge,
        },
        sourceHandleType: 'source',
        handlePosition: Position.Right,
        ignoredNodeTypes: [],
        target: {
          nodeId: 'node-2',
          handleId: 'input',
        },
      });
    });

    it('should keep non-container edge insertion on the original drop placement path', () => {
      const sourceNode = {
        id: 'node-1',
        type: 'task',
        position: { x: 100, y: 100 },
        measured: { width: 120, height: 80 },
        data: {},
      };
      const targetNode = {
        id: 'node-2',
        type: 'task',
        position: { x: 320, y: 100 },
        measured: { width: 120, height: 80 },
        data: {},
      };
      const nodes = [sourceNode, targetNode];
      mockReactFlowInstance.getNode.mockImplementation((id: string) =>
        nodes.find((node) => node.id === id)
      );
      mockReactFlowInstance.getNodes.mockReturnValue(nodes);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      const position = { x: 240, y: 140 };

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', position);
      });

      expect(showPreviewGraph).toHaveBeenCalledWith(
        expect.objectContaining({
          position,
          positionMode: 'drop',
          source: {
            nodeId: 'node-1',
            handleId: 'output',
          },
          target: {
            nodeId: 'node-2',
            handleId: 'input',
          },
        })
      );
      expect(vi.mocked(showPreviewGraph).mock.calls[0]?.[0]).not.toHaveProperty('containerId');
    });

    it('should use container sequence placement for edge insertion between container children', () => {
      const containerNode: Node = {
        id: 'loop-1',
        type: 'loop',
        position: { x: 500, y: 100 },
        style: { width: 704, height: 368 },
        data: {},
      };
      const sourceNode: Node = {
        id: 'node-1',
        type: 'task',
        position: { x: 160, y: 96 },
        parentId: containerNode.id,
        measured: { width: 96, height: 96 },
        data: {},
      };
      const targetNode: Node = {
        id: 'node-2',
        type: 'task',
        position: { x: 480, y: 96 },
        parentId: containerNode.id,
        measured: { width: 96, height: 96 },
        data: {},
      };
      const nodes = [containerNode, sourceNode, targetNode];
      mockReactFlowInstance.getNode.mockImplementation((id: string) =>
        nodes.find((node) => node.id === id)
      );
      mockReactFlowInstance.getNodes.mockReturnValue(nodes);

      const { result } = renderHook(
        () =>
          useEdgeToolbarState({
            ...defaultProps,
            isHovered: true,
          }),
        { wrapper: createRegistryWrapper(createContainerRegistry()) }
      );

      const rawPosition = { x: 620, y: 260 };

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', rawPosition);
      });

      const previewOptions = vi.mocked(showPreviewGraph).mock.calls[0]?.[0];

      expect(previewOptions).toEqual(
        expect.objectContaining({
          containerId: containerNode.id,
          positionMode: 'center',
          source: {
            nodeId: sourceNode.id,
            handleId: 'output',
          },
          target: {
            nodeId: targetNode.id,
            handleId: 'input',
          },
        })
      );
      expect(previewOptions?.position).not.toEqual(rawPosition);
      expect(previewOptions?.data).toEqual(
        expect.objectContaining({
          originalEdge,
          placement: {
            containerId: containerNode.id,
            sourceNodeId: sourceNode.id,
            targetNodeId: targetNode.id,
            mode: 'sequence',
          },
        })
      );
    });

    it('should not mutate edges directly if preview graph creation returns null', () => {
      vi.mocked(showPreviewGraph).mockReturnValueOnce(null);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 150, y: 100 });
      });

      expect(showPreviewGraph).toHaveBeenCalledOnce();
      expect(mockReactFlowInstance.setEdges).not.toHaveBeenCalled();
    });

    it('should keep structural container edges on the explicit edge-anchor path', () => {
      const containerNode = {
        id: 'loop-1',
        type: 'loop',
        position: { x: 200, y: 100 },
        style: { width: 400, height: 300 },
        data: {},
      };
      const childNode = {
        id: 'child-1',
        type: 'task',
        position: { x: 220, y: 160 },
        parentId: 'loop-1',
        measured: { width: 80, height: 40 },
        data: {},
      };
      const nodes = [containerNode, childNode];
      mockReactFlowInstance.getNode.mockImplementation((id: string) =>
        nodes.find((node) => node.id === id)
      );
      mockReactFlowInstance.getNodes.mockReturnValue(nodes);

      const { result } = renderHook(() =>
        useEdgeToolbarState({
          ...defaultProps,
          isHovered: true,
          source: 'child-1',
          target: 'loop-1',
          targetHandleId: 'continue',
        })
      );

      act(() => {
        result.current.config.actions[0]?.onAction('edge-1', { x: 580, y: 260 });
      });

      expect(showPreviewGraph).toHaveBeenCalledWith(
        expect.objectContaining({
          position: { x: 580, y: 260 },
          positionMode: 'drop',
          source: {
            nodeId: 'child-1',
            handleId: 'output',
          },
          target: {
            nodeId: 'loop-1',
            handleId: 'continue',
          },
        })
      );
      expect(vi.mocked(showPreviewGraph).mock.calls[0]?.[0]).not.toHaveProperty('containerId');
    });
  });
});
