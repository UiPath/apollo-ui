import React, { useCallback, useMemo } from "react";
import { ApButton, ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { HierarchicalCanvas } from "./HierarchicalCanvas";
import { useCanvasStore } from "../../stores/canvasStore";
import { Panel, ReactFlowProvider, type Node } from "@uipath/uix/xyflow/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { type CanvasLevel } from "../../types/canvas.types";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { viewportManager } from "../../stores/viewportManager";
import type { BaseNodeData, NodeDisplay, NodeRegistration } from "../BaseNode";

// Define our workflow node types
const workflowNodeTypes = {
  // Basic nodes
  start: {
    nodeType: "start",
    displayName: "Start",
    category: "Basic",
    icon: "play_circle",
    description: "Entry point of the workflow",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Start",
      }),
      getIcon: () => <ApIcon name="play_circle" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Start",
      }),
    },
    sortOrder: 1,
  },

  end: {
    nodeType: "end",
    displayName: "End",
    category: "Basic",
    icon: "stop_circle",
    description: "Exit point of the workflow",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "End",
      }),
      getIcon: () => <ApIcon name="stop_circle" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "End",
      }),
    },
    sortOrder: 2,
  },

  // Process nodes
  process: {
    nodeType: "process",
    displayName: "Process",
    category: "Actions",
    icon: "settings",
    description: "A process or action step",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Process",
        subLabel: data.isDrillable ? "↓ Drillable" : undefined,
      }),
      getIcon: () => <ApIcon name="settings" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Process",
        isDrillable: true,
        childCanvasId: null, // Will be set when creating child canvas
      }),
      getToolbar: (data: BaseNodeData) => {
        const actions = [];

        // Add drill-in action if this node has a child canvas
        if (data.isDrillable && data.childCanvasId) {
          actions.push({
            id: "drill-in",
            icon: "open_in_new",
            label: "Open Process",
            onAction: (_nodeId: string) => {
              // Get current viewport before navigation
              const currentViewport = viewportManager.getCurrentViewport();
              // Direct store access - no prop drilling needed!
              const store = useCanvasStore.getState();
              store.navigateToCanvas(data.childCanvasId as string, currentViewport);
            },
          });
        }

        return {
          actions,
          overflowActions: [
            {
              id: "delete",
              icon: "delete",
              label: "Delete",
              onAction: (_nodeId: string) => {
                /* Delete process */
              },
            },
          ],
          position: "top" as const,
          align: "end" as const,
        };
      },
    },
    sortOrder: 10,
  },

  decision: {
    nodeType: "decision",
    displayName: "Decision",
    category: "Logic",
    icon: "help",
    description: "A decision point with multiple paths",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Decision",
      }),
      getIcon: () => <ApIcon name="help" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Decision",
        condition: "",
      }),
    },
    sortOrder: 20,
  },

  loop: {
    nodeType: "loop",
    displayName: "Loop",
    category: "Logic",
    icon: "refresh",
    description: "Iterate over items",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Loop",
      }),
      getIcon: () => <ApIcon name="refresh" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Loop",
        isDrillable: true,
        childCanvasId: null,
      }),
    },
    sortOrder: 21,
  },

  // Integration nodes
  api: {
    nodeType: "api",
    displayName: "API Call",
    category: "Integration",
    icon: "api",
    description: "Make an API request",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "API Call",
      }),
      getIcon: () => <ApIcon name="api" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "API Call",
        url: "",
        method: "GET",
      }),
    },
    sortOrder: 30,
  },

  database: {
    nodeType: "database",
    displayName: "Database",
    category: "Integration",
    icon: "database",
    description: "Database operation",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Database",
      }),
      getIcon: () => <ApIcon name="database" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Database",
        query: "",
      }),
    },
    sortOrder: 31,
  },

  // Subprocess node (drillable)
  subprocess: {
    nodeType: "subprocess",
    displayName: "Sub-Process",
    category: "Structure",
    icon: "folder",
    description: "A sub-process that contains its own workflow",
    definition: {
      getDisplay: (data: BaseNodeData): NodeDisplay => ({
        label: (data.parameters?.label as string) || "Sub-Process",
        subLabel: "⤵ Click to open",
        shape: "square" as const,
      }),
      getIcon: () => <ApIcon name="folder" size="40px" />,
      getHandleConfigurations: () => [],
      getDefaultParameters: () => ({
        label: "Sub-Process",
        isDrillable: true,
        childCanvasId: null,
      }),
      getToolbar: (data: BaseNodeData) => {
        const actions = [];

        // Add drill-in action if this node has a child canvas
        if (data.isDrillable && data.childCanvasId) {
          actions.push({
            id: "drill-in",
            icon: "open_in_new",
            label: "Open Sub-Process",
            onAction: (_nodeId: string) => {
              // Direct store access - no prop drilling needed!
              const store = useCanvasStore.getState();
              store.navigateToCanvas(data.childCanvasId as string);
            },
          });
        }

        return {
          actions,
          overflowActions: [
            {
              id: "rename",
              icon: "edit",
              label: "Rename",
              onAction: (_nodeId: string) => {
                /* Rename subprocess */
              },
            },
            {
              id: "delete",
              icon: "delete",
              label: "Delete",
              onAction: (_nodeId: string) => {
                /* Delete subprocess */
              },
            },
          ],
          position: "top" as const,
          align: "end" as const,
        };
      },
    },
    sortOrder: 40,
  },
};

// Convert to NodeRegistration array
const getNodeRegistrations = (): NodeRegistration[] => {
  return Object.values(workflowNodeTypes).map((type) => {
    const registration: NodeRegistration = {
      nodeType: type.nodeType,
      definition: type.definition,
      category: type.category,
      displayName: type.displayName,
      description: type.description,
      icon: type.icon,
      sortOrder: type.sortOrder,
      isVisible: true,
    };

    return registration;
  });
};

