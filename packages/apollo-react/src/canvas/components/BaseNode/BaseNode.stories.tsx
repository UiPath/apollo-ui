import type { Meta, StoryObj } from "@storybook/react";
import React, { useCallback } from "react";
import { Panel, ReactFlowProvider, Position, useNodesState, useEdgesState, addEdge, Connection } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { BaseNodeData } from "./BaseNode.types";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { ApIcon } from "@uipath/portal-shell-react";

const meta = {
  title: "Canvas/BaseNode",
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

      const onConnect = useCallback((connection: Connection) => {
        setEdges((eds) => addEdge(connection, eds));
      }, []);

      // Update all nodes with enhanced data if available
      const nodesWithEnhancedData = React.useMemo(() => {
        if (context.parameters?.menuItemsFactory) {
          return nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              menuItems: context.parameters.menuItemsFactory({
                setNodes,
                setEdges,
                nodes,
                edges,
                nodeId: node.id,
              }),
            } as BaseNodeData,
          }));
        }
        return nodes;
      }, [nodes, edges, context.parameters, setNodes, setEdges]);

      if (context.args.custom) {
        return <Story />;
      }

      return (
        <div style={{ width: "100vw", height: "100vh" }}>
          <ReactFlowProvider>
            <BaseCanvas
              nodes={nodesWithEnhancedData}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
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
            labelIcon: <ApIcon color="var(--color-foreground)" name="upload" size="12px" />,
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
            labelIcon: <ApIcon color="var(--color-foreground)" name="download" size="12px" />,
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

export const WithContextMenu: Story = {
  name: "With Context Menu",
  args: {
    label: "Node with Menu",
    subLabel: "Hover to see menu",
    icon: <ApIcon color="var(--color-foreground)" size="42px" name="code" />,
    menuItems: [
      {
        id: "action1",
        label: "Action 1",
        onClick: () => console.log("Action 1 clicked"),
      },
      {
        id: "action2",
        label: "Action 2",
        onClick: () => console.log("Action 2 clicked"),
      },
      {
        type: "divider" as const,
      },
      {
        id: "action3",
        label: "Action 3",
        icon: <ApIcon color="var(--color-foreground)" name="info" size="16px" />,
        onClick: () => console.log("Action 3 clicked"),
      },
    ],
    handleConfigurations: [
      {
        position: Position.Top,
        handles: [
          {
            id: "input-1",
            type: "target" as const,
            handleType: "input" as const,
            label: "Input",
          },
        ],
      },
      {
        position: Position.Bottom,
        handles: [
          {
            id: "output-1",
            type: "source" as const,
            handleType: "output" as const,
            label: "Output",
          },
        ],
      },
    ],
  },
};

export const ContextMenuAdvanced: Story = {
  name: "Context Menu - Advanced",
  parameters: {
    menuItemsFactory: ({ setNodes, nodes, nodeId }) => [
      {
        id: "duplicate",
        label: "Duplicate Node",
        icon: <ApIcon color="var(--color-foreground)" name="content_copy" size="16px" />,
        onClick: () => {
          const sourceNode = nodes.find((n) => n.id === nodeId);
          if (sourceNode) {
            const newNode = {
              id: `node-${Date.now()}`,
              type: "activity",
              position: {
                x: sourceNode.position.x + 50,
                y: sourceNode.position.y + 50,
              },
              data: {
                ...sourceNode.data,
                label: `${sourceNode.data.label} (Copy)`,
                menuItems: undefined, // Will be set by the decorator
              },
            };
            setNodes((nodes) => [...nodes, newNode]);
          }
        },
      },
      {
        id: "rename",
        label: "Rename",
        icon: <ApIcon color="var(--color-foreground)" name="edit" size="16px" />,
        onClick: () => {
          const currentNode = nodes.find((n) => n.id === nodeId);
          const newLabel = prompt("Enter new label:", currentNode?.data?.label || "Node");
          if (newLabel) {
            setNodes((nodes) => nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n)));
          }
        },
      },
      {
        type: "divider" as const,
      },
      {
        id: "delete",
        label: "Delete Node",
        icon: <ApIcon color="var(--color-error-text)" name="delete" size="16px" />,
        onClick: () => {
          if (confirm("Are you sure you want to delete this node?")) {
            setNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
          }
        },
      },
    ],
  },
  args: {
    label: "Advanced Menu Node",
    subLabel: "Try the menu options",
    icon: <ApIcon color="var(--color-foreground)" size="42px" name="widgets" />,
    handleConfigurations: [
      {
        position: Position.Left,
        handles: [
          {
            id: "input",
            type: "target" as const,
            handleType: "input" as const,
            label: "Input",
          },
        ],
      },
      {
        position: Position.Right,
        handles: [
          {
            id: "output",
            type: "source" as const,
            handleType: "output" as const,
            label: "Output",
            onClick: () => console.log("Output clicked"),
          },
        ],
      },
    ],
  },
};

export const InteractiveHandles: Story = {
  name: "Interactive Handles Demo",
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
