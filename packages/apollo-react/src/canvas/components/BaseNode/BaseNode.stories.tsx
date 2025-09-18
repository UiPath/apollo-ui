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
      const executions = useMemo(() => ({ getExecutionState: (nodeId: string) => nodeId.split("-")[1] }), []);

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
      const [nodes, _setNodes, onNodesChange] = useNodesState([
        // Row 1: Default
        {
          id: "circle-NotExecuted",
          type: "generic",
          position: { x: 96, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Not executed",
              shape: "circle",
            },
          },
        },
        {
          id: "square-NotExecuted",
          type: "generic",
          position: { x: 288, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Not executed",
              shape: "square",
            },
          },
        },
        {
          id: "rect-NotExecuted",
          type: "generic",
          position: { x: 480, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Invoice approval agent",
              subLabel: "Not executed",
              shape: "rectangle",
            },
          },
        },

        // Row 2: InProgress
        {
          id: "circle-InProgress",
          type: "generic",
          position: { x: 96, y: 255 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "In progress",
              shape: "circle",
            },
          },
        },
        {
          id: "square-InProgress",
          type: "generic",
          position: { x: 288, y: 255 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "In progress",
              shape: "square",
            },
          },
        },
        {
          id: "rect-InProgress",
          type: "generic",
          position: { x: 480, y: 255 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Invoice approval agent",
              subLabel: "In progress",
              shape: "rectangle",
            },
          },
        },

        // Row 3: Completed
        {
          id: "circle-Completed",
          type: "generic",
          position: { x: 96, y: 416 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Completed",
              shape: "circle",
            },
          },
        },
        {
          id: "square-Completed",
          type: "generic",
          position: { x: 288, y: 416 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Completed",
              shape: "square",
            },
          },
        },
        {
          id: "rect-Completed",
          type: "generic",
          position: { x: 480, y: 416 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Invoice approval agent",
              subLabel: "Completed",
              shape: "rectangle",
            },
          },
        },

        // Row 4: Error
        {
          id: "circle-Failed",
          type: "generic",
          position: { x: 96, y: 576 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Failed",
              shape: "circle",
            },
          },
        },
        {
          id: "square-Failed",
          type: "generic",
          position: { x: 288, y: 576 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Failed",
              shape: "square",
            },
          },
        },
        {
          id: "rect-Failed",
          type: "generic",
          position: { x: 480, y: 576 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Invoice approval agent",
              subLabel: "Failed",
              shape: "rectangle",
            },
          },
        },

        // Row 5: Paused
        {
          id: "circle-Paused",
          type: "generic",
          position: { x: 96, y: 736 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Paused",
              shape: "circle",
            },
          },
        },
        {
          id: "square-Paused",
          type: "generic",
          position: { x: 288, y: 736 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Header",
              subLabel: "Paused",
              shape: "square",
            },
          },
        },
        {
          id: "rect-Paused",
          type: "generic",
          position: { x: 480, y: 736 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "Invoice approval agent",
              subLabel: "Paused",
              shape: "rectangle",
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
        // Square shapes - 16px grid sizes (48, 64, 80, 96, 112, 128)
        {
          id: "sq-48",
          type: "generic",
          width: 48,
          height: 48,
          position: { x: 96, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "48",
              shape: "square",
            },
          },
        },
        {
          id: "sq-64",
          type: "generic",
          width: 64,
          height: 64,
          position: { x: 176, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "64",
              shape: "square",
            },
          },
        },
        {
          id: "sq-80",
          type: "generic",
          width: 80,
          height: 80,
          position: { x: 272, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "80",
              shape: "square",
            },
          },
        },
        {
          id: "sq-96",
          type: "generic",
          width: 96,
          height: 96,
          position: { x: 384, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "96",
              shape: "square",
            },
          },
        },
        {
          id: "sq-112",
          type: "generic",
          width: 112,
          height: 112,
          position: { x: 512, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "112",
              shape: "square",
            },
          },
        },
        {
          id: "sq-128",
          type: "generic",
          width: 128,
          height: 128,
          position: { x: 656, y: 96 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "128",
              shape: "square",
            },
          },
        },

        // Circle shapes - same sizes
        {
          id: "c-48",
          type: "generic",
          width: 48,
          height: 48,
          position: { x: 96, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "48",
              shape: "circle",
            },
          },
        },
        {
          id: "c-64",
          type: "generic",
          width: 64,
          height: 64,
          position: { x: 176, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "64",
              shape: "circle",
            },
          },
        },
        {
          id: "c-80",
          type: "generic",
          width: 80,
          height: 80,
          position: { x: 272, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "80",
              shape: "circle",
            },
          },
        },
        {
          id: "c-96",
          type: "generic",
          width: 96,
          height: 96,
          position: { x: 384, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "96",
              shape: "circle",
            },
          },
        },
        {
          id: "c-112",
          type: "generic",
          width: 112,
          height: 112,
          position: { x: 512, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "112",
              shape: "circle",
            },
          },
        },
        {
          id: "c-128",
          type: "generic",
          width: 128,
          height: 128,
          position: { x: 656, y: 272 },
          data: {
            ...nodeTypeRegistry.createDefaultData("generic"),
            display: {
              label: "128",
              shape: "circle",
            },
          },
        },

        // Rectangle shapes - various aspect ratios aligned to 16px grid
        {
          id: "r-small",
          type: "agent",
          width: 128,
          height: 48,
          position: { x: 96, y: 448 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "128×48",
              shape: "rectangle",
            },
          },
        },
        {
          id: "r-medium",
          type: "agent",
          width: 160,
          height: 64,
          position: { x: 256, y: 448 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "160×64",
              shape: "rectangle",
            },
          },
        },
        {
          id: "r-large",
          type: "agent",
          width: 192,
          height: 80,
          position: { x: 448, y: 448 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "192×80",
              shape: "rectangle",
            },
          },
        },
        {
          id: "r-wide",
          type: "agent",
          width: 256,
          height: 96,
          position: { x: 96, y: 560 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "256×96",
              shape: "rectangle",
            },
          },
        },
        {
          id: "r-extra-wide",
          type: "agent",
          width: 320,
          height: 112,
          position: { x: 384, y: 560 },
          data: {
            ...nodeTypeRegistry.createDefaultData("agent"),
            display: {
              label: "320×112",
              shape: "rectangle",
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
