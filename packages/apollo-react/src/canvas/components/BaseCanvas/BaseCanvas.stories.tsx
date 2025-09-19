import { useCallback, useRef, useState, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  applyEdgeChanges,
  applyNodeChanges,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  Position,
  addEdge,
} from "@uipath/uix/xyflow/react";
import type { Edge, EdgeChange, Node, NodeChange, Connection } from "@uipath/uix/xyflow/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { ApButton, ApTypography, ApIcon } from "@uipath/portal-shell-react";
import { Column, Row } from "@uipath/uix/core";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { BaseCanvas } from "./BaseCanvas";
import type { BaseCanvasRef } from "./BaseCanvas.types";
import { BaseNode } from "../BaseNode/BaseNode";
import type { BaseNodeData } from "../BaseNode/BaseNode.types";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { useNodeTypeRegistry } from "../BaseNode/useNodeTypeRegistry";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import {
  activityNodeRegistration,
  baseNodeRegistration,
  genericNodeRegistration,
  agentNodeRegistration,
  httpRequestNodeRegistration,
  scriptNodeRegistration,
  rpaNodeRegistration,
  connectorNodeRegistration,
} from "../BaseNode/node-types";

const meta = {
  title: "Canvas/BaseCanvas",
  decorators: [
    (Story: any) => {
      const registrations = useMemo(
        () => [
          activityNodeRegistration,
          baseNodeRegistration,
          genericNodeRegistration,
          agentNodeRegistration,
          httpRequestNodeRegistration,
          scriptNodeRegistration,
          rpaNodeRegistration,
          connectorNodeRegistration,
        ],
        []
      );
      const executions = useMemo(() => ({ getExecutionState: () => "idle" }), []);

      return (
        <NodeRegistryProvider registrations={registrations}>
          <ExecutionStatusContext.Provider value={executions}>
            <div style={{ height: "100vh", width: "100%" }}>
              <Story />
            </div>
          </ExecutionStatusContext.Provider>
        </NodeRegistryProvider>
      );
    },
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

    // Default edge configuration
    defaultEdgeOptions: {
      control: { type: "object" },
      description: "Default options for new edges including type",
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
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

const enhancedNodes: Node<BaseNodeData>[] = [
  {
    id: "source",
    position: { x: 50, y: 200 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="cloud_upload" color="var(--color-foreground-de-emp)" />,
      label: "Data Source",
      subLabel: "Input Stream",
      topRightAdornment: <ApIcon name="check_circle" size="small" style={{ color: "green" }} />,
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Right,
          handles: [{ id: "output", type: "source", handleType: "output", label: "Output" }],
        },
      ],
    },
  },
  {
    id: "processor1",
    position: { x: 300, y: 100 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="settings" color="var(--color-foreground-de-emp)" />,
      label: "Transform",
      subLabel: "Data Processing",
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
        },
        {
          position: Position.Right,
          handles: [{ id: "output", type: "source", handleType: "output", label: "Output" }],
        },
      ],
    },
  },
  {
    id: "processor2",
    position: { x: 300, y: 300 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="filter_list" color="var(--color-foreground-de-emp)" />,
      label: "Filter",
      subLabel: "Validation Rules",
      topRightAdornment: <ApIcon name="warning" size="16px" style={{ color: "orange" }} />,
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
        },
        {
          position: Position.Right,
          handles: [
            { id: "valid", type: "source", handleType: "output", label: "Valid" },
            { id: "invalid", type: "source", handleType: "output", label: "Invalid" },
          ],
        },
      ],
    },
  },
  {
    id: "merger",
    position: { x: 550, y: 200 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="merge_type" color="var(--color-foreground-de-emp)" />,
      label: "Merge",
      subLabel: "Combine Streams",
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [
            { id: "input1", type: "target", handleType: "input", label: "Stream 1" },
            { id: "input2", type: "target", handleType: "input", label: "Stream 2" },
          ],
        },
        {
          position: Position.Right,
          handles: [{ id: "output", type: "source", handleType: "output", label: "Merged" }],
        },
      ],
    },
  },
  {
    id: "output",
    position: { x: 800, y: 200 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="storage" color="var(--color-foreground-de-emp)" />,
      label: "Storage",
      subLabel: "Database",
      topRightAdornment: <ApIcon name="lock" size="small" color="var(--color-foreground-de-emp)" />,
      bottomLeftAdornment: <ApIcon name="schedule" size="small" color="var(--color-foreground-de-emp)" />,
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [{ id: "input", type: "target", handleType: "input", label: "Data In" }],
        },
        {
          position: Position.Right,
          handles: [{ id: "log", type: "source", handleType: "output", label: "Logs" }],
        },
      ],
    },
  },
  {
    id: "monitor",
    position: { x: 1050, y: 200 },
    type: "baseNode",
    data: {
      icon: <ApIcon size="48px" name="analytics" color="var(--color-foreground-de-emp)" />,
      label: "Monitor",
      subLabel: "Analytics",
      parameters: {},
      handleConfigurations: [
        {
          position: Position.Left,
          handles: [{ id: "input", type: "target", handleType: "input", label: "Events" }],
        },
      ],
    },
  },
];

