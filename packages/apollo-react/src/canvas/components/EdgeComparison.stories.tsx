import React, { useCallback, useEffect, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, Panel, Position, MarkerType } from "@xyflow/react";
import { BaseCanvas } from "./BaseCanvas";
import { CanvasPositionControls } from "./CanvasPositionControls";
import { BaseNode } from "./BaseNode";
import { ApCheckbox, ApDropdown, ApDropdownItem, ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";
import { Column } from "@uipath/uix-core";
import { NodeRegistryProvider } from "./BaseNode/NodeRegistryProvider";
import { useNodeTypeRegistry } from "./BaseNode/useNodeTypeRegistry";
import { ExecutionStatusContext } from "./BaseNode/ExecutionStatusContext";
import {
  baseNodeRegistration,
  genericNodeRegistration,
  agentNodeRegistration,
  httpRequestNodeRegistration,
  scriptNodeRegistration,
  rpaNodeRegistration,
  connectorNodeRegistration,
} from "./BaseNode/node-types";

const meta = {
  title: "Canvas/Edges/XyFlowEdgeComparison",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(
        () => [
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
            <div style={{ width: "100vw", height: "100vh" }}>
              <ReactFlowProvider>
                <Story />
              </ReactFlowProvider>
            </div>
          </ExecutionStatusContext.Provider>
        </NodeRegistryProvider>
      );
    },
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllEdgeTypes: Story = {
  name: "All Edge Types",
  render: () => {
    const AllEdgeTypesStory = () => {
      const nodeTypeRegistry = useNodeTypeRegistry();
      const nodeTypes = useMemo(() => {
        return nodeTypeRegistry.getAllNodeTypes().reduce(
          (acc, nodeType) => {
            acc[nodeType] = BaseNode;
            return acc;
          },
          {} as Record<string, typeof BaseNode>
        );
      }, [nodeTypeRegistry]);
      // Create a grid of nodes to demonstrate different edge types
      // Better spacing with consistent gaps
      const nodeWidth = 350; // Horizontal gap between source and target
      const nodeHeight = 200; // Vertical gap between rows
      const columnGap = 500; // Gap between columns
      const startX = 400;
      const startY = 100;

      // Stagger amounts for Y position to make edges more interesting
      const yOffsets = [30, 0, 50, 45, 45] as [number, number, number, number, number];

      const initialNodes: Node[] = [
        // Default edge nodes
        {
          id: "default-1",
          type: "baseNode",
          position: { x: startX, y: startY },
          data: {
            label: "Default",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "default-2",
          type: "baseNode",
          position: { x: startX + nodeWidth, y: startY + yOffsets[0] },
          data: {
            label: "Default",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Straight edge nodes
        {
          id: "straight-1",
          type: "baseNode",
          position: { x: startX, y: startY + nodeHeight },
          data: {
            label: "Straight",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "straight-2",
          type: "baseNode",
          position: { x: startX + nodeWidth, y: startY + nodeHeight + yOffsets[1] },
          data: {
            label: "Straight",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Step edge nodes
        {
          id: "step-1",
          type: "baseNode",
          position: { x: startX, y: startY + nodeHeight * 2 },
          data: {
            label: "Step",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "step-2",
          type: "baseNode",
          position: { x: startX + nodeWidth, y: startY + nodeHeight * 2 + yOffsets[2] },
          data: {
            label: "Step",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Smooth Step edge nodes
        {
          id: "smoothstep-1",
          type: "baseNode",
          position: { x: startX, y: startY + nodeHeight * 3 },
          data: {
            label: "Smooth Step",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "smoothstep-2",
          type: "baseNode",
          position: { x: startX + nodeWidth, y: startY + nodeHeight * 3 + yOffsets[3] },
          data: {
            label: "Smooth Step",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Bezier edge nodes
        {
          id: "bezier-1",
          type: "baseNode",
          position: { x: startX, y: startY + nodeHeight * 4 },
          data: {
            label: "Bezier",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "bezier-2",
          type: "baseNode",
          position: { x: startX + nodeWidth, y: startY + nodeHeight * 4 + yOffsets[4] },
          data: {
            label: "Bezier",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Second column - Animated edge nodes
        {
          id: "animated-1",
          type: "baseNode",
          position: { x: startX + columnGap, y: startY },
          data: {
            label: "Animated",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "animated-2",
          type: "baseNode",
          position: { x: startX + columnGap + nodeWidth, y: startY - yOffsets[0] },
          data: {
            label: "Animated",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Styled edge nodes (demonstrating various styling options)
        {
          id: "styled-1",
          type: "baseNode",
          position: { x: startX + columnGap, y: startY + nodeHeight },
          data: {
            label: "Styled",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "styled-2",
          type: "baseNode",
          position: { x: startX + columnGap + nodeWidth, y: startY + nodeHeight - yOffsets[1] },
          data: {
            label: "Styled",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Labeled edge nodes
        {
          id: "labeled-1",
          type: "baseNode",
          position: { x: startX + columnGap, y: startY + nodeHeight * 2 },
          data: {
            label: "Labeled",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "labeled-2",
          type: "baseNode",
          position: { x: startX + columnGap + nodeWidth, y: startY + nodeHeight * 2 - yOffsets[2] },
          data: {
            label: "Labeled",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Marker demonstration nodes
        {
          id: "marker-1",
          type: "baseNode",
          position: { x: startX + columnGap, y: startY + nodeHeight * 3 },
          data: {
            label: "Markers",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "marker-2",
          type: "baseNode",
          position: { x: startX + columnGap + nodeWidth, y: startY + nodeHeight * 3 - yOffsets[3] },
          data: {
            label: "Markers",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },

        // Complex path nodes (multiple edges between same nodes)
        {
          id: "complex-1",
          type: "baseNode",
          position: { x: startX + columnGap, y: startY + nodeHeight * 4 },
          data: {
            label: "Complex",
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out1",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                  {
                    id: "out2",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
              {
                position: Position.Bottom,
                handles: [
                  {
                    id: "out3",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "complex-2",
          type: "baseNode",
          position: { x: startX + columnGap + nodeWidth, y: startY + nodeHeight * 4 },
          data: {
            label: "Complex",
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in1",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                  {
                    id: "in2",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
              {
                position: Position.Bottom,
                handles: [
                  {
                    id: "in3",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },
      ];

      const initialEdges: Edge[] = [
        // Default edge (bezier by default)
        {
          id: "e-default",
          source: "default-1",
          target: "default-2",
          sourceHandle: "out",
          targetHandle: "in",
          label: "default (bezier)",
        },

        // Straight edge
        {
          id: "e-straight",
          source: "straight-1",
          target: "straight-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "straight",
          label: "straight",
        },

        // Step edge
        {
          id: "e-step",
          source: "step-1",
          target: "step-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "step",
          label: "step",
        },

        // Smooth Step edge
        {
          id: "e-smoothstep",
          source: "smoothstep-1",
          target: "smoothstep-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "smoothstep",
          label: "smoothstep",
        },

        // Bezier edge (explicit)
        {
          id: "e-bezier",
          source: "bezier-1",
          target: "bezier-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "bezier",
          label: "bezier",
        },

        // Animated edge
        {
          id: "e-animated",
          source: "animated-1",
          target: "animated-2",
          sourceHandle: "out",
          targetHandle: "in",
          animated: true,
          label: "animated",
          style: {
            stroke: "#f6ab6c",
            strokeWidth: 2,
          },
        },

        // Styled edge with custom colors and stroke
        {
          id: "e-styled",
          source: "styled-1",
          target: "styled-2",
          sourceHandle: "out",
          targetHandle: "in",
          style: {
            stroke: "#ff0072",
            strokeWidth: 3,
            strokeDasharray: "5 5",
          },
          label: "styled (dashed)",
          labelStyle: {
            fill: "#ff0072",
            fontWeight: 700,
          },
          labelBgStyle: {
            fill: "#ffebe6",
          },
        },

        // Labeled edge with different label positions
        {
          id: "e-labeled",
          source: "labeled-1",
          target: "labeled-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "smoothstep",
          label: "Edge Label",
          labelStyle: {
            fill: "#2563eb",
            fontSize: 14,
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: "#dbeafe",
            fillOpacity: 0.8,
          },
          labelShowBg: true,
          labelBgPadding: [8, 4] as [number, number],
          labelBgBorderRadius: 4,
        },

        // Edge with markers (arrows)
        {
          id: "e-marker",
          source: "marker-1",
          target: "marker-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#22c55e",
          },
          markerStart: {
            type: MarkerType.Arrow,
            color: "#22c55e",
          },
          style: {
            stroke: "#22c55e",
            strokeWidth: 2,
          },
          label: "with arrows",
        },

        // Multiple edges between same nodes with different paths
        {
          id: "e-complex-1",
          source: "complex-1",
          target: "complex-2",
          sourceHandle: "out1",
          targetHandle: "in1",
          type: "bezier",
          style: {
            stroke: "#8b5cf6",
          },
          label: "path 1",
        },
        {
          id: "e-complex-2",
          source: "complex-1",
          target: "complex-2",
          sourceHandle: "out2",
          targetHandle: "in2",
          type: "step",
          style: {
            stroke: "#ec4899",
          },
          label: "path 2",
        },
        {
          id: "e-complex-3",
          source: "complex-1",
          target: "complex-2",
          sourceHandle: "out3",
          targetHandle: "in3",
          type: "smoothstep",
          style: {
            stroke: "#06b6d4",
          },
          label: "path 3",
        },
      ];

      const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
      const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

      const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

      // Define custom edge types if needed
      const edgeTypes = {
        // You can add custom edge types here
        // For now, we'll use the built-in ones
      };

      return (
        <BaseCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          defaultEdgeOptions={{
            style: {
              strokeWidth: 2,
            },
          }}
        >
          <Panel position="top-left">
            <Column gap={8} p={16} style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)" }}>
              <ApTypography variant={FontVariantToken.fontSizeH3Bold}>React Flow Edge Types</ApTypography>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Built-in Types:</strong>
              </p>
              <ul style={{ margin: "0 0 12px 0", paddingLeft: "20px" }}>
                <li>
                  <code>default</code> - Bezier curve
                </li>
                <li>
                  <code>straight</code> - Direct line
                </li>
                <li>
                  <code>step</code> - Right angles
                </li>
                <li>
                  <code>smoothstep</code> - Rounded corners
                </li>
                <li>
                  <code>bezier</code> - Curved path
                </li>
              </ul>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Properties:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li>
                  <code>animated</code> - Animated flow
                </li>
                <li>
                  <code>style</code> - Custom styling
                </li>
                <li>
                  <code>label</code> - Edge labels
                </li>
                <li>
                  <code>markerStart/End</code> - Arrows
                </li>
              </ul>
            </Column>
          </Panel>
          <Panel position="bottom-right">
            <CanvasPositionControls />
          </Panel>
        </BaseCanvas>
      );
    };

    return <AllEdgeTypesStory />;
  },
};

export const InteractiveEdgeSelection: Story = {
  name: "Interactive Edge Type",
  render: () => {
    const InteractiveEdgeSelectionStory = () => {
      const nodeTypeRegistry = useNodeTypeRegistry();
      const nodeTypes = useMemo(() => {
        return nodeTypeRegistry.getAllNodeTypes().reduce(
          (acc, nodeType) => {
            acc[nodeType] = BaseNode;
            return acc;
          },
          {} as Record<string, typeof BaseNode>
        );
      }, [nodeTypeRegistry]);
      const [selectedEdgeType, setSelectedEdgeType] = React.useState<string>("default");
      const [isAnimated, setIsAnimated] = React.useState(false);
      const [strokeWidth, setStrokeWidth] = React.useState(2);
      const [strokeColor, setStrokeColor] = React.useState("#718096");

      const initialNodes: Node[] = [
        {
          id: "interactive-1",
          type: "baseNode",
          position: { x: 200, y: 400 },
          data: {
            label: "Source Node",
            icon: <ApIcon name="play_arrow" color="var(--color-foreground-de-emp)" size="48px" />,
            handleConfigurations: [
              {
                position: Position.Right,
                handles: [
                  {
                    id: "out",
                    type: "source" as const,
                    handleType: "output" as const,
                  },
                ],
              },
            ],
          },
        },
        {
          id: "interactive-2",
          type: "baseNode",
          position: { x: 600, y: 400 },
          data: {
            label: "Target Node",
            icon: <ApIcon name="stop" color="var(--color-foreground-de-emp)" size="48px" />,
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "in",
                    type: "target" as const,
                    handleType: "input" as const,
                  },
                ],
              },
            ],
          },
        },
      ];

      const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);

      const currentEdge: Edge = useMemo(
        () => ({
          id: "interactive-edge",
          source: "interactive-1",
          target: "interactive-2",
          sourceHandle: "out",
          targetHandle: "in",
          type: selectedEdgeType === "default" ? undefined : selectedEdgeType,
          animated: isAnimated,
          label: `${selectedEdgeType} edge`,
          style: {
            stroke: strokeColor,
            strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          },
        }),
        [selectedEdgeType, isAnimated, strokeColor, strokeWidth]
      );

      const [edges, setEdges, onEdgesChange] = useEdgesState([currentEdge]);

      useEffect(() => setEdges([currentEdge]), [selectedEdgeType, isAnimated, strokeWidth, strokeColor, currentEdge, setEdges]);

      const onConnect = useCallback(
        (params: Connection) =>
          setEdges((eds) =>
            addEdge(
              {
                ...params,
                type: selectedEdgeType === "default" ? undefined : selectedEdgeType,
                animated: isAnimated,
                style: {
                  stroke: strokeColor,
                  strokeWidth,
                },
              },
              eds
            )
          ),
        [setEdges, selectedEdgeType, isAnimated, strokeColor, strokeWidth]
      );

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
          <Panel position="top-left">
            <Column gap={8} p={16} style={{ color: "var(--color-foreground)", backgroundColor: "var(--color-background-secondary)" }}>
              <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Edge Configuration</ApTypography>
              <ApDropdown
                size="small"
                label="Edge type"
                selectedValue={selectedEdgeType}
                onSelectedValueChanged={(e) => setSelectedEdgeType(e.detail as string)}
              >
                <ApDropdownItem value="default" label="Default (Bezier)" />
                <ApDropdownItem value="straight" label="Straight" />
                <ApDropdownItem value="step" label="Step" />
                <ApDropdownItem value="smoothstep" label="Smooth Step" />
                <ApDropdownItem value="bezier" label="Bezier" />
              </ApDropdown>
              <ApCheckbox label="Animated" checked={isAnimated} onValueChanged={(e) => setIsAnimated(e.detail as boolean)} />

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
                  Stroke Width: {strokeWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>Stroke Color:</label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: "32px",
                    borderRadius: "4px",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                />
              </div>
              <ApTypography color="var(--color-foreground-de-emp)" variant={FontVariantToken.fontSizeXs}>
                Drag the nodes to see how the edge adapts to different positions.
              </ApTypography>
            </Column>
          </Panel>
          <Panel position="bottom-right">
            <CanvasPositionControls />
          </Panel>
        </BaseCanvas>
      );
    };

    return <InteractiveEdgeSelectionStory />;
  },
};
