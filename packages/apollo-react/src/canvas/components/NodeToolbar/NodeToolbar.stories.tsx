import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo, useState } from "react";
import type { Connection, Node, Edge, NodeChange, EdgeChange } from "@uipath/uix/xyflow/react";
import { Panel, ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge } from "@uipath/uix/xyflow/react";
import { BaseNode } from "../BaseNode/BaseNode";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import type { NodeRegistration, BaseNodeData } from "../BaseNode/BaseNode.types";
import { ExecutionStatusContext } from "../BaseNode";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import { ApIcon } from "@uipath/portal-shell-react";

const toolbarNodeRegistration: NodeRegistration = {
  nodeType: "toolbarDemo",
  category: "demo",
  displayName: "Toolbar Demo Node",
  description: "Node demonstrating toolbar functionality",
  icon: "settings",
  tags: ["toolbar", "demo"],
  sortOrder: 1,
  version: "1.0.0",

  definition: {
    getIcon: (_data, _context) => <ApIcon name="home" variant="outlined" size="40px" />,

    getDisplay: (data, _context) => ({
      label: data.display?.label || "Toolbar Demo Node",
      subLabel: data.display?.subLabel || "Hover to see toolbar",
      shape: data.display?.shape || ("rectangle" as const),
    }),

    getAdornments: (_data, context) => {
      const executionState = context.executionState;
      const status = typeof executionState === "string" ? executionState : executionState?.status;

      return {
        topRight: <ExecutionStatusIcon status={status} />,
      };
    },

    getToolbar: (data, _context) => ({
      actions: [
        {
          id: "add",
          icon: "add",
          label: "Add",
          onAction: (nodeId) => {
            console.log(`Add action clicked for node ${nodeId}`);
            alert(`Add action clicked for node ${nodeId}`);
          },
        },
        {
          id: "edit",
          icon: "mode_edit",
          label: "Edit",
          onAction: (nodeId) => {
            console.log(`Edit action clicked for node ${nodeId}`);
            alert(`Edit action clicked for node ${nodeId}`);
          },
        },
        {
          id: "delete",
          icon: "delete",
          label: "Delete",
          onAction: (nodeId) => {
            console.log(`Delete action clicked for node ${nodeId}`);
            if (confirm(`Are you sure you want to delete node ${nodeId}?`)) {
              console.log(`Node ${nodeId} deleted`);
            }
          },
        },
      ],
      overflowActions: [
        {
          id: "duplicate",
          icon: "content_copy",
          label: "Duplicate",
          onAction: (nodeId) => {
            console.log(`Duplicate action clicked for node ${nodeId}`);
            alert(`Duplicating node ${nodeId}`);
          },
        },
        {
          id: "settings",
          icon: "settings",
          label: "Settings",
          onAction: (nodeId) => {
            console.log(`Settings clicked for node ${nodeId}`);
            alert(`Opening settings for node ${nodeId}`);
          },
        },
      ],
      position: (data?.parameters?.toolbarPosition as "top" | "bottom" | "left" | "right") || "top",
      align: (data?.parameters?.toolbarAlign as "start" | "center" | "end") || "end", // Right-aligned toolbar by default
    }),

    getMenuItems: (_data, _context) => [],
    getDefaultParameters: () => ({}),
  },
};

const meta: Meta = {
  title: "Canvas/NodeToolbar",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(() => [toolbarNodeRegistration], []);
      const executions = useMemo(
        () => ({
          getExecutionState: () => undefined,
        }),
        []
      );

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

const nodeTypes = {
  toolbarDemo: BaseNode,
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

const DefaultStory = () => {
  const initialNodes = [
    // Rectangle nodes - Row 1
    {
      id: "rect-1",
      type: "toolbarDemo",
      position: { x: 50, y: 50 },
      data: {
        parameters: {
          toolbarAlign: "start",
          toolbarPosition: "top",
        },
        display: {
          label: "Rectangle",
          subLabel: "align: start (left)",
          shape: "rectangle" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "rect-2",
      type: "toolbarDemo",
      position: { x: 350, y: 50 },
      data: {
        parameters: {
          toolbarAlign: "center",
          toolbarPosition: "top",
        },
        display: {
          label: "Rectangle",
          subLabel: "align: center",
          shape: "rectangle" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "rect-3",
      type: "toolbarDemo",
      position: { x: 650, y: 50 },
      data: {
        parameters: {
          toolbarAlign: "end",
          toolbarPosition: "top",
        },
        display: {
          label: "Rectangle",
          subLabel: "align: end (right)",
          shape: "rectangle" as const,
        },
      } as BaseNodeData,
    },
    // Square nodes - Row 2
    {
      id: "square-1",
      type: "toolbarDemo",
      position: { x: 50, y: 200 },
      data: {
        parameters: {
          toolbarAlign: "start",
          toolbarPosition: "top",
        },
        display: {
          label: "Square",
          subLabel: "align: start",
          shape: "square" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "square-2",
      type: "toolbarDemo",
      position: { x: 350, y: 200 },
      data: {
        parameters: {
          toolbarAlign: "center",
          toolbarPosition: "top",
        },
        display: {
          label: "Square",
          subLabel: "align: center",
          shape: "square" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "square-3",
      type: "toolbarDemo",
      position: { x: 650, y: 200 },
      data: {
        parameters: {
          toolbarAlign: "end",
          toolbarPosition: "top",
        },
        display: {
          label: "Square",
          subLabel: "align: end",
          shape: "square" as const,
        },
      } as BaseNodeData,
    },
    // Circle nodes - Row 3
    {
      id: "circle-1",
      type: "toolbarDemo",
      position: { x: 50, y: 400 },
      data: {
        parameters: {
          toolbarAlign: "start",
          toolbarPosition: "top",
        },
        display: {
          label: "Circle",
          subLabel: "align: start",
          shape: "circle" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "circle-2",
      type: "toolbarDemo",
      position: { x: 350, y: 400 },
      data: {
        parameters: {
          toolbarAlign: "center",
          toolbarPosition: "top",
        },
        display: {
          label: "Circle",
          subLabel: "align: center",
          shape: "circle" as const,
        },
      } as BaseNodeData,
    },
    {
      id: "circle-3",
      type: "toolbarDemo",
      position: { x: 650, y: 400 },
      data: {
        parameters: {
          toolbarAlign: "end",
          toolbarPosition: "top",
        },
        display: {
          label: "Circle",
          subLabel: "align: end",
          shape: "circle" as const,
        },
      } as BaseNodeData,
    },
  ];

  const [nodes, setNodes] = useState<Node<BaseNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<BaseNodeData>[]),
    []
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <BaseCanvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      mode="design"
      fitView
    >
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
    </BaseCanvas>
  );
};