const enhancedEdges: Edge[] = [
  {
    id: "e-source-p1",
    source: "source",
    sourceHandle: "output",
    target: "processor1",
    targetHandle: "input",
  },
  {
    id: "e-source-p2",
    source: "source",
    sourceHandle: "output",
    target: "processor2",
    targetHandle: "input",
  },
  {
    id: "e-p1-merger",
    source: "processor1",
    sourceHandle: "output",
    target: "merger",
    targetHandle: "input1",
  },
  {
    id: "e-p2-merger",
    source: "processor2",
    sourceHandle: "valid",
    target: "merger",
    targetHandle: "input2",
  },
  {
    id: "e-merger-output",
    source: "merger",
    sourceHandle: "output",
    target: "output",
    targetHandle: "input",
  },
  {
    id: "e-output-monitor",
    source: "output",
    sourceHandle: "log",
    target: "monitor",
    targetHandle: "input",
  },
];

const DefaultStory = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const [nodes, setNodes] = useState<Node[]>(enhancedNodes);
  const [edges, setEdges] = useState<Edge[]>(enhancedEdges);
  const [defaultEdgeType, setDefaultEdgeType] = useState<string>("default");
  const [animated, setAnimated] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      { default: BaseNode } as any
    );
  }, [nodeTypeRegistry]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<BaseNodeData>[]);
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  return (
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={{
          type: defaultEdgeType === "default" ? undefined : defaultEdgeType,
          animated,
          style: {
            strokeWidth,
          },
        }}
      >
        <Panel position="bottom-left">
          <Column
            gap={12}
            p={20}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
              minWidth: 280,
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Edge Configuration</ApTypography>

            <Column gap={8}>
              <ApTypography variant={FontVariantToken.fontSizeM}>Edge Type:</ApTypography>
              <select
                value={defaultEdgeType}
                onChange={(e) => setDefaultEdgeType(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-foreground)",
                  fontSize: "14px",
                }}
              >
                <option value="default">Default (Bezier)</option>
                <option value="straight">Straight</option>
                <option value="step">Step</option>
                <option value="smoothstep">Smooth Step</option>
                <option value="bezier">Bezier</option>
              </select>
            </Column>

            <Column gap={8}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} />
                Animated Edges
              </label>
            </Column>

            <Column gap={8}>
              <ApTypography variant={FontVariantToken.fontSizeM}>Stroke Width: {strokeWidth}px</ApTypography>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </Column>

            <ApTypography variant={FontVariantToken.fontSizeS} style={{ fontStyle: "italic" }}>
              Drag between handles to create new edges
            </ApTypography>

            <ApTypography variant={FontVariantToken.fontSizeXs}>
              Nodes: {nodes.length} | Edges: {edges.length}
            </ApTypography>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

