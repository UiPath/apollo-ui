import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo } from "react";
import type { Connection, NodeTypes } from "@xyflow/react";
import { Panel, ReactFlowProvider, useNodesState, useEdgesState, addEdge, Position } from "@xyflow/react";
import { NewBaseNode } from "./NewBaseNode";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import type { NewBaseNodeData, NewBaseNodeDisplayProps } from "./NewBaseNode.types";
import type { HandleActionEvent } from "../ButtonHandle";
import { Icons } from "@uipath/uix-core";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";

const meta = {
  title: "Canvas/NewBaseNode",
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
} satisfies Meta<NewBaseNodeData & NewBaseNodeDisplayProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeTypes: NodeTypes = {
  newBaseNode: NewBaseNode,
};

export const Default: Story = {
  render: () => {
    const DefaultComponent = () => {
      const [nodes, __setNodes, onNodesChange] = useNodesState([
        {
          id: "1",
          type: "newBaseNode",
          position: { x: 200, y: 200 },
          data: {
            display: { label: "http-request", shape: "square" as const },
          },
        },
        {
          id: "2",
          type: "newBaseNode",
          position: { x: 400, y: 200 },
          data: {
            display: { label: "script-task", shape: "square" as const },
          },
        },
        {
          id: "3",
          type: "newBaseNode",
          position: { x: 600, y: 200 },
          data: {
            display: { label: "rpa", shape: "square" as const },
          },
        },
        {
          id: "5",
          type: "newBaseNode",
          position: { x: 200, y: 400 },
          data: {
            display: { label: "agent", shape: "rectangle" as const },
          },
        },
        {
          id: "6",
          type: "newBaseNode",
          position: { x: 200, y: 600 },
          data: {},
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

      const enhancedNodes = useMemo(
        () =>
          nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              icon:
                node.id === "1" ? (
                  <ApIcon name="public" color="var(--color-foreground-de-emp)" size="40px" />
                ) : node.id === "2" ? (
                  <ApIcon name="code" color="var(--color-foreground-de-emp)" size="40px" />
                ) : node.id === "3" ? (
                  <ApIcon name="list_alt" color="var(--color-foreground-de-emp)" size="40px" />
                ) : node.id === "5" ? (
                  <div style={{ color: "var(--color-foreground-de-emp)" }}>
                    <Icons.AgentIcon />
                  </div>
                ) : undefined,
              // Add adornments
              adornments:
                node.id === "1"
                  ? {
                      bottomLeft: <ApTypography variant={FontVariantToken.fontMonoXS}>GET</ApTypography>,
                    }
                  : node.id === "2"
                    ? {
                        topRight: (
                          <div
                            style={{
                              fontSize: "10px",
                              padding: "2px 4px",
                              backgroundColor: "#3B82F6",
                              color: "white",
                              borderRadius: "3px",
                            }}
                          >
                            JAVASCRIPT
                          </div>
                        ),
                      }
                    : node.id === "3"
                      ? {
                          bottomLeft: (
                            <div
                              style={{
                                fontSize: "8px",
                                padding: "1px 2px",
                                backgroundColor: "#F97316",
                                color: "white",
                                borderRadius: "3px",
                              }}
                            >
                              UIPATH
                            </div>
                          ),
                        }
                      : undefined,
              handleConfigurations:
                node.id === "5"
                  ? [
                      {
                        position: Position.Left,
                        handles: [
                          {
                            id: "input",
                            type: "target",
                            handleType: "input",
                          },
                        ],
                      },
                      {
                        position: Position.Right,
                        handles: [
                          {
                            id: "output",
                            type: "source",
                            handleType: "output",
                          },
                        ],
                      },
                      {
                        position: Position.Top,
                        handles: [
                          {
                            id: "memory",
                            type: "source",
                            handleType: "artifact",
                            label: "Memory",
                          },
                          {
                            id: "context",
                            type: "source",
                            handleType: "artifact",
                            label: "Context",
                          },
                        ],
                      },
                      {
                        position: Position.Bottom,
                        handles: [
                          {
                            id: "model",
                            type: "source",
                            handleType: "artifact",
                            label: "Model",
                          },
                          {
                            id: "escalation",
                            type: "source",
                            handleType: "artifact",
                            label: "Escalations",
                          },
                          {
                            id: "tool",
                            type: "source",
                            handleType: "artifact",
                            label: "Tools",
                          },
                        ],
                      },
                    ]
                  : node.id !== "6"
                    ? [
                        // Other nodes: Simple handle configuration
                        {
                          position: Position.Left,
                          handles: [{ id: "input", type: "target", handleType: "input" }],
                        },
                        {
                          position: Position.Right,
                          handles: [{ id: "output", type: "source", handleType: "output" }],
                        },
                      ]
                    : undefined,
              onHandleAction: (event: HandleActionEvent) => {
                console.log("Handle action:", event);
              },
            } as NewBaseNodeData & NewBaseNodeDisplayProps,
          })) as any[],
        [nodes]
      );

      return (
        <BaseCanvas
          nodes={enhancedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
  render: () => {
    const CustomizedSizesComponent = () => {
      const [nodes, __setNodes, onNodesChange] = useNodesState([
        // Square shapes - various sizes
        {
          id: "sq2",
          type: "newBaseNode",
          width: 40,
          height: 40,
          position: { x: 100, y: 50 },
          data: {
            display: {
              label: "40x40",
              shape: "square" as const,
              background: "#fff3e0",
              iconBackground: "#f57c00",
              iconColor: "#ffffff",
            },
          },
        },
        {
          id: "sq3",
          type: "newBaseNode",
          width: 60,
          height: 60,
          position: { x: 170, y: 50 },
          data: {
            display: {
              label: "60x60",
              shape: "square" as const,
              background: "#f3e5f5",
              iconBackground: "#7b1fa2",
              iconColor: "#ffeb3b",
            },
          },
        },
        {
          id: "sq4",
          type: "newBaseNode",
          width: 80,
          height: 80,
          position: { x: 260, y: 50 },
          data: {
            display: {
              label: "80x80",
              shape: "square" as const,
              background: "#e8f5e9",
              iconBackground: "#388e3c",
              iconColor: "#ffffff",
            },
          },
        },
        {
          id: "sq5",
          type: "newBaseNode",
          width: 100,
          height: 100,
          position: { x: 370, y: 50 },
          data: {
            display: {
              label: "100x100",
              shape: "square" as const,
              background: "#fce4ec",
              iconBackground: "#c2185b",
              iconColor: "#ffe0b2",
            },
          },
        },
        {
          id: "sq6",
          type: "newBaseNode",
          width: 120,
          height: 120,
          position: { x: 500, y: 50 },
          data: {
            display: {
              label: "120x120",
              shape: "square" as const,
              background: "#e0f2f1",
              iconBackground: "#00695c",
              iconColor: "#b2dfdb",
            },
          },
        },
        {
          id: "sq7",
          type: "newBaseNode",
          width: 150,
          height: 150,
          position: { x: 650, y: 50 },
          data: {
            display: {
              label: "150x150",
              shape: "square" as const,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              iconBackground: "rgba(255, 255, 255, 0.9)",
              iconColor: "#764ba2",
            },
          },
        },

        // Circle shapes - various sizes
        {
          id: "c2",
          type: "newBaseNode",
          width: 40,
          height: 40,
          position: { x: 100, y: 250 },
          data: {
            display: {
              label: "40x40",
              shape: "circle" as const,
              background: "#e8eaf6",
              iconBackground: "#283593",
              iconColor: "#e3f2fd",
            },
          },
        },
        {
          id: "c3",
          type: "newBaseNode",
          width: 60,
          height: 60,
          position: { x: 170, y: 250 },
          data: {
            display: {
              label: "60x60",
              shape: "circle" as const,
              background: "#fff8e1",
              iconBackground: "#f57f17",
              iconColor: "#311b92",
            },
          },
        },
        {
          id: "c4",
          type: "newBaseNode",
          width: 80,
          height: 80,
          position: { x: 260, y: 250 },
          data: {
            display: {
              label: "80x80",
              shape: "circle" as const,
              background: "#e1f5fe",
              iconBackground: "#0277bd",
              iconColor: "#ffecb3",
            },
          },
        },
        {
          id: "c5",
          type: "newBaseNode",
          width: 100,
          height: 100,
          position: { x: 370, y: 250 },
          data: {
            display: {
              label: "100x100",
              shape: "circle" as const,
              background: "#f3e5f5",
              iconBackground: "#6a1b9a",
              iconColor: "#e1bee7",
            },
          },
        },
        {
          id: "c6",
          type: "newBaseNode",
          width: 120,
          height: 120,
          position: { x: 500, y: 250 },
          data: {
            display: {
              label: "120x120",
              shape: "circle" as const,
              background: "#efebe9",
              iconBackground: "#4e342e",
              iconColor: "#d7ccc8",
            },
          },
        },
        {
          id: "c7",
          type: "newBaseNode",
          width: 150,
          height: 150,
          position: { x: 650, y: 250 },
          data: {
            display: {
              label: "150x150",
              shape: "circle" as const,
              background: "radial-gradient(circle at center, #ff6b6b 0%, #ff4757 100%)",
              iconBackground: "rgba(255, 255, 255, 0.95)",
              iconColor: "#ff4757",
            },
          },
        },

        // Rectangle shapes - various sizes
        {
          id: "r1",
          type: "newBaseNode",
          width: 100,
          height: 40,
          position: { x: 50, y: 450 },
          data: {
            display: {
              label: "100x40",
              shape: "rectangle" as const,
              background: "#e8f5e9",
              iconBackground: "#2e7d32",
              iconColor: "#a5d6a7",
            },
          },
        },
        {
          id: "r2",
          type: "newBaseNode",
          width: 150,
          height: 60,
          position: { x: 180, y: 450 },
          data: {
            display: {
              label: "150x60",
              shape: "rectangle" as const,
              background: "#fff3e0",
              iconBackground: "#e65100",
              iconColor: "#fff176",
            },
          },
        },
        {
          id: "r3",
          type: "newBaseNode",
          width: 200,
          height: 80,
          position: { x: 360, y: 450 },
          data: {
            display: {
              label: "200x80",
              shape: "rectangle" as const,
              background: "#fce4ec",
              iconBackground: "#ad1457",
              iconColor: "#f8bbd0",
            },
          },
        },
        {
          id: "r4",
          type: "newBaseNode",
          width: 250,
          height: 100,
          position: { x: 50, y: 550 },
          data: {
            display: {
              label: "250x100",
              shape: "rectangle" as const,
              background: "#e0f7fa",
              iconBackground: "#00838f",
              iconColor: "#84ffff",
            },
          },
        },
        {
          id: "r5",
          type: "newBaseNode",
          width: 320,
          height: 120,
          position: { x: 330, y: 550 },
          data: {
            display: {
              label: "320x120",
              shape: "rectangle" as const,
              background: "#f3e5f5",
              iconBackground: "#4a148c",
              iconColor: "#ea80fc",
            },
          },
        },
        {
          id: "r6",
          type: "newBaseNode",
          width: 400,
          height: 150,
          position: { x: 50, y: 700 },
          data: {
            display: {
              label: "400x150",
              shape: "rectangle" as const,
              background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
              iconBackground: "rgba(255, 255, 255, 0.9)",
              iconColor: "#0091ea",
            },
          },
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

      const enhancedNodes = useMemo(
        () =>
          nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              icon:
                node.id === "sq2" || node.id === "sq7" || node.id === "c2" || node.id === "c7" ? (
                  // script-task nodes
                  <ApIcon name="code" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ) : node.id === "sq3" || node.id === "c3" ? (
                  // rpa nodes
                  <ApIcon name="list_alt" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ) : node.id === "sq4" || node.id === "c4" ? (
                  // connector nodes
                  <ApIcon name="code" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ) : node.id === "sq5" || node.id === "c5" ? (
                  // generic nodes
                  <ApIcon name="circle" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ) : node.id === "sq6" || node.id === "c6" ? (
                  // http-request nodes
                  <ApIcon name="public" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ) : node.id.startsWith("r") ? (
                  // agent nodes (rectangles)
                  <div style={{ color: node.data.display?.iconColor || "var(--color-foreground-de-emp)" }}>
                    <Icons.AgentIcon />
                  </div>
                ) : (
                  <ApIcon name="public" color={node.data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />
                ),
              // Add adornments
              adornments:
                node.id === "sq2" || node.id === "sq7" || node.id === "c2" || node.id === "c7"
                  ? {
                      topRight: (
                        <div
                          style={{
                            fontSize: "10px",
                            padding: "2px 4px",
                            backgroundColor: "#3B82F6",
                            color: "white",
                            borderRadius: "3px",
                          }}
                        >
                          JAVASCRIPT
                        </div>
                      ),
                    }
                  : node.id === "sq3" || node.id === "c3"
                    ? {
                        bottomLeft: (
                          <div
                            style={{
                              fontSize: "8px",
                              padding: "1px 2px",
                              backgroundColor: "#F97316",
                              color: "white",
                              borderRadius: "3px",
                            }}
                          >
                            UIPATH
                          </div>
                        ),
                      }
                    : node.id === "sq6" || node.id === "c6"
                      ? {
                          bottomLeft: <ApTypography variant={FontVariantToken.fontMonoXS}>GET</ApTypography>,
                        }
                      : undefined,
            } as NewBaseNodeData & NewBaseNodeDisplayProps,
          })) as any[],
        [nodes]
      );

      return (
        <BaseCanvas
          nodes={enhancedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          mode="design"
        >
          <Panel position="bottom-right">
            <CanvasPositionControls />
          </Panel>
        </BaseCanvas>
      );
    };
    return <CustomizedSizesComponent />;
  },
};
