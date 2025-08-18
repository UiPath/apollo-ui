import type { Meta, StoryObj } from "@storybook/react-vite";
import { Node, Position, ReactFlowProvider, useNodesState, useEdgesState, Edge, Panel } from "@xyflow/react";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { type ButtonHandleConfig, ButtonHandles, type HandleActionEvent } from "./ButtonHandle";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { Column, Row } from "@uipath/uix-core";
import { FontVariantToken } from "@uipath/apollo-core";
import { BaseNode } from "../BaseNode/BaseNode";
import type { BaseNodeData } from "../BaseNode/BaseNode.types";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { NodeRegistryProvider, useNodeTypeRegistry } from "../BaseNode/NodeRegistryProvider";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import {
  baseNodeRegistration,
  genericNodeRegistration,
  agentNodeRegistration,
  httpRequestNodeRegistration,
  scriptNodeRegistration,
  rpaNodeRegistration,
  connectorNodeRegistration,
} from "../BaseNode/node-types";
import { useMemo } from "react";

const SimpleNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
  const topHandles: ButtonHandleConfig[] = [
    {
      id: "top",
      type: "source",
      handleType: "artifact",
      label: "Escalations",
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log("Escalations clicked", event);
        alert("Escalations clicked!");
      },
    },
  ];
  const bottomHandles: ButtonHandleConfig[] = [
    {
      id: "bottom-memory",
      type: "source",
      handleType: "artifact",
      label: "Memory",
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log("Memory clicked", event);
        alert("Memory clicked!");
      },
    },
    {
      id: "bottom-context",
      type: "source",
      handleType: "artifact",
      label: "Context",
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log("Context clicked", event);
        alert("Context clicked!");
      },
    },
  ];
  const leftHandles: ButtonHandleConfig[] = [
    {
      id: "left",
      type: "target",
      handleType: "input",
    },
  ];
  const rightHandles: ButtonHandleConfig[] = [
    {
      id: "right",
      type: "source",
      handleType: "output",
      showButton: true,
      onAction: (event: HandleActionEvent) => {
        console.log("Output clicked", event);
        alert("Output clicked!");
      },
    },
  ];
  return (
    <div
      style={{
        width: 240,
        height: 70,
        borderRadius: 8,
        backgroundColor: "var(--color-background)",
        border: selected ? "1px solid var(--color-selection-indicator)" : "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: 16,
      }}
    >
      <Row w="100%" gap={12} align="center">
        <ApIcon name="smart_toy" size="32px" color="var(--color-foreground-de-emp)" />
        <Column>
          <ApTypography variant={FontVariantToken.fontSizeSBold} color="var(--color-foreground-de-emp)">
            {data.label}
          </ApTypography>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
            {data.subLabel}
          </ApTypography>
        </Column>
      </Row>

      <ButtonHandles nodeId={id} handles={topHandles} position={Position.Top} selected={selected} />

      <ButtonHandles nodeId={id} handles={bottomHandles} position={Position.Bottom} selected={selected} />

      <ButtonHandles nodeId={id} handles={leftHandles} position={Position.Left} selected={selected} />

      <ButtonHandles nodeId={id} handles={rightHandles} position={Position.Right} selected={selected} />
    </div>
  );
};

const nodeTypes = {
  simpleNode: SimpleNode,
};

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "1",
      type: "simpleNode",
      position: { x: 250, y: 150 },
      data: { label: "Screener agent", subLabel: "Agent", parameters: {} },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <BaseCanvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      mode="design"
    />
  );
};

const meta: Meta<typeof ButtonHandles> = {
  title: "Canvas/ButtonHandles",
  component: ButtonHandles,
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
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    handles: [],
    position: Position.Top,
  },
  render: () => <Flow />,
};