// Different Background Styles
const DifferentBackgroundsStory = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const [backgroundType, setBackgroundType] = useState<BackgroundVariant>(BackgroundVariant.Lines);
  const [nodes] = useState<Node[]>(enhancedNodes);
  const [edges] = useState<Edge[]>(enhancedEdges);

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      { default: BaseNode } as any
    );
  }, [nodeTypeRegistry]);

  const getBackgroundProps = () => {
    switch (backgroundType) {
      case BackgroundVariant.Dots:
        return { gap: 20, size: 2 };
      case BackgroundVariant.Cross:
        return { gap: 20, size: 4 };
      case BackgroundVariant.Lines:
      default:
        return { gap: 20, size: 1 };
    }
  };

  const { gap, size } = getBackgroundProps();

  return (
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="view"
        backgroundVariant={backgroundType}
        backgroundGap={gap}
        backgroundSize={size}
      >
        <Panel position="top-left">
          <Column gap={8} p={16} style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)" }}>
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Background Styles</ApTypography>
            <Row gap={8}>
              <ApButton
                size="small"
                variant={backgroundType === BackgroundVariant.Dots ? "primary" : "secondary"}
                label="Dots"
                onClick={() => setBackgroundType(BackgroundVariant.Dots)}
              />
              <ApButton
                size="small"
                variant={backgroundType === BackgroundVariant.Lines ? "primary" : "secondary"}
                label="Lines"
                onClick={() => setBackgroundType(BackgroundVariant.Lines)}
              />
              <ApButton
                size="small"
                variant={backgroundType === BackgroundVariant.Cross ? "primary" : "secondary"}
                label="Cross"
                onClick={() => setBackgroundType(BackgroundVariant.Cross)}
              />
            </Row>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const DifferentBackgrounds: Story = {
  render: () => <DifferentBackgroundsStory />,
};

// Read-only Mode - no interactions allowed
const ReadOnlyModeStory = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      { default: BaseNode } as any
    );
  }, [nodeTypeRegistry]);

  return (
    <ReactFlowProvider>
      <BaseCanvas nodes={enhancedNodes} edges={enhancedEdges} nodeTypes={nodeTypes} mode="readonly">
        <Panel position="top-center">
          <Column
            p={12}
            style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)", borderRadius: 4 }}
          >
            <ApTypography variant={FontVariantToken.fontSizeM}>
              <ApIcon name="lock" size="small" /> Read-only Mode - Interactions Disabled
            </ApTypography>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const ReadOnlyMode: Story = {
  render: () => <ReadOnlyModeStory />,
};

// Empty Canvas with add node capability
const EmptyCanvasStory = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      { default: BaseNode } as any
    );
  }, [nodeTypeRegistry]);
  const [nodeCount, setNodeCount] = useState(0);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<BaseNodeData>[]);
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, []);

  const addNode = () => {
    const newNode: Node<BaseNodeData> = {
      id: `node-${nodeCount + 1}`,
      position: { x: 100 + (nodeCount % 3) * 200, y: 100 + Math.floor(nodeCount / 3) * 150 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="widgets" color="var(--color-foreground-de-emp)" />,
        label: `Node ${nodeCount + 1}`,
        subLabel: "Click to configure",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: "input", type: "target", handleType: "input", label: "In" }],
          },
          {
            position: Position.Right,
            handles: [{ id: "output", type: "source", handleType: "output", label: "Out" }],
          },
        ],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeCount((c) => c + 1);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setNodeCount(0);
  };

  return (
    <ReactFlowProvider>
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Panel position="top-left">
          <Column gap={8} p={16} style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)" }}>
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Canvas Actions</ApTypography>
            <ApButton label="Add Node" onClick={addNode} size="small" />
            <ApButton label="Clear Canvas" onClick={clearCanvas} size="small" variant="secondary" disabled={nodes.length === 0} />
            <ApTypography variant={FontVariantToken.fontSizeS}>
              Nodes: {nodes.length}, Edges: {edges.length}
            </ApTypography>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const EmptyCanvas: Story = {
  render: () => <EmptyCanvasStory />,
};

