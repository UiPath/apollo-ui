import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Panel, applyNodeChanges, applyEdgeChanges, ReactFlowProvider } from "@uipath/uix/xyflow/react";
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
  OnConnectEnd,
} from "@uipath/uix/xyflow/react";
import { BaseCanvas, type BaseCanvasRef } from "../BaseCanvas";
import {
  useCanvasStore,
  selectCurrentCanvas,
  selectBreadcrumbs,
  selectCanvasActions,
  selectPreviousCanvas,
} from "../../stores/canvasStore";
import { viewportManager } from "../../stores/viewportManager";
import { Breadcrumb } from "@uipath/uix/core";
import { ApIcon, ApProgressSpinner } from "@uipath/portal-shell-react";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { useNodeRegistrations } from "../BaseNode/useNodeTypeRegistry";
import { BaseNode } from "../BaseNode";
import { BlankCanvasNode } from "../BlankCanvasNode";
import { AddNodePreview } from "../AddNodePanel/AddNodePreview";
import { AddNodeManager } from "../AddNodePanel/AddNodeManager";
import { createPreviewNode } from "../../utils/createPreviewNode";
import { shallow } from "zustand/shallow";

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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const currentViewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const lastCanvasIdRef = useRef<string | null>(null);

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
  const store = useCanvasStore();

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
      if (connection.target === "preview-node-id" || connection.source === "preview-node-id") {
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
      const hasPreview = currentCanvas.nodes.some((n) => n.id === "preview-node-id");
      if (hasPreview) {
        actions.updateNodes(currentCanvas.nodes.filter((n) => n.id !== "preview-node-id"));
        actions.updateEdges(currentCanvas.edges.filter((e) => e.id !== "preview-edge-id"));
      }
    },
    [currentCanvas, actions]
  );

  // Track connection start info for creating preview nodes
  const connectionStartRef = useRef<{ source: string; sourceHandle: string | null } | null>(null);

  const handleConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent, params: { nodeId: string | null; handleId: string | null }) => {
      if (params.nodeId) {
        // If starting a new drag and there's an existing preview, remove it first
        if (currentCanvas) {
          const hasPreview = currentCanvas.nodes.some((n) => n.id === "preview-node-id");
          if (hasPreview) {
            // Remove the preview node and edge
            actions.updateNodes(currentCanvas.nodes.filter((n) => n.id !== "preview-node-id"));
            actions.updateEdges(currentCanvas.edges.filter((e) => e.id !== "preview-edge-id"));
          }
        }

        connectionStartRef.current = {
          source: params.nodeId,
          sourceHandle: params.handleId,
        };
      }
    },
    [currentCanvas, actions]
  );

  const handleConnectEnd = useCallback<OnConnectEnd>(
    (event: MouseEvent | TouchEvent) => {
      if (!connectionStartRef.current || !currentCanvas || !reactFlowInstance) return;

      // Check if we ended on a handle (successful connection)
      // If the connection was successful, onConnect would have been called
      // We can check if the event target is not a handle
      const target = event.target as HTMLElement;
      const isHandle = target.closest(".react-flow__handle");

      // Also check if we clicked on the preview node itself
      const isPreviewNode = target.closest('[data-id="preview-node-id"]');

      if (!isHandle && !isPreviewNode) {
        // Get the position where the connection was dropped
        const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
        if (!reactFlowBounds) return;

        // Calculate the position in flow coordinates
        let clientX: number;
        let clientY: number;

        if ("clientX" in event) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else {
          const touchEvent = event as TouchEvent;
          if (touchEvent.touches && touchEvent.touches.length > 0 && touchEvent.touches[0]) {
            const touch = touchEvent.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
          } else if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0 && touchEvent.changedTouches[0]) {
            const touch = touchEvent.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
          } else {
            return;
          }
        }

        const dropPosition = reactFlowInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        // Use the unified preview creation utility
        const preview = createPreviewNode(
          connectionStartRef.current.source,
          connectionStartRef.current.sourceHandle || "output",
          reactFlowInstance,
          dropPosition
        );

        if (preview) {
          // Add preview node and edge using setTimeout to avoid React Flow's internal reset
          setTimeout(() => {
            actions.updateNodes([...currentCanvas.nodes.map((n) => ({ ...n, selected: false })), preview.node]);
            actions.updateEdges([...currentCanvas.edges, preview.edge]);
          }, 0);
        }
      }

      // Clear the connection start info
      connectionStartRef.current = null;
    },
    [currentCanvas, actions, reactFlowInstance]
  );

  // Navigation functions
  const navigateToDepth = useCallback(
    (depth: number) => {
      // Save current viewport before navigation
      const currentCanvasId = store.currentPath[store.currentPath.length - 1];
      if (currentCanvasId && reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();
        actions.updateViewport(viewport, currentCanvasId);
      }

      actions.navigateToDepth(depth);
    },
    [actions, reactFlowInstance, store.currentPath]
  );

  const maintainNodesInView = useMemo(
    () => (currentCanvas?.nodes?.length === 1 && currentCanvas?.nodes[0]?.id === "blank-canvas-node" ? ["blank-canvas-node"] : undefined),
    [currentCanvas]
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
    <BaseCanvas
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
      onConnectStart={handleConnectStart}
      onConnectEnd={handleConnectEnd}
      onInit={handleInit}
      mode={mode}
      defaultViewport={currentCanvas.viewport}
      fitView={shouldFitView}
      fitViewOptions={{ padding: 0.2, minZoom: 1, maxZoom: 1 }}
    >
      {/* Breadcrumbs */}
      <Panel position="top-left">
        {breadcrumbs.length > 1 && (
          <div
            style={{
              background: "var(--color-background)",
              borderRadius: "8px",
              padding: "8px 12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Breadcrumb
              items={breadcrumbs.map((crumb, index) => ({
                label: crumb.name,
                onClick: index < breadcrumbs.length - 1 ? () => navigateToDepth(index) : undefined,
                startAdornment: index === 0 ? <ApIcon name="home" /> : undefined,
              }))}
              delimiter={<ApIcon name="chevron_right" />}
            />
          </div>
        )}
      </Panel>

      {/* Canvas Controls */}
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>

      {previousCanvas && (
        <Panel position="bottom-left">
          <div
            style={{
              width: 300,
              height: 200,
              background: "var(--color-background)",
              border: "1px solid var(--color-border-grid)",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <ReactFlowProvider>
              <BaseCanvas
                key={previousCanvas.id}
                nodes={previousCanvas.nodes}
                edges={previousCanvas.edges}
                nodeTypes={nodeTypes}
                fitView
                mode="readonly"
                showBackground={false}
              />
            </ReactFlowProvider>
          </div>
        </Panel>
      )}

      {/* Debug Panel */}
      {/* <Panel position="bottom-left">
        <pre
          style={{
            fontSize: 10,
            height: "600px",
            width: "300px",
            overflow: "auto",
            color: "var(--color-foreground)",
            backgroundColor: "var(--color-background-secondary)",
            border: "1px solid var(--color-border-de-emp)",
            borderRadius: "8px",
            padding: 10,
          }}
        >
          <code>{JSON.stringify(currentCanvas, null, 2)}</code>
        </pre>
      </Panel> */}

      {/* Add Node Manager to handle preview node selection */}
      <AddNodeManager />
    </BaseCanvas>
  );
};