export const MultipleHandles: Story = {
  args: {
    handles: [],
    position: Position.Top,
  },
  render: () => {
    const MultiHandleNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
      const topHandles: ButtonHandleConfig[] = [
        {
          id: "top-1",
          type: "source",
          handleType: "output",
          label: "Out 1",
          showButton: true,
          onAction: (e: HandleActionEvent) => console.log("Output 1 clicked", e),
        },
        {
          id: "top-2",
          type: "source",
          handleType: "output",
          label: "Out 2",
          showButton: true,
          onAction: (e: HandleActionEvent) => console.log("Output 2 clicked", e),
        },
        {
          id: "top-3",
          type: "source",
          handleType: "output",
          label: "Out 3",
          showButton: true,
          onAction: (e: HandleActionEvent) => console.log("Output 3 clicked", e),
        },
      ];

      const bottomHandles: ButtonHandleConfig[] = [
        {
          id: "bottom-1",
          type: "target",
          handleType: "input",
          label: "In 1",
        },
        {
          id: "bottom-2",
          type: "target",
          handleType: "input",
          label: "In 2",
        },
      ];

      const leftHandles: ButtonHandleConfig[] = [
        {
          id: "left-1",
          type: "target",
          handleType: "artifact",
        },
        {
          id: "left-2",
          type: "target",
          handleType: "artifact",
        },
      ];

      const rightHandles: ButtonHandleConfig[] = [
        {
          id: "right",
          type: "source",
          handleType: "output",
          label: "Main Output",
          showButton: true,
          onAction: (e: HandleActionEvent) => console.log("Main output clicked", e),
        },
      ];

      return (
        <div
          style={{
            width: 300,
            height: 150,
            borderRadius: 8,
            backgroundColor: "var(--color-background)",
            border: selected ? "1px solid var(--color-selection-indicator)" : "1px solid var(--color-foreground-de-emp)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-foreground)" }}>{data.label}</div>

          <ButtonHandles nodeId={id} handles={topHandles} position={Position.Top} selected={selected} />

          <ButtonHandles nodeId={id} handles={bottomHandles} position={Position.Bottom} selected={selected} />

          <ButtonHandles nodeId={id} handles={leftHandles} position={Position.Left} selected={selected} />

          <ButtonHandles nodeId={id} handles={rightHandles} position={Position.Right} selected={selected} />
        </div>
      );
    };

    const multiHandleNodeTypes = {
      multiHandleNode: MultiHandleNode,
    };

    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "multiHandleNode",
        position: { x: 250, y: 150 },
        data: { label: "Multi-Handle Node", parameters: {} },
      },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={multiHandleNodeTypes}
        mode="design"
      />
    );
  },
};

