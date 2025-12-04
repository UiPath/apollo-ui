import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback, useMemo } from "react";
import type { Node, Edge, NodeChange, EdgeChange, NodeTypes, NodeProps } from "@uipath/uix/xyflow/react";
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges, Panel } from "@uipath/uix/xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import { BaseCanvas } from "../BaseCanvas";
import { BaseNode, useNodeTypeRegistry } from "../BaseNode";
import { StageNode } from "../StageNode";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { Column, Icons } from "@uipath/uix/core";
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
      const executions = useMemo(() => ({ getExecutionState: () => "idle" }), []);

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

const initialNodes: Node[] = [
  {
    id: "1",
    type: "activity",
    position: { x: 100, y: 100 },
    data: {
      icon: <ApIcon color="var(--uix-canvas-foreground)" name="alt_route" size="48px" />,
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
      parameters: {},
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
  const [isPinned, setIsPinned] = useState(false);
  const nodeTypeRegistry = useNodeTypeRegistry();

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  // Memoize the node type list separately to ensure stable dependencies
  const registeredNodeTypes = useMemo(() => nodeTypeRegistry.getAllNodeTypes(), [nodeTypeRegistry]);

  const nodeTypes = useMemo(() => {
    return registeredNodeTypes.reduce(
      (acc, nodeType) => {
        acc[nodeType] = BaseNode;
        return acc;
      },
      {
        stage: StageNodeWrapper,
        activity: BaseNode,
      } as NodeTypes
    );
  }, [registeredNodeTypes]);

  return (
    <BaseCanvas nodes={nodes} edges={edges} nodeTypes={nodeTypes} mode="design" onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}>
      <NodePropertiesPanel
        position="right"
        enableValidation={true}
        maintainSelection={true}
        defaultPinned={isPinned}
        onPinnedChange={setIsPinned}
        onChange={(nodeId, field, value) => {
          console.log(`Node ${nodeId}: ${field} = ${value}`);
        }}
      />
      <Panel position="top-left">
        <Column
          gap={12}
          p={10}
          style={{
            color: "var(--uix-canvas-foreground)",
            backgroundColor: "var(--uix-canvas-background)",
            border: "1px solid var(--uix-canvas-border-de-emp)",
            borderRadius: 8,
          }}
        >
          Click on nodes to open properties panel. Panel is {isPinned ? "pinned to the right" : "floating near node"}.
        </Column>
      </Panel>
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
    </BaseCanvas>
  );
}

export const Default: Story = {
  render: () => <PropertiesPanelExample />,
};
