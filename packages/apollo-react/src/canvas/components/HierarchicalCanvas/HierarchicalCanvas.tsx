import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Panel, applyNodeChanges, applyEdgeChanges } from "@uipath/uix/xyflow/react";
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
import { useCanvasStore, selectCurrentCanvas, selectBreadcrumbs, selectCanvasActions } from "../../stores/canvasStore";
import { viewportManager } from "../../stores/viewportManager";
import { Breadcrumb } from "@uipath/uix/core";
import { ApIcon, ApProgressSpinner } from "@uipath/portal-shell-react";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { useNodeRegistrations } from "../BaseNode/useNodeTypeRegistry";
import { BaseNode } from "../BaseNode";
import { BlankCanvasNode } from "../BlankCanvasNode";
import { shallow } from "zustand/shallow";

interface HierarchicalCanvasProps {
  mode?: "view" | "design" | "readonly";
}

// Default node type mapping
const DEFAULT_NODE_TYPES = {
  default: BaseNode,
  "blank-canvas-node": BlankCanvasNode,
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

      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
      };

      actions.updateEdges([...currentCanvas.edges, newEdge]);
    },
    [currentCanvas, actions]
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

      {/* Debug Panel */}
      <Panel position="bottom-left">
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
      </Panel>
    </BaseCanvas>
  );
};
