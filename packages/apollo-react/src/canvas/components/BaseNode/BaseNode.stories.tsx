import type { Meta, StoryObj } from "@storybook/react";
import { useCallback } from "react";
import { Panel, ReactFlowProvider, Position, useNodesState, useEdgesState } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { BaseNodeData } from "./BaseNode.types";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { ApIcon } from "@uipath/portal-shell-react";

const meta = {
  title: "Canvas/BaseNode",
  component: BaseNode,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      const [nodes, setNodes, onNodesChange] = useNodesState([
        {
          id: "1",
          type: "activity",
          position: { x: 200, y: 200 },
          data: context.args as never as BaseNodeData,
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([]);

      return (
        <div style={{ width: "100vw", height: "100vh" }}>
          <ReactFlowProvider>
            <BaseCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={{ activity: BaseNode }}
              mode="design"
            >
              <Panel position="bottom-right">
                <CanvasPositionControls />
              </Panel>
            </BaseCanvas>
          </ReactFlowProvider>
        </div>
      );
    },
  ],
  argTypes: {
    label: {
      control: "text",
      description: "Main label text for the activity",
      defaultValue: "Header",
    },
    subLabel: {
      control: "text",
      description: "Secondary label text providing additional context",
      defaultValue: "Secondary header",
    },
    icon: {
      control: false,
      description: "Icon element to display in the node (ReactNode or string)",
    },
    topLeftAdornment: {
      control: false,
      description: "Custom adornment for top-left corner",
    },
    topRightAdornment: {
      control: false,
      description: "Custom adornment for top-right corner",
    },
    bottomRightAdornment: {
      control: false,
      description: "Custom adornment for bottom-right corner",
    },
    bottomLeftAdornment: {
      control: false,
      description: "Custom adornment for bottom-left corner",
    },
  },
} satisfies Meta<BaseNodeData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Header",
    subLabel: "Secondary header",
    topLeftAdornment: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="var(--color-background)" />
        <circle cx="12" cy="12" r="10" fill="red" />
      </svg>
    ),
    bottomRightAdornment: <ApIcon color="var(--color-foreground)" variant="outlined" name="shield" />,
    bottomLeftAdornment: <ApIcon color="var(--color-foreground)" name="bolt" />,
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="circle" />,
  },
};

// Helper function to create stable handle configurations
const createHandleConfig = (id: string, type: "source" | "target", handleType: any, label: string, message: string) => ({
  id,
  type,
  handleType,
  label,
  showButton: true,
  onClick: () => console.log(message),
});

export const WithHandles: Story = {
  args: {
    label: "Activity Node",
    subLabel: "Process Data",
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="settings" />,
    handleConfigurations: [
      {
        position: Position.Top,
        handles: [createHandleConfig("input-1", "target", "input", "Input", "Top handle clicked")],
      },
      {
        position: Position.Bottom,
        handles: [createHandleConfig("output-1", "source", "output", "Output", "Bottom handle clicked")],
      },
    ],
  },
};

export const MultipleHandles: Story = {
  args: {
    label: "Multi-Handle Node",
    subLabel: "Complex Processing",
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="hub" />,
    handleConfigurations: [
      {
        position: Position.Left,
        handles: [
          {
            id: "input-1",
            type: "target" as const,
            handleType: "input" as const,
            label: "Data In",
            showButton: false,
          },
          {
            id: "input-2",
            type: "target" as const,
            handleType: "input" as const,
            label: "Config",
            showButton: false,
          },
        ],
      },
      {
        position: Position.Right,
        handles: [
          {
            id: "output-1",
            type: "source" as const,
            handleType: "output" as const,
            label: "Success",
            color: "var(--color-success-text)",
            showButton: true,
            onClick: () => alert("Success output clicked"),
          },
          {
            id: "output-2",
            type: "source" as const,
            handleType: "output" as const,
            label: "Error",
            color: "var(--color-error-text)",
            showButton: true,
            onClick: () => alert("Error output clicked"),
          },
        ],
      },
    ],
  },
};

