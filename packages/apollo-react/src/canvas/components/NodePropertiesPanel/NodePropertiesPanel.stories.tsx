import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback, useMemo } from "react";
import type { Node, Edge, NodeChange, EdgeChange, NodeTypes, NodeProps } from "@xyflow/react";
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges, Panel } from "@xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import { BaseCanvas } from "../BaseCanvas";
import { BaseNode } from "../BaseNode";
import { StageNode } from "../StageNode";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { Icons } from "@uipath/uix-core";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
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

const meta: Meta<typeof NodePropertiesPanel> = {
  title: "Canvas/NodePropertiesPanel",
  component: NodePropertiesPanel,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
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
      const executions = useMemo(() => ({ getExecutionStatus: () => "idle" }), []);

      return (
        <NodeRegistryProvider registrations={registrations}>
          <ExecutionStatusContext.Provider value={executions}>
            <ReactFlowProvider>
              <div style={{ height: "100vh", width: "100vw" }}>
                <Story />
              </div>
            </ReactFlowProvider>
          </ExecutionStatusContext.Provider>
        </NodeRegistryProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof NodePropertiesPanel>;

// Wrapper component to adapt React Flow node props to StageNode props
const StageNodeWrapper = (props: NodeProps) => {
  const data = props.data as any;
  return (
    <StageNode
      {...props}
      stageDetails={{
        label: data?.title || "Stage",
        tasks: data?.processes || [],
        isException: data?.markAsException || false,
        sla: data?.slaLength && data?.slaUnit ? `${data.slaLength} ${data.slaUnit}` : undefined,
      }}
    />
  );
};

const nodeTypes: NodeTypes = {
  stage: StageNodeWrapper,
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
