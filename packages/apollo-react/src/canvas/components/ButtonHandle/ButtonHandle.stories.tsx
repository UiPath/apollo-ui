import type { Meta, StoryObj } from "@storybook/react-vite";
import { Node, Position, ReactFlowProvider } from "@xyflow/react";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { type ButtonHandleConfig, ButtonHandles } from "./ButtonHandle";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { Column, Row } from "../../layouts";
import { FontVariantToken } from "@uipath/apollo-core";

const SimpleNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const topHandles: ButtonHandleConfig[] = [
    {
      id: "top",
      type: "source",
      handleType: "artifact",
      label: "Escalations",
      showButton: true,
      onClick: (event) => {
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
      onClick: (event) => {
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
      onClick: (event) => {
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
      onClick: (event) => {
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

      <ButtonHandles handles={topHandles} position={Position.Top} selected={selected} />

      <ButtonHandles handles={bottomHandles} position={Position.Bottom} selected={selected} />

      <ButtonHandles handles={leftHandles} position={Position.Left} selected={selected} />

      <ButtonHandles handles={rightHandles} position={Position.Right} selected={selected} />
    </div>
  );
};

const nodeTypes = {
  simpleNode: SimpleNode,
};

const Flow = () => {
  const initialNodes: Node[] = [
    {
      id: "1",
      type: "simpleNode",
      position: { x: 250, y: 150 },
      data: { label: "Screener agent", subLabel: "Agent" },
    },
  ];

  return <BaseCanvas nodes={initialNodes} edges={[]} nodeTypes={nodeTypes} mode="view" />;
};

const meta: Meta<typeof ButtonHandles> = {
  title: "Canvas/ButtonHandles",
  component: ButtonHandles,
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
    const MultiHandleNode = ({ data, selected }: { data: any; selected: boolean }) => {
      const topHandles: ButtonHandleConfig[] = [
        {
          id: "top-1",
          type: "source",
          handleType: "output",
          label: "Out 1",
          showButton: true,
          onClick: (e) => console.log("Output 1 clicked", e),
        },
        {
          id: "top-2",
          type: "source",
          handleType: "output",
          label: "Out 2",
          showButton: true,
          onClick: (e) => console.log("Output 2 clicked", e),
        },
        {
          id: "top-3",
          type: "source",
          handleType: "output",
          label: "Out 3",
          showButton: true,
          onClick: (e) => console.log("Output 3 clicked", e),
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
          onClick: (e) => console.log("Main output clicked", e),
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

          <ButtonHandles handles={topHandles} position={Position.Top} selected={selected} />

          <ButtonHandles handles={bottomHandles} position={Position.Bottom} selected={selected} />

          <ButtonHandles handles={leftHandles} position={Position.Left} selected={selected} />

          <ButtonHandles handles={rightHandles} position={Position.Right} selected={selected} />
        </div>
      );
    };

    const multiHandleNodeTypes = {
      multiHandleNode: MultiHandleNode,
    };

    const initialNodes: Node[] = [
      {
        id: "1",
        type: "multiHandleNode",
        position: { x: 250, y: 150 },
        data: { label: "Multi-Handle Node" },
      },
    ];

    return <BaseCanvas nodes={initialNodes} edges={[]} nodeTypes={multiHandleNodeTypes} mode="view" />;
  },
};

export const ComplexExample: Story = {
  args: {
    handles: [],
    position: Position.Top,
  },
  render: () => {
    const ComplexNode = ({ data, selected }: { data: any; selected: boolean }) => {
      const topHandles: ButtonHandleConfig[] = [
        {
          id: "out1",
          type: "source",
          handleType: "output",
          label: "Output 1",
          showButton: true,
          onClick: (event) => {
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
          onClick: (event) => {
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
          onClick: (event) => {
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

          <ButtonHandles handles={topHandles} position={Position.Top} selected={selected} />

          <ButtonHandles handles={bottomHandles} position={Position.Bottom} selected={selected} />

          <ButtonHandles handles={leftHandles} position={Position.Left} selected={selected} />

          <ButtonHandles handles={rightHandles} position={Position.Right} selected={selected} />
        </div>
      );
    };

    const complexNodeTypes = {
      complexNode: ComplexNode,
    };

    const initialNodes: Node[] = [
      {
        id: "1",
        type: "complexNode",
        position: { x: 250, y: 150 },
        data: { label: "Complex Node" },
      },
    ];

    return <BaseCanvas nodes={initialNodes} edges={[]} nodeTypes={complexNodeTypes} mode="view" />;
  },
};
