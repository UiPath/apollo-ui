import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback } from "react";
import { ReactFlowProvider, Node, Edge, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges, Panel, NodeTypes } from "@xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import { BaseCanvas } from "../BaseCanvas";
import { BaseNode } from "../BaseNode";
import { StageNode } from "../StageNode";
import { AgentNode } from "../AgentNode";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { Icons } from "@uipath/uix-core";

const meta: Meta<typeof NodePropertiesPanel> = {
  title: "Canvas/NodePropertiesPanel",
  component: NodePropertiesPanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div style={{ height: "100vh", width: "100vw" }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NodePropertiesPanel>;

const nodeTypes: NodeTypes = {
  stage: StageNode,
  agent: AgentNode,
  activity: BaseNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "activity",
    position: { x: 100, y: 100 },
    data: {
      icon: <ApIcon color="var(--color-foreground)" name="alt_route" size="48px" />,
      label: "Decision Point",
      subLabel: "Select this node to configure",
      description: "Approve or reject application",
    },
  },
  {
    id: "2",
    type: "agent",
    position: { x: 100, y: 300 },
    data: {
      label: "Review Agent",
      subLabel: "Reviews loan applications",
      icon: <Icons.AgentIcon w={48} h={48} />,
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 1024,
    },
  },
  {
    id: "3",
    type: "stage",
    position: { x: 500, y: 100 },
    data: {
      title: "Application",
      processes: [
        [
          { id: "1", label: "Process 1" },
          { id: "2", label: "Process 2" },
        ],
      ],
      name: "Application",
      description: "Process for new business loans",
      markAsException: false,
      slaLength: 45,
      slaUnit: "Days",
    },
  },
];

const initialEdges: Edge[] = [];

function PropertiesPanelExample() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  return (
    <BaseCanvas nodes={nodes} edges={edges} nodeTypes={nodeTypes} mode="design" onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}>
      <NodePropertiesPanel
        position="right"
        enableValidation={true}
        maintainSelection={true}
        onChange={(nodeId, field, value) => {
          console.log(`Node ${nodeId}: ${field} = ${value}`);
        }}
      />
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <PropertiesPanelExample />,
};
