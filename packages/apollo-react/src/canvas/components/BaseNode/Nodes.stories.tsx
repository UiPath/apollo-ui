import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo } from "react";
import { Panel, ReactFlowProvider, useNodesState, useEdgesState, addEdge, Connection, NodeTypes } from "@xyflow/react";
import { BaseNode2 as BaseNode } from "./BaseNode2";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { BaseNodeData } from "./types";
import { ExecutionStatusContext } from "./ExecutionStatusContext";
import { NodeRegistryProvider, useNodeTypeRegistry } from "./NodeRegistryProvider";
import {
  agentContextNodeRegistration,
  agentEscalationNodeRegistration,
  agentMemoryNodeRegistration,
  agentModelNodeRegistration,
  agentToolNodeRegistration,
  agentNodeRegistration,
  connectorNodeRegistration,
  httpRequestNodeRegistration,
  rpaNodeRegistration,
  scriptNodeRegistration,
} from "./node-types";
import { NodeInspector } from "../NodeInspector";

const meta = {
  title: "Canvas/Nodes",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(
        () => [
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
} satisfies Meta<BaseNodeData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentNode: Story = {
  render: (args) => {
    const nodeTypeRegistry = useNodeTypeRegistry();
    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "agent",
        position: { x: 200, y: 250 },
        data: {
          ...nodeTypeRegistry.createDefaultData("agent"),
          display: {
            label: "Screener agent",
            subLabel: "Agent",
            shape: "rectangle",
          },
        },
      },
      {
        id: "2",
        type: "agent.context",
        position: { x: 300, y: 50 },
        data: nodeTypeRegistry.createDefaultData("agent.context"),
      },
      {
        id: "3",
        type: "agent.model",
        position: { x: 100, y: 500 },
        data: nodeTypeRegistry.createDefaultData("agent.model"),
      },
      {
        id: "4",
        type: "agent.escalation",
        position: { x: 300, y: 500 },
        data: nodeTypeRegistry.createDefaultData("agent.escalation"),
      },
      {
        id: "5",
        type: "agent.tool",
        position: { x: 500, y: 500 },
        data: nodeTypeRegistry.createDefaultData("agent.tool"),
      },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([
      {
        id: "e1",
        source: "1",
        sourceHandle: "context",
        target: "2",
        targetHandle: "context",
      },
      {
        id: "e2",
        source: "1",
        sourceHandle: "model",
        target: "3",
        targetHandle: "context",
      },
      {
        id: "e3",
        source: "1",
        sourceHandle: "escalations",
        target: "4",
        targetHandle: "context",
      },
      {
        id: "e4",
        source: "1",
        sourceHandle: "tools",
        target: "5",
        targetHandle: "context",
      },
    ]);

    const onConnect = useCallback((connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    }, []);

    const nodeTypes = useMemo(() => {
      return nodeTypeRegistry.getAllNodeTypes().reduce(
        (acc, nodeType) => {
          acc[nodeType] = BaseNode;
          return acc;
        },
        { default: BaseNode } as NodeTypes
      );
    }, [nodeTypeRegistry]);

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        mode="design"
      >
        <NodeInspector />
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};

export const ArtifactNode: Story = {
  render: (args) => {
    const nodeTypeRegistry = useNodeTypeRegistry();
    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "agent.model",
        position: { x: 300, y: 200 },
        data: nodeTypeRegistry.createDefaultData("agent.model"),
      },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback((connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    }, []);

    const nodeTypes = useMemo(() => {
      return nodeTypeRegistry.getAllNodeTypes().reduce(
        (acc, nodeType) => {
          acc[nodeType] = BaseNode;
          return acc;
        },
        { default: BaseNode } as NodeTypes
      );
    }, [nodeTypeRegistry]);

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        mode="design"
      >
        <NodeInspector />
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};

export const RpaNode: Story = {
  render: (args) => {
    const nodeTypeRegistry = useNodeTypeRegistry();
    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "rpa",
        position: { x: 300, y: 200 },
        data: nodeTypeRegistry.createDefaultData("rpa"),
      },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback((connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    }, []);

    const nodeTypes = useMemo(() => {
      return nodeTypeRegistry.getAllNodeTypes().reduce(
        (acc, nodeType) => {
          acc[nodeType] = BaseNode;
          return acc;
        },
        { default: BaseNode } as NodeTypes
      );
    }, [nodeTypeRegistry]);

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        mode="design"
      >
        <NodeInspector />
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};
