import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Node } from "@uipath/uix/xyflow/react";
import { Panel, Position, useReactFlow } from "@uipath/uix/xyflow/react";
import { useMemo } from "react";
import { BaseCanvas } from "../BaseCanvas";
import type { BaseNodeData } from "../BaseNode";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { AddNodePanel } from ".";
import { AddNodeManager } from "./AddNodeManager";
import { createAddNodePreview } from "./createAddNodePreview";
import type { ListItem } from "../Toolbox";
import type { NodeItemData } from "./AddNodePanel.types";
import { withCanvasProviders, useCanvasStory, createNode, NodePositions, StoryInfoPanel } from "../../storybook-utils";
import { useCanvasEvent } from "../../hooks";
import type { CanvasHandleActionEvent } from "../../utils";

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof AddNodePanel> = {
  title: "Canvas/AddNodePanel",
  component: AddNodePanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withCanvasProviders()],
  argTypes: {
    items: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof AddNodePanel>;

// ============================================================================
// Shared
// ============================================================================

const NODE_OPTIONS: ListItem<NodeItemData>[] = [
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

const CATEGORY_ITEMS: ListItem<NodeItemData>[] = Object.entries(
  NODE_OPTIONS.reduce<Record<string, ListItem<NodeItemData>[]>>((acc, node) => {
    const category = node.data.category;
    if (category) {
      acc[category] = acc[category] || [];
      acc[category].push(node);
    }
    return acc;
  }, {})
).map(([category, nodes], index) => ({
  id: `category-${index}`,
  name: category,
  icon: nodes[0]?.icon,
  data: { type: "category", category },
  children: nodes,
}));

function createInitialNodes(): Node<BaseNodeData>[] {
  return [
    createNode({
      id: "trigger",
      type: "uipath.manual-trigger",
      position: NodePositions.row2col1,
      display: { label: "Manual trigger" },
    }),
    createNode({
      id: "action-1",
      type: "uipath.blank-node",
      position: NodePositions.row2col2,
      display: { label: "Action", subLabel: "Process data" },
    }),
  ];
}

/**
 * Standalone panel wrapper component.
 */
function StandalonePanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "320px",
        margin: "40px auto",
        backgroundColor: "var(--uix-canvas-background)",
        border: "1px solid var(--uix-canvas-border-de-emp)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Story Components
// ============================================================================

/**
 * Main preview selection story demonstrating node addition workflow.
 */
function PreviewSelectionStory() {
  const initialNodes = useMemo(() => createInitialNodes(), []);
  const { canvasProps } = useCanvasStory({
    initialNodes,
    initialEdges: [{ id: "e-trigger-action-1", source: "trigger", target: "action-1", sourceHandle: "output", targetHandle: "input" }],
  });

  const reactFlowInstance = useReactFlow();
  useCanvasEvent("handle:action", (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === "input" ? "target" : "source";
      createAddNodePreview(nodeId, handleId, reactFlowInstance, position as Position, sourceHandleType);
    }
  });

  return (
    <BaseCanvas {...canvasProps} deleteKeyCode={["Backspace", "Delete"]} mode="design" defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
      <AddNodeManager />
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
      <StoryInfoPanel
        title="Add node with preview selection"
        description="Click + button → Creates preview → Select preview → Choose node type"
      />
    </BaseCanvas>
  );
}

/**
 * Story demonstrating source handles on all four sides.
 */
function AllSidesStory() {
  const initialNodes = useMemo(
    () => [
      createNode({
        id: "center",
        type: "uipath.blank-node",
        position: NodePositions.row2col2,
        display: { label: "Hub Node", subLabel: "Handles on all sides" },
        handleConfigurations: [
          { position: Position.Right, handles: [{ id: "output-right", type: "source", handleType: "output" }] },
          { position: Position.Left, handles: [{ id: "output-left", type: "source", handleType: "output" }] },
          { position: Position.Top, handles: [{ id: "output-top", type: "source", handleType: "output" }] },
          { position: Position.Bottom, handles: [{ id: "output-bottom", type: "source", handleType: "output" }] },
        ],
      }),
    ],
    []
  );
  const { canvasProps } = useCanvasStory({ initialNodes });

  const reactFlowInstance = useReactFlow();
  useCanvasEvent("handle:action", (event: CanvasHandleActionEvent) => {
    if (!reactFlowInstance) return;

    const { handleId, nodeId, position, handleType } = event;
    if (handleId && nodeId) {
      const sourceHandleType = handleType === "input" ? "target" : "source";
      createAddNodePreview(nodeId, handleId, reactFlowInstance, position as Position, sourceHandleType);
    }
  });

  return (
    <BaseCanvas {...canvasProps} mode="design" defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
      <AddNodeManager />
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
      <StoryInfoPanel title="Source handles on all sides" description="Single node with output handles on Top, Bottom, Left, and Right." />
    </BaseCanvas>
  );
}

// ============================================================================
// Exported Stories
// ============================================================================

export const PreviewSelection: Story = {
  name: "Add node with preview selection",
  render: () => <PreviewSelectionStory />,
};

export const HandlesOnAllSides: Story = {
  name: "Add node on all sides",
  render: () => <AllSidesStory />,
};

export const NodePanelStaticItems: Story = {
  name: "Add node panel with static items",
  args: {
    items: CATEGORY_ITEMS,
    onNodeSelect: (node) => console.log("Selected node:", node),
    onClose: () => console.log("Closed selector"),
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};

export const NodePanelWithCustomSearch: Story = {
  name: "Add node panel with custom search",
  args: {
    items: CATEGORY_ITEMS,
    onNodeSelect: (node) => {
      console.log("Selected node:", node);
      alert(`Selected: ${node.data.type}`);
    },
    onClose: () => console.log("Closed selector"),
    onSearch: async (query: string) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));
      return NODE_OPTIONS.filter((node) => node.name.toLowerCase().includes(query.toLowerCase()));
    },
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};

export const NodePanelRegistryItems: Story = {
  name: "Add node panel using registry",
  args: {
    onNodeSelect: (node) => {
      console.log("Selected node from registry:", node);
      alert(`Selected: ${node.data.type} (${node.data.category})`);
    },
    onClose: () => console.log("Closed selector"),
  },
  render: (args) => (
    <StandalonePanelWrapper>
      <AddNodePanel {...args} />
    </StandalonePanelWrapper>
  ),
};
