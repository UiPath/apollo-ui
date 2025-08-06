import { useCallback, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  applyEdgeChanges,
  applyNodeChanges,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import type { Edge, EdgeChange, Node, NodeChange } from "@xyflow/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { ApButton, ApTypography } from "@uipath/portal-shell-react";
import { Column, Row } from "../layouts";
import { CanvasPositionControls } from "./CanvasPositionControls";
import { BaseCanvas } from "./BaseCanvas";
import { BaseCanvasRef } from "./BaseCanvas.types";

// Wrapper component that provides ReactFlow context
const BaseCanvasWithProvider = (props: any) => {
  return (
    <ReactFlowProvider>
      <BaseCanvas {...props} />
    </ReactFlowProvider>
  );
};

const meta = {
  title: "Components/BaseCanvas",
  component: BaseCanvasWithProvider,
  decorators: [
    (Story: any) => (
      <div style={{ height: "100vh", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    // Canvas behavior
    mode: {
      control: { type: "select" },
      options: ["design", "view", "readonly"],
      description: "Canvas interaction mode",
    },

    // Styling
    backgroundColor: {
      control: { type: "color" },
      description: "Canvas background color",
    },
    backgroundSecondaryColor: {
      control: { type: "color" },
      description: "Secondary background color for patterns",
    },
    backgroundVariant: {
      control: { type: "select" },
      options: ["dots", "lines", "cross"],
      description: "Background pattern variant",
    },
    backgroundGap: {
      control: { type: "number" },
      description: "Gap between background pattern elements",
    },
    backgroundSize: {
      control: { type: "number" },
      description: "Size of background pattern elements",
    },

    // Zoom controls
    minZoom: {
      control: { type: "number", min: 0.1, max: 1, step: 0.1 },
      description: "Minimum zoom level",
    },
    maxZoom: {
      control: { type: "number", min: 1, max: 10, step: 0.5 },
      description: "Maximum zoom level",
    },

    // Core ReactFlow props
    nodes: {
      control: { type: "object" },
      description: "Array of nodes",
    },
    edges: {
      control: { type: "object" },
      description: "Array of edges",
    },
    nodeTypes: {
      control: { type: "object" },
      description: "Custom node types",
    },
    edgeTypes: {
      control: { type: "object" },
      description: "Custom edge types",
    },

    // Layout
    initialAutoLayout: {
      control: false,
      description: "Function to perform initial auto-layout",
    },

    // Events (hiding from controls but documenting)
    onNodesChange: { control: false },
    onEdgesChange: { control: false },
    onConnect: { control: false },
    onNodeClick: { control: false },
    onNodeDragStart: { control: false },
    onNodeDrag: { control: false },
    onNodeDragStop: { control: false },
    onPaneClick: { control: false },
  },
} satisfies Meta<typeof BaseCanvasWithProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample nodes and edges
const sampleNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "Node 1" },
    type: "default",
  },
  {
    id: "2",
    position: { x: 300, y: 100 },
    data: { label: "Node 2" },
    type: "default",
  },
  {
    id: "3",
    position: { x: 200, y: 250 },
    data: { label: "Node 3" },
    type: "default",
  },
];

const sampleEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-3", source: "2", target: "3" },
];

export const Default: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeTypes: {},
    mode: "view",
  },
};

// Design Mode with state management
const DesignModeCanvas = () => {
  const [nodes, setNodes] = useState<Node[]>(sampleNodes);
  const [edges, setEdges] = useState<Edge[]>(sampleEdges);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  return (
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={{}}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const DesignMode: Story = {
  render: () => <DesignModeCanvas />,
};

export const DifferentBackgrounds: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeTypes: {},
    backgroundVariant: BackgroundVariant.Lines,
    backgroundGap: 20,
    backgroundSize: 1,
  },
};

export const ReadOnlyMode: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeTypes: {},
    mode: "readonly",
  },
};

export const CustomZoomLimits: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeTypes: {},
    minZoom: 0.1,
    maxZoom: 4,
  },
};

export const EmptyCanvas: Story = {
  args: {
    nodes: [],
    edges: [],
    nodeTypes: {},
    edgeTypes: {},
  },
};

