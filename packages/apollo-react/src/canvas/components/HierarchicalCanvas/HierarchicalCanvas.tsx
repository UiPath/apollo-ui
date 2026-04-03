import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnMove,
  type OnNodesChange,
  type OnSelectionChangeFunc,
  type OnSelectionChangeParams,
  Panel,
  type ReactFlowInstance,
  type Viewport,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon, ApProgressSpinner } from '@uipath/apollo-react/material/components';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_SPACING, PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../../constants';
import { Breadcrumb } from '../../controls';
import { useNodeManifests } from '../../core';
import { useAddNodeOnConnectEnd } from '../../hooks/useAddNodeOnConnectEnd';
import type { ToolbarActionEvent } from '../../schema/toolbar';
import { duplicateStageData } from '../StageNode/StageNode.utils';
import { animatedViewportManager } from '../../stores/animatedViewportManager';
import {
  selectAddNodeToCanvas,
  selectBreadcrumbs,
  selectCanvasStack,
  selectCurrentCanvas,
  selectCurrentPath,
  selectDrillIntoNode,
  selectGetNodeById,
  selectInitializeCanvas,
  selectInitializeWithData,
  selectNavigateToDepth,
  selectNavigateToSiblingCanvas,
  selectPreviousCanvas,
  selectTransitionState,
  selectUpdateEdges,
  selectUpdateNodes,
  selectUpdateSelection,
  selectUpdateViewport,
  useCanvasStore,
} from '../../stores/canvasStore';
import { viewportManager } from '../../stores/viewportManager';
import { DefaultCanvasTranslations } from '../../types';
import type { CanvasLevel } from '../../types/canvas.types';
import { prefersReducedMotion } from '../../utils/transitions';
import { AddNodeManager } from '../AddNodePanel/AddNodeManager';
import { AddNodePreview } from '../AddNodePanel/AddNodePreview';
import { BaseCanvas, type BaseCanvasRef } from '../BaseCanvas';
import { BaseNode } from '../BaseNode';
import { BlankCanvasNode } from '../BlankCanvasNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { MiniCanvasNavigator } from '../MiniCanvasNavigator';

interface HierarchicalCanvasProps {
  mode?: 'view' | 'design' | 'readonly';
  /**
   * Initial canvas data used to populate the store on mount.
   * Changes to this prop after mount are ignored - use onCanvasesChange to persist updates.
   */
  initialCanvases?: Record<string, CanvasLevel>;
  /**
   * Initial navigation path. Defaults to the first canvas key.
   * Changes to this prop after mount are ignored.
   */
  initialPath?: string[];
  /**
   * Called whenever canvas data changes (node positions, edges, selections, etc.).
   * Use this to persist changes or sync with external state.
   * Note: This fires frequently during interactions like dragging.
   */
  onCanvasesChange?: (canvases: Record<string, CanvasLevel>) => void;
  /**
   * Called when the user navigates to a different canvas (drill-in/out, breadcrumb click).
   */
  onPathChange?: (path: string[]) => void;
}

/**
 * Recursively walks a data object and remaps any string values or
 * array entries that match old task IDs to their new IDs.
 * This ensures references like `selectedTasksIds` in exit/entry
 * conditions are updated after stage duplication.
 */
function remapNodeDataIds(data: Record<string, unknown>, idMap: Record<string, string>): void {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value)) {
      data[key] = value.map((item) => {
        if (typeof item === 'string' && idMap[item]) return idMap[item];
        if (typeof item === 'object' && item !== null) {
          remapNodeDataIds(item as Record<string, unknown>, idMap);
        }
        return item;
      });
    } else if (typeof value === 'string' && idMap[value]) {
      data[key] = idMap[value];
    } else if (typeof value === 'object' && value !== null) {
      remapNodeDataIds(value as Record<string, unknown>, idMap);
    }
  }
}

// Default node type mapping
const DEFAULT_NODE_TYPES = {
  default: BaseNode,
  'blank-canvas-node': BlankCanvasNode,
  preview: AddNodePreview,
} as const;

