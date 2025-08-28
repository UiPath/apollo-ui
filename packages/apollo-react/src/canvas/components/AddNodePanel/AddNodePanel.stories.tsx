import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactFlowProvider, Position, applyNodeChanges, applyEdgeChanges, addEdge, Panel, useReactFlow } from "@xyflow/react";
import type { NodeChange, EdgeChange, Connection, Node, Edge } from "@xyflow/react";
import { useState, useCallback, useMemo } from "react";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";
import { BaseCanvas } from "../BaseCanvas";
import { BaseNode } from "../BaseNode";
import type { HandleActionEvent } from "../ButtonHandle";
import { AddNodePreview } from "./AddNodePreview";
import { AddNodeManager } from "./AddNodeManager";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { createAddNodePreview } from "./createAddNodePreview";
import type { BaseNodeData } from "../BaseNode";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import {
  baseNodeRegistration,
  genericNodeRegistration,
  agentNodeRegistration,
  httpRequestNodeRegistration,
  scriptNodeRegistration,
  rpaNodeRegistration,
  connectorNodeRegistration,
  agentContextNodeRegistration,
  agentEscalationNodeRegistration,
  agentMemoryNodeRegistration,
  agentModelNodeRegistration,
  agentToolNodeRegistration,
} from "../BaseNode/node-types";
import type { NodeOption } from "./AddNodePanel.types";
import { AddNodePanel } from "./";
import { Column } from "@uipath/uix-core";

const meta = {
  title: "Canvas/AddNodePanel",
  component: AddNodePanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story: any) => {
      const registrations = useMemo(
        () => [
          baseNodeRegistration,
          genericNodeRegistration,
          agentNodeRegistration,
          agentModelNodeRegistration,
          agentContextNodeRegistration,
          agentEscalationNodeRegistration,
          agentMemoryNodeRegistration,
          agentToolNodeRegistration,
          httpRequestNodeRegistration,
          scriptNodeRegistration,
          rpaNodeRegistration,
          connectorNodeRegistration,
        ],
        []
      );
      const executions = useMemo(() => ({ getExecutionStatus: () => "idle" }), []);

      return (
        <NodeRegistryProvider registrations={registrations}>
          <ExecutionStatusContext.Provider value={executions}>
            <div style={{ height: "100vh", width: "100%" }}>
              <ReactFlowProvider>
                <Story />
              </ReactFlowProvider>
            </div>
          </ExecutionStatusContext.Provider>
        </NodeRegistryProvider>
      );
    },
  ],
} satisfies Meta<typeof AddNodePanel>;

export default meta;
type Story = StoryObj<typeof AddNodePanel>;

// Mock node options for the demo
const AVAILABLE_NODE_OPTIONS: NodeOption[] = [
  { id: "1", type: "manual-trigger", label: "Manual trigger", icon: "touch_app", category: "triggers" },
  { id: "2", type: "schedule-trigger", label: "Schedule trigger", icon: "schedule", category: "triggers" },
  { id: "3", type: "webhook-trigger", label: "Webhook trigger", icon: "webhook", category: "triggers" },
  { id: "4", type: "ai-agent", label: "AI Agent", icon: "smart_toy", category: "ai", description: "Autonomous AI assistant" },
  { id: "5", type: "openai", label: "OpenAI", icon: "psychology", category: "ai", description: "GPT models integration" },
  {
    id: "6",
    type: "data-extractor",
    label: "Data extractor",
    icon: "file_copy",
    category: "data",
    description: "Extract data from documents",
  },
  {
    id: "7",
    type: "sentiment-analyzer",
    label: "Sentiment Analyzer",
    icon: "sentiment_satisfied",
    category: "ai",
    description: "Analyze text sentiment",
  },
  { id: "8", type: "action", label: "Action", icon: "settings", category: "actions", description: "Generic action node" },
];