export const WithChildren: Story = {
  args: {
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeTypes: {},
    mode: "view",
    children: (
      <Panel position="top-right">
        <Column
          p={20}
          style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)" }}
        >
          <ApTypography variant={FontVariantToken.fontSizeH3Bold} style={{ marginBottom: 8 }}>
            Custom Overlay
          </ApTypography>
          <ApTypography>This is custom content rendered as children</ApTypography>
          <ApButton label="Click Me" onClick={() => alert("Button clicked!")} style={{ marginTop: 10 }} />
        </Column>
      </Panel>
    ),
  },
};

// Component with ref control for demonstrating ensure nodes in view
const BaseCanvasWithNodeFocus = () => {
  const canvasRef = useRef<BaseCanvasRef>(null);

  // Nodes spread across a larger area
  const spreadNodes: Node[] = [
    {
      id: "1",
      position: { x: 100, y: 100 },
      data: { label: "Node 1" },
      type: "default",
    },
    {
      id: "2",
      position: { x: 800, y: 100 },
      data: { label: "Node 2" },
      type: "default",
    },
    {
      id: "3",
      position: { x: 100, y: 600 },
      data: { label: "Node 3" },
      type: "default",
    },
    {
      id: "4",
      position: { x: 800, y: 600 },
      data: { label: "Node 4" },
      type: "default",
    },
    {
      id: "5",
      position: { x: 450, y: 350 },
      data: { label: "Center Node" },
      type: "default",
    },
  ];

  const edges: Edge[] = [
    { id: "e1-5", source: "1", target: "5" },
    { id: "e2-5", source: "2", target: "5" },
    { id: "e3-5", source: "3", target: "5" },
    { id: "e4-5", source: "4", target: "5" },
  ];

  return (
    <ReactFlowProvider>
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
        <BaseCanvas ref={canvasRef} nodes={spreadNodes} edges={edges} nodeTypes={{}} mode="view">
          <Panel position="top-left">
            <Column
              gap={8}
              p={20}
              style={{
                color: "var(--color-foreground)",
                backgroundColor: "var(--color-background-secondary)",
              }}
            >
              <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Focus Controls</ApTypography>
              <ApButton
                size="small"
                label="Focus Node 1"
                onClick={() => canvasRef.current?.ensureNodesInView(["1"])}
              />
              <ApButton
                size="small"
                label="Focus Node 2"
                onClick={() => canvasRef.current?.ensureNodesInView(["2"])}
              />
              <ApButton
                size="small"
                label="Focus Nodes 3 & 4"
                onClick={() => canvasRef.current?.ensureNodesInView(["3", "4"])}
              />
              <ApButton
                size="small"
                label="Center on Node 5"
                onClick={() => canvasRef.current?.centerNode("5")}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Show All Nodes"
                onClick={() => canvasRef.current?.ensureAllNodesInView()}
              />
              <ApButton
                size="small"
                variant="secondary"
                label="Focus 1 & 2 (Keep Zoom)"
                onClick={() => canvasRef.current?.ensureNodesInView(["1", "2"], { maintainZoom: true })}
              />
            </Column>
          </Panel>
        </BaseCanvas>
      </div>
    </ReactFlowProvider>
  );
};

export const WithNodeFocusControls: Story = {
  render: () => <BaseCanvasWithNodeFocus />,
};