export const HierarchicalCanvas: React.FC<HierarchicalCanvasProps> = ({
  mode = 'design',
  initialCanvases,
  initialPath,
  onCanvasesChange,
  onPathChange,
}) => {
  const canvasRef = useRef<BaseCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const currentViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const lastCanvasIdRef = useRef<string | null>(null);
  const shouldAnimate = mode === 'design' && !prefersReducedMotion();

  // Build node types mapping from manifests and defaults
  const nodeManifests = useNodeManifests();
  const nodeTypes = useMemo(() => {
    const types = nodeManifests.reduce(
      (acc, manifest) => {
        if (!acc[manifest.nodeType]) {
          acc[manifest.nodeType] = BaseNode;
        }
        return acc;
      },
      { ...DEFAULT_NODE_TYPES } as NodeTypes
    );
    return types as NodeTypes;
  }, [nodeManifests]);

  // Optimized selectors to prevent unnecessary re-renders
  const currentCanvas = useCanvasStore(selectCurrentCanvas);
  const previousCanvas = useCanvasStore(selectPreviousCanvas);
  const breadcrumbs = useCanvasStore(selectBreadcrumbs);
  const transitionState = useCanvasStore(selectTransitionState);
  const canvasStack = useCanvasStore(selectCanvasStack);

  // Use stable selectors defined outside component for actions
  const currentPath = useCanvasStore(selectCurrentPath);
  const initializeCanvas = useCanvasStore(selectInitializeCanvas);
  const initializeWithData = useCanvasStore(selectInitializeWithData);
  const navigateToDepth = useCanvasStore(selectNavigateToDepth);
  const navigateToSiblingCanvas = useCanvasStore(selectNavigateToSiblingCanvas);
  const updateNodes = useCanvasStore(selectUpdateNodes);
  const updateEdges = useCanvasStore(selectUpdateEdges);
  const updateSelection = useCanvasStore(selectUpdateSelection);
  const updateViewport = useCanvasStore(selectUpdateViewport);
  const drillIntoNode = useCanvasStore(selectDrillIntoNode);
  const addNodeToCanvas = useCanvasStore(selectAddNodeToCanvas);
  const getNodeById = useCanvasStore(selectGetNodeById);

  // Track currentPath in a ref for stable callback references
  const currentPathRef = useRef<string[]>(currentPath);
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const addNodeOnConnectEnd = useAddNodeOnConnectEnd();

  // Track if we've initialized to prevent re-initialization
  const hasInitialized = useRef(false);

  // Initialize canvas on mount only - props are intentionally ignored after mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (initialCanvases && Object.keys(initialCanvases).length > 0) {
      initializeWithData(initialCanvases, initialPath);
    } else {
      initializeCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only run on mount
  }, []);

  // Sync canvas changes back to consumer
  const prevCanvasStackRef = useRef(canvasStack);
  useEffect(() => {
    if (onCanvasesChange && canvasStack !== prevCanvasStackRef.current) {
      prevCanvasStackRef.current = canvasStack;
      onCanvasesChange(canvasStack);
    }
  }, [canvasStack, onCanvasesChange]);

  // Sync path changes back to consumer
  const prevPathRef = useRef(currentPath);
  useEffect(() => {
    if (onPathChange && currentPath !== prevPathRef.current) {
      prevPathRef.current = currentPath;
      onPathChange(currentPath);
    }
  }, [currentPath, onPathChange]);

  // Track current canvas viewport in a ref to avoid recreating handleInit
  const currentCanvasViewportRef = useRef<Viewport | undefined>(currentCanvas?.viewport);
  useEffect(() => {
    currentCanvasViewportRef.current = currentCanvas?.viewport;
  }, [currentCanvas?.viewport]);

  // Track current canvas in a ref for stable callbacks
  const currentCanvasRef = useRef(currentCanvas);
  useEffect(() => {
    currentCanvasRef.current = currentCanvas;
  }, [currentCanvas]);

  // Handle ReactFlow initialization
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    viewportManager.setReactFlowInstance(instance);
    animatedViewportManager.setReactFlowInstance(instance);

    // Restore viewport if it's not at default values
    const viewport = currentCanvasViewportRef.current;
    if (viewport && (viewport.x !== 0 || viewport.y !== 0 || viewport.zoom !== 1)) {
      instance.setViewport(viewport);
    }
  }, []);

  // Save viewport before navigation and restore after navigation
  useEffect(() => {
    const currentCanvasId = currentPath[currentPath.length - 1];

    // If canvas has changed, save the previous viewport and restore the new one
    if (currentCanvasId && lastCanvasIdRef.current && currentCanvasId !== lastCanvasIdRef.current) {
      // Restore current canvas viewport
      if (reactFlowInstance && currentCanvas?.viewport) {
        const viewport = currentCanvas.viewport;
        // Only restore if viewport has been modified from defaults
        if (viewport.x !== 0 || viewport.y !== 0 || viewport.zoom !== 1) {
          // Use setTimeout to ensure React Flow has updated its internal state
          setTimeout(() => {
            reactFlowInstance.setViewport(viewport);
            currentViewportRef.current = viewport;
            viewportManager.setCurrentViewport(viewport);
          }, 0);
        } else {
          currentViewportRef.current = viewport;
          viewportManager.setCurrentViewport(viewport);
        }
      }
    }

    lastCanvasIdRef.current = currentCanvasId || null;
  }, [currentPath, reactFlowInstance, currentCanvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      viewportManager.setReactFlowInstance(null);
    };
  }, []);

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes: NodeChange[]) => {
      const canvas = currentCanvasRef.current;
      if (!canvas) return;

      // Skip dimension-only changes to prevent infinite loops
      // React Flow calls onNodesChange with dimension updates after measuring nodes
      const hasMeaningfulChanges = changes.some(
        (change) => change.type !== 'dimensions' && change.type !== 'position'
      );

      // For position changes, only update if the node was actually dragged (not just measured)
      const hasPositionChanges = changes.some(
        (change) => change.type === 'position' && change.dragging
      );

      if (!hasMeaningfulChanges && !hasPositionChanges) {
        return;
      }

      const updatedNodes = applyNodeChanges(changes, canvas.nodes ?? []) as Node[];
      updateNodes(updatedNodes);
    },
    [updateNodes]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes: EdgeChange[]) => {
      const canvas = currentCanvasRef.current;
      if (!canvas) return;
      const updatedEdges = applyEdgeChanges(changes, canvas.edges ?? []);
      updateEdges(updatedEdges);
    },
    [updateEdges]
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc<Node, Edge>>(
    (params: OnSelectionChangeParams) => {
      const canvas = currentCanvasRef.current;
      if (!canvas) return;
      const nodeIds = params.nodes.map((n) => n.id);
      const edgeIds = params.edges.map((e) => e.id);

      // Only update if selection actually changed
      const nodeIdsChanged =
        nodeIds.length !== canvas.selection.nodeIds.length ||
        !nodeIds.every((id) => canvas.selection.nodeIds.includes(id));
      const edgeIdsChanged =
        edgeIds.length !== canvas.selection.edgeIds.length ||
        !edgeIds.every((id) => canvas.selection.edgeIds.includes(id));

      if (nodeIdsChanged || edgeIdsChanged) {
        updateSelection(nodeIds, edgeIds);
      }
    },
    [updateSelection]
  );

  const handleMove = useCallback<OnMove>((_event: unknown, viewport: Viewport) => {
    // Store current viewport in ref and manager for immediate access
    // Do NOT update the store here - this causes infinite render loops
    // The viewport will be synced to the store before navigation
    currentViewportRef.current = viewport;
    viewportManager.setCurrentViewport(viewport);
  }, []);

  const handleConnect = useCallback<OnConnect>(
    (connection: Connection) => {
      const canvas = currentCanvasRef.current;
      if (!connection.source || !connection.target || !canvas) return;

      // Don't create a connection to the preview node
      if (connection.target === PREVIEW_NODE_ID || connection.source === PREVIEW_NODE_ID) {
        return;
      }

      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      updateEdges([...canvas.edges, newEdge]);

      // Remove any preview node/edge after successful connection
      const hasPreview = canvas.nodes.some((n) => n.id === PREVIEW_NODE_ID);
      if (hasPreview) {
        updateNodes(canvas.nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
        updateEdges(canvas.edges.filter((e) => e.id !== PREVIEW_EDGE_ID));
      }
    },
    [updateNodes, updateEdges]
  );

  // Navigation functions with animation support
  const handleNavigateToDepth = useCallback(
    async (depth: number) => {
      // Don't navigate during transitions
      if (transitionState.isTransitioning) return;

      // Save current viewport before navigation
      // Use ref to avoid recreating this callback on path changes
      const path = currentPathRef.current;
      const currentCanvasId = path[path.length - 1];
      if (currentCanvasId && reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();
        updateViewport(viewport, currentCanvasId);
      }

      // Use animated navigation if design mode and user doesn't prefer reduced motion
      await navigateToDepth(depth, shouldAnimate);
    },
    [
      navigateToDepth,
      updateViewport,
      reactFlowInstance,
      transitionState.isTransitioning,
      shouldAnimate,
    ]
  );

  const handleToolbarAction = useCallback(
    async (event: ToolbarActionEvent) => {
      if (event.actionId === 'drill-in') {
        await drillIntoNode(event.nodeId, true);
      } else if (event.actionId === 'duplicate') {
        const sourceNode = getNodeById(event.nodeId);
        if (!sourceNode) return;

        const newNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const offset = GRID_SPACING * 2;

        // Deep clone the node data
        const clonedData = structuredClone(sourceNode.data) ?? {};

        // If this is a stage node with tasks, remap task IDs
        const stageDetails = clonedData.stageDetails as
          | { tasks?: { id: string }[][]; label?: string }
          | undefined;
        if (stageDetails?.tasks) {
          const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { tasks: newTasks, idMap } = duplicateStageData(
            stageDetails.tasks as import('../StageNode/StageNode.types').StageTaskItem[][],
            generateId
          );
          stageDetails.tasks = newTasks;

          // Remap task ID references in conditions (headerChips don't contain IDs,
          // but any selectedTasksIds or similar arrays in the data should be remapped)
          remapNodeDataIds(clonedData, idMap);

          // Append " - Copy" to the stage label
          if (stageDetails.label) {
            stageDetails.label = `${stageDetails.label} - Copy`;
          }
        }

        const duplicatedNode: Node = {
          ...sourceNode,
          id: newNodeId,
          position: {
            x: sourceNode.position.x + offset,
            y: sourceNode.position.y + offset,
          },
          data: clonedData,
          selected: false,
        };

        addNodeToCanvas(duplicatedNode);
      }
    },
    [drillIntoNode, getNodeById, addNodeToCanvas]
  );

  // Handle click on nodes in the previous canvas view
  const handlePreviousCanvasNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Check if the node is drillable (has childCanvasId)
      if (node.data?.childCanvasId) {
        // Navigate to the sibling canvas directly with a single state update
        navigateToSiblingCanvas(node.data.childCanvasId as string, shouldAnimate);
      }
    },
    [navigateToSiblingCanvas, shouldAnimate]
  );

  // Only fit view if viewport is at default values (never been modified)
  const shouldFitView = useMemo(() => {
    const viewport = currentCanvas?.viewport;
    return viewport ? viewport.x === 0 && viewport.y === 0 && viewport.zoom === 1 : false;
  }, [currentCanvas?.viewport]);

  if (!currentCanvas) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ApProgressSpinner />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--uix-canvas-background-secondary)',
      }}
    >
      {breadcrumbs.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            background: 'var(--uix-canvas-background)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Breadcrumb
            items={breadcrumbs.map((crumb, index) => ({
              label: crumb.name,
              onClick:
                index < breadcrumbs.length - 1 ? () => handleNavigateToDepth(index) : undefined,
              startAdornment: index === 0 ? <ApIcon name="home" /> : undefined,
            }))}
            delimiter={<ApIcon name="chevron_right" />}
          />
        </div>
      )}

      {previousCanvas && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <MiniCanvasNavigator
            previousCanvas={previousCanvas}
            currentCanvasId={currentCanvas?.id}
            nodeTypes={nodeTypes}
            onNodeClick={handlePreviousCanvasNodeClick}
          />
        </div>
      )}

      <BaseCanvas
        key={currentCanvas.id}
        ref={canvasRef}
        nodes={currentCanvas.nodes}
        edges={currentCanvas.edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSelectionChange={handleSelectionChange}
        onMove={handleMove}
        onConnect={handleConnect}
        onConnectEnd={addNodeOnConnectEnd}
        onInit={handleInit}
        onToolbarAction={handleToolbarAction}
        mode={mode}
        defaultViewport={currentCanvas.viewport}
        fitView={shouldFitView}
        fitViewOptions={{ padding: 0.2, minZoom: 1, maxZoom: 1 }}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls translations={DefaultCanvasTranslations} />
        </Panel>

        <AddNodeManager />
      </BaseCanvas>
    </div>
  );
};