// Main story using the simple preview node selection approach
const NodeAdditionStory = () => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>([
    {
      id: "trigger",
      position: { x: 100, y: 200 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="48px" name="touch_app" color="var(--color-foreground-de-emp)" />,
        label: "Manual trigger",
        handleConfigurations: [],
        parameters: {},
      },
    },
    {
      id: "action-1",
      position: { x: 350, y: 200 },
      type: "baseNode",
      data: {
        icon: <ApIcon size="32px" name="settings" color="var(--color-foreground-de-emp)" />,
        label: "Action",
        subLabel: "Process data",
        handleConfigurations: [],
        parameters: {},
      },
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    {
      id: "e-trigger-action-1",
      source: "trigger",
      target: "action-1",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ]);

  // Handle button click to create preview node
  const handleAddClick = useCallback(
    (event: HandleActionEvent) => {
      if (!reactFlowInstance) return;

      const { handleId, nodeId } = event;

      if (handleId && nodeId) {
        createAddNodePreview(nodeId, handleId, reactFlowInstance);
      }
    },
    [reactFlowInstance]
  );

  // Update node configurations to include button handles
  const nodesWithHandles = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        handleConfigurations: [
          {
            position: Position.Right,
            handles: [
              {
                id: "output",
                type: "source" as const,
                handleType: "output" as const,
                showButton: true,
                onAction: handleAddClick,
              },
            ],
          },
          {
            position: Position.Left,
            handles: [
              {
                id: "input",
                type: "target" as const,
                handleType: "input" as const,
              },
            ],
          },
        ],
      },
    }));
  }, [nodes, handleAddClick]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<BaseNodeData>[]),
    []
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const nodeTypes = useMemo(
    () => ({
      baseNode: BaseNode,
      preview: AddNodePreview,
    }),
    []
  );

  // Fetch node options (simulated API call)
  const fetchNodeOptions = useCallback(async (category?: string, search?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    let filtered = AVAILABLE_NODE_OPTIONS;
    if (category && category !== "all") {
      filtered = filtered.filter((node) => node.category === category);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (node) => node.label.toLowerCase().includes(searchLower) || node.description?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, []);

  // Create node data from node option
  const createNodeData = useCallback((nodeOption: NodeOption): BaseNodeData => {
    // Determine shape based on category
    let _shape: "circle" | "square" | "rectangle" = "square";
    if (nodeOption.category === "triggers") {
      _shape = "circle";
    } else if (nodeOption.category === "ai") {
      _shape = "rectangle";
    }

    // Create icon
    const icon =
      nodeOption.icon && typeof nodeOption.icon === "string" ? (
        <ApIcon size="32px" name={nodeOption.icon} color="var(--color-foreground-de-emp)" />
      ) : undefined;

    return {
      label: nodeOption.label,
      subLabel: nodeOption.description,
      icon,
      parameters: {},
    };
  }, []);

  const onNodeAdded = useCallback(
    (sourceNodeId: string, sourceHandleId: string, newNode: Node) => {
      console.log(`Added node ${newNode.id} connected from ${sourceNodeId}:${sourceHandleId}`);

      // Update the new node to have button handles for chaining
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === newNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  handleConfigurations: [
                    {
                      position: Position.Right,
                      handles: [
                        {
                          id: "output",
                          type: "source" as const,
                          handleType: "output" as const,
                          showButton: true,
                          onAction: handleAddClick,
                        },
                      ],
                    },
                    {
                      position: Position.Left,
                      handles: [
                        {
                          id: "input",
                          type: "target" as const,
                          handleType: "input" as const,
                        },
                      ],
                    },
                  ],
                },
              }
            : n
        )
      );
    },
    [handleAddClick]
  );

  return (
    <BaseCanvas
      nodes={nodesWithHandles}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      mode="design"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <AddNodeManager fetchNodeOptions={fetchNodeOptions} createNodeData={createNodeData} onNodeAdded={onNodeAdded} />

      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>

      <Panel position="top-left">
        <Column
          p={20}
          style={{
            color: "var(--color-foreground)",
            backgroundColor: "var(--color-background-secondary)",
            minWidth: 200,
          }}
        >
          <ApTypography variant={FontVariantToken.fontSizeH4Bold}>Node Addition via Selection</ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
            Click + button → Creates preview → Select preview → Choose node type
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeXs} color="var(--color-foreground-de-emp)" style={{ marginTop: "4px" }}>
            Clean architecture using React Flow's native selection mechanism
          </ApTypography>
        </Column>
      </Panel>
    </BaseCanvas>
  );
};

export const PreviewSelection: Story = {
  render: () => <NodeAdditionStory />,
};

// Standalone selector story for testing the component in isolation
export const StandaloneSelector: Story = {
  args: {
    onNodeSelect: (node: NodeOption) => {
      console.log("Selected node:", node);
    },
    onClose: () => {
      console.log("Closed selector");
    },
  },
  render: (args) => (
    <div
      style={{
        width: "320px",
        margin: "40px auto",
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-border-de-emp)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <AddNodePanel {...args} />
    </div>
  ),
};

// Isolated selector with custom fetch for testing
export const WithCustomFetch: Story = {
  args: {
    onNodeSelect: (node: NodeOption) => {
      console.log("Selected node:", node);
      alert(`Selected: ${node.label}`);
    },
    onClose: () => {
      console.log("Closed selector");
    },
  },
  render: (args) => (
    <div
      style={{
        width: "320px",
        margin: "40px auto",
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-border-de-emp)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <AddNodePanel {...args} />
    </div>
  ),
};

// Story demonstrating registry integration
export const WithRegistryIntegration: Story = {
  args: {
    onNodeSelect: (node: NodeOption) => {
      console.log("Selected node from registry:", node);
      alert(`Selected: ${node.label} (${node.type})\nCategory: ${node.category}\n${node.description || ""}`);
    },
    onClose: () => {
      console.log("Closed selector");
    },
  },
  render: (args) => (
    <div
      style={{
        width: "320px",
        margin: "40px auto",
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-border-de-emp)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Column p={20}>
        <ApTypography variant={FontVariantToken.fontSizeMBold}>Registry-Based Node Selector</ApTypography>
        <ApTypography variant={FontVariantToken.fontSizeXs} color="var(--color-foreground-de-emp)">
          AddNodePanel automatically uses the NodeRegistryProvider when available. It dynamically discovers categories and only shows those
          with registered nodes!
        </ApTypography>
      </Column>
      <AddNodePanel {...args} />
    </div>
  ),
};
