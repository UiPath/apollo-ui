import type React from "react";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Panel, applyNodeChanges, applyEdgeChanges } from "@uipath/uix/xyflow/react";
import { prefersReducedMotion } from "../../utils/transitions";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  Viewport,
  OnSelectionChangeParams,
  Connection,
  OnConnect,
  OnMove,
  OnSelectionChangeFunc,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  NodeTypes,
} from "@uipath/uix/xyflow/react";
import { BaseCanvas, type BaseCanvasRef } from "../BaseCanvas";
import {
  useCanvasStore,
  selectCurrentCanvas,
  selectBreadcrumbs,
  selectCanvasActions,
  selectPreviousCanvas,
  selectTransitionState,
} from "../../stores/canvasStore";
import { viewportManager } from "../../stores/viewportManager";
import { animatedViewportManager } from "../../stores/animatedViewportManager";
import { Breadcrumb } from "@uipath/uix/core";
import { ApIcon, ApProgressSpinner } from "@uipath/portal-shell-react";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { useNodeRegistrations } from "../BaseNode/useNodeTypeRegistry";
import { BaseNode } from "../BaseNode";
import { BlankCanvasNode } from "../BlankCanvasNode";
import { AddNodePreview } from "../AddNodePanel/AddNodePreview";
import { AddNodeManager } from "../AddNodePanel/AddNodeManager";
import { MiniCanvasNavigator } from "../MiniCanvasNavigator";
import { shallow } from "zustand/shallow";
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from "../../constants";
import { useAddNodeOnConnectEnd } from "../../hooks/useAddNodeOnConnectEnd";

interface HierarchicalCanvasProps {
  mode?: "view" | "design" | "readonly";
}

// Default node type mapping
const DEFAULT_NODE_TYPES = {
  default: BaseNode,
  "blank-canvas-node": BlankCanvasNode,
  preview: AddNodePreview,
} as const;