// With Custom Children/Overlays
const WithChildrenStory = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const [showOverlay, setShowOverlay] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      { default: BaseNode } as any
    );
  }, [nodeTypeRegistry]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  return (
    <ReactFlowProvider>
      <BaseCanvas nodes={enhancedNodes} edges={enhancedEdges} nodeTypes={nodeTypes} mode="view" onNodeClick={handleNodeClick}>
        {showOverlay && (
          <Panel position="top-right">
            <Column
              p={20}
              gap={12}
              style={{
                color: "var(--color-foreground)",
                backgroundColor: "var(--color-background-secondary)",
                minWidth: 200,
              }}
            >
              <Row justify="space-between" align="center">
                <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Node Inspector</ApTypography>
                <ApButton size="small" variant="text" onClick={() => setShowOverlay(false)}>
                  <ApIcon name="close" size="small" />
                </ApButton>
              </Row>

              {selectedNode ? (
                <Column gap={8}>
                  <ApTypography variant={FontVariantToken.fontSizeS}>Selected: {selectedNode}</ApTypography>
                  <ApButton size="small" label="View Details" onClick={() => alert(`Details for ${selectedNode}`)} />
                </Column>
              ) : (
                <ApTypography variant={FontVariantToken.fontSizeS}>Click a node to inspect</ApTypography>
              )}
            </Column>
          </Panel>
        )}

        {!showOverlay && (
          <Panel position="top-right">
            <ApButton size="small" onClick={() => setShowOverlay(true)}>
              <ApIcon name="info" />
            </ApButton>
          </Panel>
        )}

        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </ReactFlowProvider>
  );
};

export const WithChildren: Story = {
  render: () => <WithChildrenStory />,
};

