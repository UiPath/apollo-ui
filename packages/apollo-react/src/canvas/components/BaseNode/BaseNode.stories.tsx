import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo } from "react";
import type { Connection, NodeTypes } from "@xyflow/react";
import { Panel, ReactFlowProvider, useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import type { BaseNodeData } from "./BaseNode.types";
import { ExecutionStatusContext } from "./ExecutionStatusContext";
import { NodeRegistryProvider } from "./NodeRegistryProvider";
import { useNodeTypeRegistry } from "./useNodeTypeRegistry";
import {
  genericNodeRegistration,
  agentNodeRegistration,
  connectorNodeRegistration,
  httpRequestNodeRegistration,
  rpaNodeRegistration,
  scriptNodeRegistration,
} from "./node-types";
import { NodeInspector } from "../NodeInspector";

const meta = {
  title: "Canvas/BaseNode",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(
        () => [
          agentNodeRegistration,
          httpRequestNodeRegistration,
          scriptNodeRegistration,
          rpaNodeRegistration,
          connectorNodeRegistration,
          genericNodeRegistration,
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

export const Default: Story = {
  render: (__args) => {
    const DefaultComponent = () => {
      const nodeTypeRegistry = useNodeTypeRegistry();
      const [nodes, __setNodes, onNodesChange] = useNodesState([
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

      const onConnect = useCallback(
        (connection: Connection) => {
          setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges]
      );

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
    };

    return <DefaultComponent />;
  },
};

export const CustomizedSizes: Story = {
  render: (__args) => {
    const CustomizedSizesComponent = () => {
      const nodeTypeRegistry = useNodeTypeRegistry();
      const [nodes, __setNodes, onNodesChange] = useNodesState([
        // Square shapes - various sizes
        {
          id: "sq2",
          type: "script-task",
          width: 40,
          height: 40,
          position: { x: 100, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("script-task"),
            display: {
              label: "40x40",
              shape: "square",
              background: "#fff3e0",
              iconBackground: "#f57c00",
              iconColor: "#ffffff",
            },
          },
        },
        {
          id: "sq3",
          type: "rpa",
          width: 60,
          height: 60,
          position: { x: 170, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("rpa"),
            display: {
              label: "60x60",
              shape: "square",
              background: "#f3e5f5",
              iconBackground: "#7b1fa2",
              iconColor: "#ffeb3b",
            },
          },
        },
        {
          id: "sq4",
          type: "connector",
          width: 80,
          height: 80,
          position: { x: 260, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("connector"),
            display: {
              label: "80x80",
              shape: "square",
              background: "#e8f5e9",
              iconBackground: "#388e3c",
              iconColor: "#ffffff",
            },
          },
        },
        {
          id: "sq5",
          type: "generic",
          width: 100,
          height: 100,
          position: { x: 370, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "100x100",
              shape: "square",
              background: "#fce4ec",
              iconBackground: "#c2185b",
              iconColor: "#ffe0b2",
            },
          },
        },
        {
          id: "sq6",
          type: "http-request",
          width: 120,
          height: 120,
          position: { x: 500, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("http-request"),
            display: {
              label: "120x120",
              shape: "square",
              background: "#e0f2f1",
              iconBackground: "#00695c",
              iconColor: "#b2dfdb",
            },
          },
        },
        {
          id: "sq7",
          type: "script-task",
          width: 150,
          height: 150,
          position: { x: 650, y: 50 },
          data: {
            ...nodeTypeRegistry.createDefaultData("script-task"),
            display: {
              label: "150x150",
              shape: "square",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              iconBackground: "rgba(255, 255, 255, 0.9)",
              iconColor: "#764ba2",
            },
          },
        },

        // Circle shapes - various sizes
        {
          id: "c2",
          type: "script-task",
          width: 40,
          height: 40,
          position: { x: 100, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("script-task"),
            display: {
              label: "40x40",
              shape: "circle",
              background: "#e8eaf6",
              iconBackground: "#283593",
              iconColor: "#e3f2fd",
            },
          },
        },
        {
          id: "c3",
          type: "rpa",
          width: 60,
          height: 60,
          position: { x: 170, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("rpa"),
            display: {
              label: "60x60",
              shape: "circle",
              background: "#fff8e1",
              iconBackground: "#f57f17",
              iconColor: "#311b92",
            },
          },
        },
        {
          id: "c4",
          type: "connector",
          width: 80,
          height: 80,
          position: { x: 260, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("connector"),
            display: {
              label: "80x80",
              shape: "circle",
              background: "#e1f5fe",
              iconBackground: "#0277bd",
              iconColor: "#ffecb3",
            },
          },
        },
        {
          id: "c5",
          type: "generic",
          width: 100,
          height: 100,
          position: { x: 370, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "100x100",
              shape: "circle",
              background: "#f3e5f5",
              iconBackground: "#6a1b9a",
              iconColor: "#e1bee7",
            },
          },
        },
        {
          id: "c6",
          type: "http-request",
          width: 120,
          height: 120,
          position: { x: 500, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("http-request"),
            display: {
              label: "120x120",
              shape: "circle",
              background: "#efebe9",
              iconBackground: "#4e342e",
              iconColor: "#d7ccc8",
            },
          },
        },
        {
          id: "c7",
          type: "script-task",
          width: 150,
          height: 150,
          position: { x: 650, y: 250 },
          data: {
            ...nodeTypeRegistry.createDefaultData("script-task"),
            display: {
              label: "150x150",
              shape: "circle",
              background: "radial-gradient(circle at center, #ff6b6b 0%, #ff4757 100%)",
              iconBackground: "rgba(255, 255, 255, 0.95)",
              iconColor: "#ff4757",
            },
          },
        },

        // Rectangle shapes - various sizes
        {
          id: "r1",
          type: "agent",
          width: 100,
          height: 40,
          position: { x: 50, y: 450 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "100x40",
              shape: "rectangle",
              background: "#e8f5e9",
              iconBackground: "#2e7d32",
              iconColor: "#a5d6a7",
            },
          },
        },
        {
          id: "r2",
          type: "agent",
          width: 150,
          height: 60,
          position: { x: 180, y: 450 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "150x60",
              shape: "rectangle",
              background: "#fff3e0",
              iconBackground: "#e65100",
              iconColor: "#fff176",
            },
          },
        },
        {
          id: "r3",
          type: "agent",
          width: 200,
          height: 80,
          position: { x: 360, y: 450 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "200x80",
              shape: "rectangle",
              background: "#fce4ec",
              iconBackground: "#ad1457",
              iconColor: "#f8bbd0",
            },
          },
        },
        {
          id: "r4",
          type: "agent",
          width: 250,
          height: 100,
          position: { x: 50, y: 550 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "250x100",
              shape: "rectangle",
              background: "#e0f7fa",
              iconBackground: "#00838f",
              iconColor: "#84ffff",
            },
          },
        },
        {
          id: "r5",
          type: "agent",
          width: 320,
          height: 120,
          position: { x: 330, y: 550 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "320x120",
              shape: "rectangle",
              background: "#f3e5f5",
              iconBackground: "#4a148c",
              iconColor: "#ea80fc",
            },
          },
        },
        {
          id: "r6",
          type: "agent",
          width: 400,
          height: 150,
          position: { x: 50, y: 700 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "400x150",
              shape: "rectangle",
              background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
              iconBackground: "rgba(255, 255, 255, 0.9)",
              iconColor: "#0091ea",
            },
          },
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      const onConnect = useCallback(
        (connection: Connection) => {
          setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges]
      );

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
    };

    return <CustomizedSizesComponent />;
  },
};
