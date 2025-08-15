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
  agentNodeRegistration,
  connectorNodeRegistration,
  httpRequestNodeRegistration,
  rpaNodeRegistration,
  scriptNodeRegistration,
} from "./node-types";
import { NodeInspector } from "../NodeInspector";

const meta = {
  title: "Canvas/BaseNode2",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(
        () => [agentNodeRegistration, httpRequestNodeRegistration, scriptNodeRegistration, rpaNodeRegistration, connectorNodeRegistration],
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

export const Default: Story = {
  render: (args) => {
    const nodeTypeRegistry = useNodeTypeRegistry();
    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "http-request",
        position: { x: 200, y: 200 },
        data: nodeTypeRegistry.createDefaultData("http-request"),
      },
      {
        id: "2",
        type: "script-task",
        position: { x: 400, y: 200 },
        data: nodeTypeRegistry.createDefaultData("script-task"),
      },
      {
        id: "3",
        type: "rpa",
        position: { x: 600, y: 200 },
        data: nodeTypeRegistry.createDefaultData("rpa"),
      },
      {
        id: "5",
        type: "agent",
        position: { x: 200, y: 400 },
        data: nodeTypeRegistry.createDefaultData("agent"),
      },
      {
        id: "6",
        type: "doesnotexist",
        position: { x: 200, y: 600 },
        data: nodeTypeRegistry.createDefaultData("doesnotexist"),
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