export const ArtifactHandles: Story = {
  args: {
    label: "Artifact Node",
    subLabel: "Data Storage",
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="inventory_2" />,
    handleConfigurations: [
      {
        position: Position.Top,
        handles: [
          {
            id: "artifact-1",
            type: "target" as const,
            handleType: "artifact" as const,
            label: "Store",
            labelIcon: <ApIcon name="upload" size="12px" />,
            showButton: false,
          },
        ],
      },
      {
        position: Position.Bottom,
        handles: [
          {
            id: "artifact-2",
            type: "source" as const,
            handleType: "artifact" as const,
            label: "Retrieve",
            labelIcon: <ApIcon name="download" size="12px" />,
            showButton: false,
          },
        ],
      },
    ],
  },
};

export const NoOverlapTest: Story = {
  name: "No Overlap Test",
  args: {
    label: "Test Node",
    subLabel: "With Long Sublabel Text",
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="check_circle" />,
    handleConfigurations: [
      {
        position: Position.Bottom,
        handles: [
          {
            id: "output-1",
            type: "source" as const,
            handleType: "output" as const,
            label: "Output Connection",
            showButton: true,
            onClick: () => console.log("Output clicked"),
          },
        ],
      },
    ],
  },
};

export const InteractiveHandles: Story = {
  name: "Interactive Handles Demo",
  parameters: {
    docs: {
      description: {
        story: `
        This story demonstrates the dynamic handle visibility system:
        - **Hover**: Handles appear when you hover over the node
        - **Selection**: Handles remain visible when node is selected
        - **Connections**: Handles with active connections always remain visible
        - **Connection Mode**: All handles show when creating a new connection
        - **Text Positioning**: Text automatically adjusts when bottom handles appear
        `,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const [nodes, setNodes, onNodesChange] = useNodesState([
        {
          id: "1",
          type: "activity",
          position: { x: 100, y: 200 },
          data: context.args as never as BaseNodeData,
        },
        {
          id: "2",
          type: "activity",
          position: { x: 400, y: 200 },
          data: {
            label: "Connected Node",
            subLabel: "Has Connection",
            icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="link" />,
            handleConfigurations: [
              {
                position: Position.Left,
                handles: [
                  {
                    id: "input-1",
                    type: "target" as const,
                    handleType: "input" as const,
                    label: "Input",
                  },
                ],
              },
            ],
          } as BaseNodeData,
        },
      ]);
      const [edges, setEdges, onEdgesChange] = useEdgesState([
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "output-1",
          targetHandle: "input-1",
        },
      ]);

      return (
        <div style={{ width: "100vw", height: "100vh" }}>
          <ReactFlowProvider>
            <BaseCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={{ activity: BaseNode }}
              mode="design"
            >
              <Panel position="bottom-right">
                <CanvasPositionControls />
              </Panel>
              <Panel position="top-left">
                <div
                  style={{
                    background: "var(--color-background)",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  <strong>Try these interactions:</strong>
                  <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Hover over nodes to show handles</li>
                    <li>Click to select a node</li>
                    <li>Drag from a handle to create connection</li>
                    <li>Watch text move when handles appear</li>
                  </ul>
                </div>
              </Panel>
            </BaseCanvas>
          </ReactFlowProvider>
        </div>
      );
    },
  ],
  args: {
    label: "Interactive Node",
    subLabel: "Hover to see handles",
    icon: <ApIcon color="var(--color-foreground)" size="42px" variant="outlined" name="touch_app" />,
    handleConfigurations: [
      {
        position: Position.Top,
        handles: [
          {
            id: "input-1",
            type: "target" as const,
            handleType: "input" as const,
            label: "Input",
            showButton: true,
            onClick: () => console.log("Input clicked"),
          },
        ],
      },
      {
        position: Position.Right,
        handles: [
          {
            id: "output-1",
            type: "source" as const,
            handleType: "output" as const,
            label: "Output",
            showButton: true,
            onClick: () => console.log("Output clicked"),
          },
        ],
      },
      {
        position: Position.Bottom,
        handles: [
          {
            id: "output-2",
            type: "source" as const,
            handleType: "output" as const,
            label: "Alternative",
            showButton: true,
            onClick: () => console.log("Alternative output clicked"),
          },
        ],
      },
    ],
  },
};