/**
 * Inner component that uses the hooks inside the provider
 */
const CanvasWithControlsContent: React.FC = () => {
  const store = useCanvasStore();
  const currentCanvas: CanvasLevel | undefined = useCanvasStore((state) => {
    const lastIndex = state.currentPath[state.currentPath.length - 1];
    return lastIndex !== undefined ? state.canvasStack[lastIndex] : undefined;
  });

  const handleAddNode = useCallback(
    (nodeType: string) => {
      const existingNodes = currentCanvas?.nodes.filter((n) => n.id !== "blank-canvas-node").length || 0;
      const position = {
        x: 200 + (existingNodes % 3) * 250,
        y: 200 + Math.floor(existingNodes / 3) * 200,
      };

      // Remove blank canvas node if it exists
      const blankNode = currentCanvas?.nodes.find((n) => n.id === "blank-canvas-node");
      if (blankNode) {
        store.removeNode("blank-canvas-node");
      }

      store.addNode(nodeType, position);
    },
    [store, currentCanvas]
  );

  const handleAddSampleWorkflow = useCallback(() => {
    // Clear existing nodes except blank
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node: Node) => {
        if (node.id !== "blank-canvas-node") {
          store.removeNode(node.id);
        }
      });
    }

    // Remove blank canvas node
    const blankNode = currentCanvas?.nodes.find((n) => n.id === "blank-canvas-node");
    if (blankNode) {
      store.removeNode("blank-canvas-node");
    }

    // Add a sample workflow
    const nodes = [
      { type: "start", position: { x: 100, y: 100 } },
      { type: "subprocess", position: { x: 300, y: 100 } },
      { type: "decision", position: { x: 500, y: 100 } },
      { type: "api", position: { x: 400, y: 250 } },
      { type: "subprocess", position: { x: 600, y: 250 } },
      { type: "end", position: { x: 700, y: 100 } },
    ];

    nodes.forEach((node, index) => {
      setTimeout(() => {
        store.addNode(node.type, node.position);
      }, index * 100);
    });
  }, [store, currentCanvas]);

  const handleClearCanvas = useCallback(() => {
    // Clear all nodes and edges
    if (currentCanvas?.nodes) {
      currentCanvas.nodes.forEach((node) => {
        store.removeNode(node.id);
      });
    }

    // Add back blank canvas node
    const blankNode: Node = {
      id: "blank-canvas-node",
      type: "blank-canvas-node",
      position: { x: 0, y: 0 },
      data: {},
    };

    store.updateNodes([blankNode]);
  }, [store, currentCanvas]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <HierarchicalCanvas mode="design" />

      {/* Control Panel - Left Side */}
      <Panel position="center-right">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "8px",
            backgroundColor: "var(--color-background)",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            minWidth: "180px",
          }}
        >
          <ApButton
            variant="secondary"
            label="Start"
            size="small"
            startIcon={<ApIcon name="play_circle" />}
            onClick={() => handleAddNode("start")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="Sub-Process"
            startIcon={<ApIcon name="folder" />}
            onClick={() => handleAddNode("subprocess")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="Process"
            startIcon={<ApIcon name="settings" />}
            onClick={() => handleAddNode("process")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="Decision"
            startIcon={<ApIcon name="help" />}
            onClick={() => handleAddNode("decision")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="Loop"
            startIcon={<ApIcon name="refresh" />}
            onClick={() => handleAddNode("loop")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="API Call"
            startIcon={<ApIcon name="api" />}
            onClick={() => handleAddNode("api")}
          />

          <ApButton
            variant="secondary"
            size="small"
            label="End"
            startIcon={<ApIcon name="stop_circle" />}
            onClick={() => handleAddNode("end")}
          />

          <ApButton
            variant="primary"
            size="small"
            label="Sample Workflow"
            startIcon={<ApIcon name="auto_awesome" />}
            onClick={handleAddSampleWorkflow}
          />

          <ApButton variant="secondary" size="small" label="Clear Canvas" startIcon={<ApIcon name="clear" />} onClick={handleClearCanvas} />
        </div>
      </Panel>

      {/* Info Panel - Right Side */}
      <Panel position="top-right">
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--color-background)",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontSize: "12px",
          }}
        >
          <ApTypography variant={FontVariantToken.fontSizeMBold}>Canvas Info</ApTypography>
          <div>Nodes: {currentCanvas?.nodes?.length || 0}</div>
          <div>Edges: {currentCanvas?.edges?.length || 0}</div>
          <div>Level: {store.currentPath.length}</div>
          <ApTypography variant={FontVariantToken.fontSizeMBold}>Instructions</ApTypography>
          <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
            1. Add nodes using buttons
            <br />
            2. Connect with edges
            <br />
            3. Select a Sub-Process
            <br />
            4. Click "Open Sub-Process"
            <br />
            5. Use breadcrumbs to navigate
          </div>
        </div>
      </Panel>
    </div>
  );
};

/**
 * HierarchicalCanvas with test controls for Storybook
 * This wrapper adds UI controls to test adding nodes and drilling functionality
 */
export const HierarchicalCanvasWithControls: React.FC = () => {
  // Get node registrations from the store - this would be provided by the consumer in production
  const nodeRegistrations = useMemo(() => getNodeRegistrations(), []);

  return (
    <NodeRegistryProvider registrations={nodeRegistrations}>
      <ReactFlowProvider>
        <CanvasWithControlsContent />
      </ReactFlowProvider>
    </NodeRegistryProvider>
  );
};