export const HierarchicalCanvas: React.FC<HierarchicalCanvasProps> = ({ mode = "design" }) => {
  const canvasRef = useRef<BaseCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const currentViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const lastCanvasIdRef = useRef<string | null>(null);
  const shouldAnimate = mode === "design" && !prefersReducedMotion();

  // Build node types mapping from registrations and defaults
  const nodeRegistrations = useNodeRegistrations();
  const nodeTypes = useMemo(() => {
    const types = nodeRegistrations.reduce(
      (acc, registration) => {
        if (!acc[registration.nodeType]) {
          acc[registration.nodeType] = BaseNode;
        }
        return acc;
      },
      { ...DEFAULT_NODE_TYPES } as NodeTypes
    );
    return types as NodeTypes;
  }, [nodeRegistrations]);

  // Optimized selectors to prevent unnecessary re-renders
  const currentCanvas = useCanvasStore(selectCurrentCanvas);
  const previousCanvas = useCanvasStore(selectPreviousCanvas);
  const breadcrumbs = useCanvasStore(selectBreadcrumbs, shallow);
  const actions = useCanvasStore(selectCanvasActions, shallow);
  const transitionState = useCanvasStore(selectTransitionState);
  const store = useCanvasStore();

  const addNodeOnConnectEnd = useAddNodeOnConnectEnd();

  // Initialize canvas on mount
  useEffect(() => {
    if (store.currentPath.length === 0) {
      store.initializeCanvas();
    }
  }, [store]);

  // Handle ReactFlow initialization
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      setReactFlowInstance(instance);
      viewportManager.setReactFlowInstance(instance);
      animatedViewportManager.setReactFlowInstance(instance);

      // Restore viewport if it's not at default values
      const viewport = currentCanvas?.viewport;
      if (viewport && (viewport.x !== 0 || viewport.y !== 0 || viewport.zoom !== 1)) {
        instance.setViewport(viewport);
      }
    },
    [currentCanvas]
  );

  // Save viewport before navigation and restore after navigation
  useEffect(() => {
    const currentCanvasId = store.currentPath[store.currentPath.length - 1];

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
  }, [store.currentPath, reactFlowInstance, currentCanvas, store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      viewportManager.setReactFlowInstance(null);
    };
  }, []);

  const handleNodesChange = useCallback<OnNodesChange>(
    (changes: NodeChange[]) => {
      if (!currentCanvas) return;
      const updatedNodes = applyNodeChanges(changes, currentCanvas.nodes ?? []) as Node[];
      actions.updateNodes(updatedNodes);
    },
    [currentCanvas, actions]
  );

  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes: EdgeChange[]) => {
      if (!currentCanvas) return;
      const updatedEdges = applyEdgeChanges(changes, currentCanvas.edges ?? []);
      actions.updateEdges(updatedEdges);
    },
    [currentCanvas, actions]
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc<Node, Edge>>(
    (params: OnSelectionChangeParams) => {
      if (!currentCanvas) return;
      const nodeIds = params.nodes.map((n) => n.id);
      const edgeIds = params.edges.map((e) => e.id);

      // Only update if selection actually changed
      const nodeIdsChanged =
        nodeIds.length !== currentCanvas.selection.nodeIds.length || !nodeIds.every((id) => currentCanvas.selection.nodeIds.includes(id));
      const edgeIdsChanged =
        edgeIds.length !== currentCanvas.selection.edgeIds.length || !edgeIds.every((id) => currentCanvas.selection.edgeIds.includes(id));

      if (nodeIdsChanged || edgeIdsChanged) {
        actions.updateSelection(nodeIds, edgeIds);
      }
    },
    [currentCanvas, actions]
  );

  const handleMove = useCallback<OnMove>(
    (_event: unknown, viewport: Viewport) => {
      // Store current viewport in ref and manager for immediate access
      currentViewportRef.current = viewport;
      viewportManager.setCurrentViewport(viewport);

      // Update store with current viewport (this will be saved before navigation)
      const currentCanvasId = store.currentPath[store.currentPath.length - 1];
      if (currentCanvasId) {
        actions.updateViewport(viewport, currentCanvasId);
      }
    },
    [actions, store.currentPath]
  );

  const handleConnect = useCallback<OnConnect>(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !currentCanvas) return;

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

      actions.updateEdges([...currentCanvas.edges, newEdge]);

      // Remove any preview node/edge after successful connection
      const hasPreview = currentCanvas.nodes.some((n) => n.id === PREVIEW_NODE_ID);
      if (hasPreview) {
        actions.updateNodes(currentCanvas.nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
        actions.updateEdges(currentCanvas.edges.filter((e) => e.id !== PREVIEW_EDGE_ID));
      }
    },
    [currentCanvas, actions]
  );

  // Navigation functions with animation support
  const handleNavigateToDepth = useCallback(
    async (depth: number) => {
      // Don't navigate during transitions
      if (transitionState.isTransitioning) return;

      // Save current viewport before navigation
      const currentCanvasId = store.currentPath[store.currentPath.length - 1];
      if (currentCanvasId && reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();
        actions.updateViewport(viewport, currentCanvasId);
      }

      // Use animated navigation if design mode and user doesn't prefer reduced motion
      await actions.navigateToDepth(depth, shouldAnimate);
    },
    [actions, reactFlowInstance, store.currentPath, transitionState.isTransitioning, shouldAnimate]
  );

  const maintainNodesInView = useMemo(
    () => (currentCanvas?.nodes?.length === 1 && currentCanvas?.nodes[0]?.id === "blank-canvas-node" ? ["blank-canvas-node"] : undefined),
    [currentCanvas]
  );

  // Handle click on nodes in the previous canvas view
  const handlePreviousCanvasNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Check if the node is drillable (has childCanvasId)
      if (node.data?.childCanvasId) {
        // Navigate to the sibling canvas directly with a single state update
        actions.navigateToSiblingCanvas(node.data.childCanvasId as string, shouldAnimate);
      }
    },
    [actions, shouldAnimate]
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
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ApProgressSpinner />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative", background: "var(--uix-canvas-background-secondary)" }}
    >
      {breadcrumbs.length > 1 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
            background: "var(--uix-canvas-background)",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Breadcrumb
            items={breadcrumbs.map((crumb, index) => ({
              label: crumb.name,
              onClick: index < breadcrumbs.length - 1 ? () => handleNavigateToDepth(index) : undefined,
              startAdornment: index === 0 ? <ApIcon name="home" /> : undefined,
            }))}
            delimiter={<ApIcon name="chevron_right" />}
          />
        </div>
      )}

      {previousCanvas && (
        <div
          style={{
            position: "absolute",
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
        maintainNodesInView={maintainNodesInView}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSelectionChange={handleSelectionChange}
        onMove={handleMove}
        onConnect={handleConnect}
        onConnectEnd={addNodeOnConnectEnd}
        onInit={handleInit}
        mode={mode}
        defaultViewport={currentCanvas.viewport}
        fitView={shouldFitView}
        fitViewOptions={{ padding: 0.2, minZoom: 1, maxZoom: 1 }}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>

        <AddNodeManager />
      </BaseCanvas>
    </div>
  );
};
