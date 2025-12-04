import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState, useMemo } from "react";
import type { Connection, Node, Edge, NodeChange, EdgeChange } from "@uipath/uix/xyflow/react";
import { Panel, ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge } from "@uipath/uix/xyflow/react";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { GroupNode } from "./GroupNode";
import { BaseNode } from "../BaseNode";
import type { GroupNodeData } from "./GroupNode.types";
import type { BaseNodeData } from "../BaseNode/BaseNode.types";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { genericNodeRegistration } from "../BaseNode/node-types";

const meta: Meta = {
  title: "Canvas/GroupNode",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      const registrations = useMemo(() => [genericNodeRegistration], []);

      return (
        <NodeRegistryProvider registrations={registrations}>
          <ReactFlowProvider>
            <div style={{ height: "100vh", width: "100vw" }}>
              <Story />
            </div>
          </ReactFlowProvider>
        </NodeRegistryProvider>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

const nodeTypes = {
  group: GroupNode,
  base: BaseNode,
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

const DefaultStory = () => {
  const initialNodes: Node<GroupNodeData | BaseNodeData>[] = [
    // First group - API flow
    {
      id: "group-1",
      type: "group",
      position: { x: 50, y: 100 },
      data: {
        title: "API flow",
        iconName: "api",
        parameters: {},
      },
      style: {
        width: 600,
        height: 250,
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      },
    },
    {
      id: "node-1-1",
      type: "base",
      position: { x: 30, y: 60 },
      data: {
        parameters: {},
        display: {
          label: "Request",
          shape: "square",
        },
      },
      parentId: "group-1",
      extent: "parent",
    },
    {
      id: "node-1-2",
      type: "base",
      position: { x: 200, y: 60 },
      data: {
        parameters: {},
        display: {
          label: "Process",
          shape: "square",
        },
      },
      parentId: "group-1",
      extent: "parent",
    },
    {
      id: "node-1-3",
      type: "base",
      position: { x: 370, y: 60 },
      data: {
        parameters: {},
        display: {
          label: "Response",
          shape: "square",
        },
      },
      parentId: "group-1",
      extent: "parent",
    },

    // Second group - Classification agent
    {
      id: "group-2",
      type: "group",
      position: { x: 750, y: 100 },
      data: {
        title: "Classification agent",
        iconName: "magic_button",
        backgroundColor: "var(--uix-canvas-background-raised)",
        parameters: {},
      },
      style: {
        width: 500,
        height: 350,
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      },
    },
    {
      id: "node-2-1",
      type: "base",
      position: { x: 180, y: 60 },
      data: {
        parameters: {},
        display: {
          label: "Classification agent",
          shape: "square",
        },
      },
      parentId: "group-2",
      extent: "parent",
    },
    {
      id: "node-2-2",
      type: "base",
      position: { x: 30, y: 200 },
      data: {
        parameters: {},
        display: {
          label: "Category A",
          shape: "square",
        },
      },
      parentId: "group-2",
      extent: "parent",
    },
    {
      id: "node-2-3",
      type: "base",
      position: { x: 180, y: 200 },
      data: {
        parameters: {},
        display: {
          label: "Category B",
          shape: "square",
        },
      },
      parentId: "group-2",
      extent: "parent",
    },
    {
      id: "node-2-4",
      type: "base",
      position: { x: 330, y: 200 },
      data: {
        parameters: {},
        display: {
          label: "Category C",
          shape: "square",
        },
      },
      parentId: "group-2",
      extent: "parent",
    },
  ];

  const initialEdges: Edge[] = [
    // Edges within first group
    {
      id: "e1-1-2",
      source: "node-1-1",
      target: "node-1-2",
      type: "smoothstep",
    },
    {
      id: "e1-2-3",
      source: "node-1-2",
      target: "node-1-3",
      type: "smoothstep",
    },

    // Edges within second group
    {
      id: "e2-1-2",
      source: "node-2-1",
      target: "node-2-2",
      type: "smoothstep",
    },
    {
      id: "e2-1-3",
      source: "node-2-1",
      target: "node-2-3",
      type: "smoothstep",
    },
    {
      id: "e2-1-4",
      source: "node-2-1",
      target: "node-2-4",
      type: "smoothstep",
    },
  ];

  const [nodes, setNodes] = useState<Node<GroupNodeData | BaseNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<GroupNodeData | BaseNodeData>[]),
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

export const EmptyGroup: Story = {
  render: () => <EmptyGroupStory />,
};

const EmptyGroupStory = () => {
  const initialNodes: Node<GroupNodeData>[] = [
    {
      id: "empty-group",
      type: "group",
      position: { x: 200, y: 150 },
      data: {
        title: "Empty Group",
        iconName: "folder",
        parameters: {},
      },
      style: {
        width: 400,
        height: 300,
        backgroundColor: "transparent",
        border: "none",
        padding: 0,
      },
    },
  ];

  const [nodes, setNodes] = useState<Node<GroupNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<GroupNodeData>[]),
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