export const ComplexExample: Story = {
  args: {
    handles: [],
    position: Position.Top,
  },
  render: () => {
    const ComplexNode = ({ id, data, selected }: { id: string; data: any; selected: boolean }) => {
      const topHandles: ButtonHandleConfig[] = [
        {
          id: "out1",
          type: "source",
          handleType: "output",
          label: "Output 1",
          showButton: true,
          onAction: (event: HandleActionEvent) => {
            console.log("Output 1 clicked", event);
            alert("Output 1 clicked!");
          },
        },
        {
          id: "out2",
          type: "source",
          handleType: "output",
          label: "Output 2",
          showButton: true,
          onAction: (event: HandleActionEvent) => {
            console.log("Output 2 clicked", event);
            alert("Output 2 clicked!");
          },
        },
        {
          id: "out3",
          type: "source",
          handleType: "output",
          label: "Output 3",
          showButton: true,
          onAction: (event: HandleActionEvent) => {
            console.log("Output 3 clicked", event);
            alert("Output 3 clicked!");
          },
        },
      ];

      const bottomHandles: ButtonHandleConfig[] = [
        { id: "in1", type: "target", handleType: "input", label: "Input 1" },
        { id: "in2", type: "target", handleType: "input", label: "Input 2" },
      ];

      const leftHandles: ButtonHandleConfig[] = [{ id: "config", type: "target", handleType: "artifact", label: "Config" }];

      const rightHandles: ButtonHandleConfig[] = [
        {
          id: "success",
          type: "source",
          handleType: "output",
          label: "Success",
          color: "var(--color-success-icon)",
        },
        {
          id: "error",
          type: "source",
          handleType: "output",
          label: "Error",
          color: "var(--color-error-icon)",
        },
      ];

      return (
        <div
          style={{
            width: 300,
            height: 150,
            borderRadius: 8,
            backgroundColor: "var(--color-background)",
            border: selected ? "1px solid var(--color-selection-indicator)" : "1px solid var(--color-foreground-de-emp)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-foreground)" }}>{data.label}</div>

          <ButtonHandles nodeId={id} handles={topHandles} position={Position.Top} selected={selected} />

          <ButtonHandles nodeId={id} handles={bottomHandles} position={Position.Bottom} selected={selected} />

          <ButtonHandles nodeId={id} handles={leftHandles} position={Position.Left} selected={selected} />

          <ButtonHandles nodeId={id} handles={rightHandles} position={Position.Right} selected={selected} />
        </div>
      );
    };

    const complexNodeTypes = {
      complexNode: ComplexNode,
    };

    const [nodes, setNodes, onNodesChange] = useNodesState([
      {
        id: "1",
        type: "complexNode",
        position: { x: 250, y: 150 },
        data: { label: "Complex Node", parameters: {} },
      },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={complexNodeTypes}
        mode="design"
      />
    );
  },
};

// Logic Flow Example - demonstrating If/Switch nodes with ButtonHandles
export const LogicFlow: Story = {
  render: () => {
    // Define the nodes for If and Switch logic
    const logicNodes: Node<BaseNodeData>[] = [
      // IF Node
      {
        id: "if-node",
        type: " ",
        position: { x: 300, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="alt_route" color="var(--color-foreground-de-emp)" />,
          label: "If",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
            {
              position: Position.Right,
              handles: [
                { id: "then", type: "source", label: "Then", showButton: true },
                { id: "else", type: "source", label: "Else", showButton: true },
              ],
            },
          ],
        },
        parameters: {},
      },

      // SWITCH Node
      {
        id: "switch-node",
        type: "baseNode",
        position: { x: 300, y: 650 },
        data: {
          icon: <ApIcon size="48px" variant="outlined" name="account_tree" color="var(--color-foreground-de-emp)" />,
          label: "Switch",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
            {
              position: Position.Right,
              handles: [
                { id: "default", type: "source", label: "Default", showButton: true },
                { id: "case-0", type: "source", label: "0", showButton: true },
                { id: "case-1", type: "source", label: "1", showButton: true },
              ],
            },
          ],
        },
        parameters: {},
      },

      // Source nodes
      {
        id: "condition-input",
        type: "baseNode",
        position: { x: 50, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="input" color="var(--color-foreground-de-emp)" />,
          label: "Condition",
          subLabel: "Boolean",
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source" }],
            },
          ],
        },
        parameters: {},
      },

      {
        id: "value-input",
        type: "baseNode",
        position: { x: 50, y: 650 },
        data: {
          icon: <ApIcon size="48px" name="input" color="var(--color-foreground-de-emp)" />,
          label: "Value",
          subLabel: "Integer",
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source" }],
            },
          ],
        },
        parameters: {},
      },

      // Output nodes for IF
      {
        id: "then-action",
        type: "baseNode",
        position: { x: 600, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="check_circle" color="green" />,
          label: "Then Action",
          subLabel: "Execute if true",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
          ],
        },
        parameters: {},
      },

      {
        id: "else-action",
        type: "baseNode",
        position: { x: 600, y: 300 },
        data: {
          icon: <ApIcon size="48px" name="cancel" color="orange" />,
          label: "Else Action",
          subLabel: "Execute if false",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
          ],
        },
        parameters: {},
      },

      // Output nodes for SWITCH
      {
        id: "default-action",
        type: "baseNode",
        position: { x: 600, y: 500 },
        data: {
          icon: <ApIcon size="48px" name="help_outline" color="var(--color-foreground-de-emp)" />,
          label: "Default Case",
          subLabel: "No match",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
          ],
        },
        parameters: {},
      },

      {
        id: "case-0-action",
        type: "baseNode",
        position: { x: 600, y: 700 },
        data: {
          icon: <ApIcon size="48px" name="looks_one" color="blue" />,
          label: "Case 0",
          subLabel: "Value = 0",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
          ],
        },
        parameters: {},
      },

      {
        id: "case-1-action",
        type: "baseNode",
        position: { x: 600, y: 900 },
        data: {
          icon: <ApIcon size="48px" name="looks_two" color="purple" />,
          label: "Case 1",
          subLabel: "Value = 1",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target" }],
            },
          ],
        },
        parameters: {},
      },
    ];

    // Define edges
    const logicEdges: Edge[] = [
      // IF connections
      {
        id: "condition-to-if",
        source: "condition-input",
        sourceHandle: "output",
        target: "if-node",
        targetHandle: "input",
        animated: true,
      },
      {
        id: "if-to-then",
        source: "if-node",
        sourceHandle: "then",
        target: "then-action",
        targetHandle: "input",
        style: { stroke: "green" },
      },
      {
        id: "if-to-else",
        source: "if-node",
        sourceHandle: "else",
        target: "else-action",
        targetHandle: "input",
        style: { stroke: "orange" },
      },

      // SWITCH connections
      {
        id: "value-to-switch",
        source: "value-input",
        sourceHandle: "output",
        target: "switch-node",
        targetHandle: "input",
        animated: true,
      },
      {
        id: "switch-to-default",
        source: "switch-node",
        sourceHandle: "default",
        target: "default-action",
        targetHandle: "input",
      },
      {
        id: "switch-to-0",
        source: "switch-node",
        sourceHandle: "case-0",
        target: "case-0-action",
        targetHandle: "input",
        style: { stroke: "blue" },
      },
      {
        id: "switch-to-1",
        source: "switch-node",
        sourceHandle: "case-1",
        target: "case-1-action",
        targetHandle: "input",
        style: { stroke: "purple" },
      },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(logicNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(logicEdges);

    const nodeTypes = {
      baseNode: BaseNode,
    };

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        mode="design"
      >
        <Panel position="top-center">
          <Column
            p={12}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
              borderRadius: 4,
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH3Bold}>Logic Flow Examples</ApTypography>
            <ApTypography variant={FontVariantToken.fontSizeS}>IF and SWITCH nodes with ButtonHandles</ApTypography>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};