// Component with ref control for demonstrating ensure nodes in view
const BaseCanvasWithNodeFocus = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();
  const canvasRef = useRef<BaseCanvasRef>(null);

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      {} as Record<string, typeof BaseNode>
    );
  }, [nodeTypeRegistry]);

  // Nodes spread across a larger area using BaseNode
  const spreadNodes: Node<BaseNodeData>[] = [
    {
      id: "1",
      position: { x: 100, y: 100 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="location_on" color="var(--color-foreground-de-emp)" />,
        label: "Node 1",
        subLabel: "Top Left",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "2",
      position: { x: 800, y: 100 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="location_on" color="var(--color-foreground-de-emp)" />,
        label: "Node 2",
        subLabel: "Top Right",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "3",
      position: { x: 100, y: 600 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="location_on" color="var(--color-foreground-de-emp)" />,
        label: "Node 3",
        subLabel: "Bottom Left",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "4",
      position: { x: 800, y: 600 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="location_on" color="var(--color-foreground-de-emp)" />,
        label: "Node 4",
        subLabel: "Bottom Right",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "5",
      position: { x: 450, y: 350 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="hub" color="var(--color-foreground-de-emp)" />,
        label: "Center Node",
        subLabel: "Hub",
        topRightAdornment: <ApIcon name="star" size="small" style={{ color: "gold" }} />,
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Top,
            handles: [
              { id: "in1", type: "target", handleType: "input" },
              { id: "in2", type: "target", handleType: "input" },
            ],
          },
          {
            position: Position.Bottom,
            handles: [
              { id: "in3", type: "target", handleType: "input" },
              { id: "in4", type: "target", handleType: "input" },
            ],
          },
        ],
      },
    },
  ];

  const edges: Edge[] = [
    { id: "e1-5", source: "1", sourceHandle: "out", target: "5", targetHandle: "in1" },
    { id: "e2-5", source: "2", sourceHandle: "out", target: "5", targetHandle: "in2" },
    { id: "e3-5", source: "3", sourceHandle: "out", target: "5", targetHandle: "in3" },
    { id: "e4-5", source: "4", sourceHandle: "out", target: "5", targetHandle: "in4" },
  ];

  return (
    <ReactFlowProvider>
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
        <BaseCanvas ref={canvasRef} nodes={spreadNodes} edges={edges} nodeTypes={nodeTypes} mode="view">
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
              <ApButton size="small" label="Focus Node 1" onClick={() => canvasRef.current?.ensureNodesInView(["1"])} />
              <ApButton size="small" label="Focus Node 2" onClick={() => canvasRef.current?.ensureNodesInView(["2"])} />
              <ApButton size="small" label="Focus Nodes 3 & 4" onClick={() => canvasRef.current?.ensureNodesInView(["3", "4"])} />
              <ApButton size="small" label="Center on Node 5" onClick={() => canvasRef.current?.centerNode("5")} />
              <ApButton size="small" variant="secondary" label="Show All Nodes" onClick={() => canvasRef.current?.ensureAllNodesInView()} />
              <ApButton
                size="small"
                variant="secondary"
                label="Focus 1 & 2 (Keep Zoom)"
                onClick={() => canvasRef.current?.ensureNodesInView(["1", "2"], { maintainZoom: true })}
              />
            </Column>
          </Panel>
          <Panel position="bottom-right">
            <CanvasPositionControls orientation="vertical" />
          </Panel>
        </BaseCanvas>
      </div>
    </ReactFlowProvider>
  );
};

export const WithNodeFocusControls: Story = {
  render: () => <BaseCanvasWithNodeFocus />,
};

// Example demonstrating maintain nodes in view on resize
const BaseCanvasWithMaintainNodesInView = () => {
  const nodeTypeRegistry = useNodeTypeRegistry();

  const nodeTypes = useMemo(() => {
    return nodeTypeRegistry.getAllNodeTypes().reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      {} as Record<string, typeof BaseNode>
    );
  }, [nodeTypeRegistry]);

  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>([
    {
      id: "important-1",
      position: { x: 100, y: 100 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="star" color="gold" />,
        label: "Important Node 1",
        subLabel: "Keep in view",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "important-2",
      position: { x: 300, y: 100 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="star" color="gold" />,
        label: "Important Node 2",
        subLabel: "Keep in view",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: "in", type: "target", handleType: "input" }],
          },
          {
            position: Position.Right,
            handles: [{ id: "out", type: "source", handleType: "output" }],
          },
        ],
      },
    },
    {
      id: "other-1",
      position: { x: 500, y: 200 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="widgets" color="var(--color-foreground-de-emp)" />,
        label: "Other Node 1",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Left,
            handles: [{ id: "in", type: "target", handleType: "input" }],
          },
        ],
      },
    },
    {
      id: "other-2",
      position: { x: 100, y: 300 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="widgets" color="var(--color-foreground-de-emp)" />,
        label: "Other Node 2",
        parameters: {},
        handleConfigurations: [
          {
            position: Position.Top,
            handles: [{ id: "in", type: "target", handleType: "input" }],
          },
        ],
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: "e1-2", source: "important-1", sourceHandle: "out", target: "important-2", targetHandle: "in" },
    { id: "e2-3", source: "important-2", sourceHandle: "out", target: "other-1", targetHandle: "in" },
    { id: "e1-4", source: "important-1", sourceHandle: "out", target: "other-2", targetHandle: "in" },
  ]);

  const [maintainNodes, setMaintainNodes] = useState<string[] | undefined>(["important-1", "important-2"]);
  const [containerSize, setContainerSize] = useState({ width: "100%", height: "100%" });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<BaseNodeData>[]),
    []
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

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
    <Column h="100%">
      <Column
        gap={8}
        p={20}
        style={{
          color: "var(--color-foreground)",
          backgroundColor: "var(--color-background-secondary)",
        }}
      >
        <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Maintain Nodes in View Demo</ApTypography>
        <ApTypography variant={FontVariantToken.fontSizeM}>Resize the container to see how important nodes stay in view</ApTypography>
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
            {maintainNodes.length > 0 ? `Maintaining nodes: ${maintainNodes.join(", ")}` : "Maintaining all nodes in view"}
          </ApTypography>
        )}
      </Column>

      <div
        style={{
          flex: 1,
          border: "1px solid var(--color-border)",
          transition: "all 0.3s ease",
          ...containerSize,
        }}
      >
        <ReactFlowProvider>
          <BaseCanvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            mode="view"
            maintainNodesInView={maintainNodes}
          >
            <Panel position="bottom-right">
              <CanvasPositionControls orientation="vertical" />
            </Panel>
          </BaseCanvas>
        </ReactFlowProvider>
      </div>
    </Column>
  );
};

export const WithMaintainNodesInView: Story = {
  render: () => <BaseCanvasWithMaintainNodesInView />,
};
