import type { Meta, StoryObj } from "@storybook/react-vite";
import { FontVariantToken } from "@uipath/apollo-core";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { Column } from "@uipath/uix/core";
import type { Connection, Edge, EdgeChange, Node, NodeChange } from "@uipath/uix/xyflow/react";
import { addEdge, applyEdgeChanges, applyNodeChanges, Panel, Position, ReactFlowProvider, useReactFlow } from "@uipath/uix/xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { BaseCanvas } from "../BaseCanvas";
import type { BaseNodeData } from "../BaseNode";
import { BaseNode } from "../BaseNode";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import {
  agentContextNodeRegistration,
  agentEscalationNodeRegistration,
  agentMemoryNodeRegistration,
  agentModelNodeRegistration,
  agentNodeRegistration,
  agentToolNodeRegistration,
  baseNodeRegistration,
  connectorNodeRegistration,
  genericNodeRegistration,
  httpRequestNodeRegistration,
  rpaNodeRegistration,
  scriptNodeRegistration,
} from "../BaseNode/node-types";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import type { HandleActionEvent } from "../ButtonHandle";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { AddNodePanel } from "./";
import { AddNodeManager } from "./AddNodeManager";
import { AddNodePreview } from "./AddNodePreview";
import { createAddNodePreview } from "./createAddNodePreview";
import type { ListItem } from "../Toolbox";
import type { NodeItemData } from "./AddNodePanel.types";

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
      const executions = useMemo(() => ({ getExecutionState: () => "idle" }), []);

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
  argTypes: {
    items: { control: "object" },
  },
} satisfies Meta<typeof AddNodePanel>;

export default meta;
type Story = StoryObj<typeof AddNodePanel>;

// Mock node options for the demo
const AVAILABLE_NODE_OPTIONS: ListItem<NodeItemData>[] = [
  { id: "1", name: "Manual trigger", icon: { name: "touch_app" }, data: { type: "manual-trigger", category: "Triggers" } },
  { id: "2", name: "Schedule trigger", icon: { name: "schedule" }, data: { type: "schedule-trigger", category: "Triggers" } },
  { id: "3", name: "Webhook trigger", icon: { name: "webhook" }, data: { type: "webhook-trigger", category: "Triggers" } },
  {
    id: "4",
    name: "AI Agent",
    icon: { name: "smart_toy" },
    data: { type: "ai-agent", category: "AI" },
    description: "Autonomous AI assistant",
  },
  {
    id: "5",
    name: "OpenAI",
    icon: { name: "psychology" },
    data: { type: "openai", category: "AI" },
    description: "GPT models integration",
  },
  {
    id: "6",
    name: "Data extractor",
    icon: { name: "file_copy" },
    data: { type: "data-extractor", category: "Data" },
    description: "Extract data from documents",
  },
  {
    id: "7",
    name: "Sentiment Analyzer",
    icon: { name: "sentiment_satisfied" },
    data: { type: "sentiment-analyzer", category: "AI" },
    description: "Analyze text sentiment",
  },
  {
    id: "8",
    name: "Action",
    icon: { name: "settings" },
    data: { type: "action", category: "Actions" },
    description: "Generic action node",
  },
];

const AVAILABLE_NODE_CATEGORIES = AVAILABLE_NODE_OPTIONS.reduce<Record<string, ListItem<NodeItemData>[]>>((acc, node) => {
  if (node.data.category) {
    if (!acc[node.data.category]) {
      acc[node.data.category] = [];
    }
    acc[node.data.category]?.push(node);
  }
  return acc;
}, {});

const CATEGORY_LIST_ITEMS: ListItem<NodeItemData>[] = Object.entries(AVAILABLE_NODE_CATEGORIES).map(([category, nodes], index) => ({
  id: `category-${index}`,
  name: category,
  icon: nodes[0]?.icon,
  data: { type: "category", category },
  children: nodes,
}));

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
      filtered = filtered.filter((node) => node.data.category === category);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (node) => node.name.toLowerCase().includes(searchLower) || node.description?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, []);

  // Create node data from node option
  const createNodeData = useCallback((nodeOption: ListItem<NodeItemData>): BaseNodeData => {
    // Determine shape based on category
    let _shape: "circle" | "square" | "rectangle" = "square";
    if (nodeOption.data.category === "triggers") {
      _shape = "circle";
    } else if (nodeOption.data.category === "ai") {
      _shape = "rectangle";
    }

    // Create icon
    const icon =
      nodeOption.icon && typeof nodeOption.icon === "string" ? (
        <ApIcon size="32px" name={nodeOption.icon} color="var(--color-foreground-de-emp)" />
      ) : undefined;

    return {
      label: nodeOption.name,
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
    onNodeSelect: (node) => {
      console.log("Selected node:", node);
    },
    onClose: () => {
      console.log("Closed selector");
    },
    onSearch: undefined,
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
    onNodeSelect: (node) => {
      console.log("Selected node:", node);
      alert(`Selected: ${node.data.type}`);
    },
    onClose: () => {
      console.log("Closed selector");
    },
    onSearch: async (query: string, _currentItems) => {
      console.log("Searching for:", query);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 200));
      return AVAILABLE_NODE_OPTIONS.filter((node) => node.name.toLowerCase().includes(query.toLowerCase()));
    },
    items: CATEGORY_LIST_ITEMS,
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
    onNodeSelect: (node) => {
      console.log("Selected node from registry:", node);
      alert(`Selected: ${node.data.type} (${node.data.category})\n${node.data.description || ""}`);
    },
    onClose: () => {
      console.log("Closed selector");
    },
    onSearch: undefined,
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