const BaseCanvasWithReactFlowAccess = () => {
  const canvasRef = useRef<BaseCanvasRef>(null);
  const [nodes, setNodes] = useState<Node[]>(sampleNodes);
  const [edges, setEdges] = useState<Edge[]>(sampleEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleZoomIn = () => {
    canvasRef.current?.reactFlow?.zoomIn();
  };

  const handleZoomOut = () => {
    canvasRef.current?.reactFlow?.zoomOut();
  };

  const handleResetView = () => {
    canvasRef.current?.reactFlow?.fitView();
  };

  const handleGetStats = () => {
    const nodeCount = canvasRef.current?.reactFlow?.getNodes().length || 0;
    const edgeCount = canvasRef.current?.reactFlow?.getEdges().length || 0;
    const viewport = canvasRef.current?.reactFlow?.getViewport();
    alert(`Nodes: ${nodeCount}, Edges: ${edgeCount}, Zoom: ${viewport?.zoom.toFixed(2)}`);
  };

  return (
    <ReactFlowProvider>
      <BaseCanvas
        ref={canvasRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        mode="view"
      >
        <Panel position="bottom-left">
          <Column
            gap={8}
            p={20}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>
              ReactFlow Instance Access Demo
            </ApTypography>
            <ApButton label="Zoom In" onClick={handleZoomIn} />
            <ApButton label="Zoom Out" onClick={handleZoomOut} />
            <ApButton label="Reset View" onClick={handleResetView} />
            <ApButton label="Get Canvas Stats" onClick={handleGetStats} />
          </Column>
        </Panel>
        <CanvasPositionControls />
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const WithReactFlowAccess: Story = {
  render: () => <BaseCanvasWithReactFlowAccess />,
};

// Example demonstrating maintain nodes in view on resize
const BaseCanvasWithMaintainNodesInView = () => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "important-1",
      data: { label: "Important Node 1" },
      position: { x: 100, y: 100 },
      type: "default",
    },
    {
      id: "important-2",
      data: { label: "Important Node 2" },
      position: { x: 300, y: 100 },
      type: "default",
    },
    {
      id: "other-1",
      data: { label: "Other Node 1" },
      position: { x: 500, y: 200 },
      type: "default",
    },
    {
      id: "other-2",
      data: { label: "Other Node 2" },
      position: { x: 100, y: 300 },
      type: "default",
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: "e1-2", source: "important-1", target: "important-2" },
    { id: "e2-3", source: "important-2", target: "other-1" },
    { id: "e1-4", source: "important-1", target: "other-2" },
  ]);

  const [maintainNodes, setMaintainNodes] = useState<string[] | undefined>(["important-1", "important-2"]);
  const [containerSize, setContainerSize] = useState({ width: "100%", height: "100%" });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const cycleMaintainMode = () => {
    setMaintainNodes((current) => {
      if (current === undefined) return ["important-1", "important-2"];
      if (current.length > 0) return [];
      return undefined;
    });
  };

  const getMaintainModeLabel = () => {
    if (maintainNodes === undefined) return "Disabled";
    if (maintainNodes.length > 0) return "Specific Nodes";
    return "All Nodes";
  };

  const resizeContainer = (size: "large" | "medium" | "small") => {
    switch (size) {
      case "small": {
        setContainerSize({ width: "400px", height: "300px" });
        break;
      }
      case "medium": {
        setContainerSize({ width: "600px", height: "400px" });
        break;
      }
      case "large": {
        setContainerSize({ width: "100%", height: "100%" });
        break;
      }
    }
  };

  return (
    <Column h="100%" gap={8}>
      <Column
        gap={8}
        p={20}
        style={{
          color: "var(--color-foreground)",
          backgroundColor: "var(--color-background-secondary)",
        }}
      >
        <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Maintain Nodes in View Demo</ApTypography>
        <ApTypography variant={FontVariantToken.fontSizeM}>
          Resize the container to see how important nodes stay in view
        </ApTypography>
        <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontStyle: "italic" }}>
          Note: The zoom level is preserved while panning to keep nodes visible
        </ApTypography>
        <Row gap={8} align="center">
          <ApButton label="Small" onClick={() => resizeContainer("small")} size="small" />
          <ApButton label="Medium" onClick={() => resizeContainer("medium")} size="small" />
          <ApButton label="Large" onClick={() => resizeContainer("large")} size="small" />
          <ApButton
            label={getMaintainModeLabel()}
            onClick={cycleMaintainMode}
            size="small"
            variant={maintainNodes !== undefined ? "primary" : "secondary"}
          />
        </Row>
        {maintainNodes !== undefined && (
          <ApTypography variant={FontVariantToken.fontSizeS}>
            {maintainNodes.length > 0
              ? `Maintaining nodes: ${maintainNodes.join(", ")}`
              : "Maintaining all nodes in view"}
          </ApTypography>
        )}
      </Column>

      <div
        style={{
          flex: 1,
          border: "2px solid var(--color-border)",
          transition: "all 0.3s ease",
          ...containerSize,
        }}
      >
        <ReactFlowProvider>
          <BaseCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            mode="view"
            maintainNodesInView={maintainNodes}
          >
            <CanvasPositionControls />
          </BaseCanvas>
        </ReactFlowProvider>
      </div>
    </Column>
  );
};

export const WithMaintainNodesInView: Story = {
  render: () => <BaseCanvasWithMaintainNodesInView />,
};
