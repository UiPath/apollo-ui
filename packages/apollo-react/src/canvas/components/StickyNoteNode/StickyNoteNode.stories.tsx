import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState } from "react";
import type { Connection, Node, Edge, NodeChange, EdgeChange } from "@uipath/uix/xyflow/react";
import { Panel, ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge } from "@uipath/uix/xyflow/react";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { StickyNoteNode } from "./StickyNoteNode";
import type { StickyNoteData } from "./StickyNoteNode.types";

const meta: Meta = {
  title: "Canvas/StickyNoteNode",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      return (
        <ReactFlowProvider>
          <div style={{ height: "100vh", width: "100vw" }}>
            <Story />
          </div>
        </ReactFlowProvider>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

const nodeTypes = {
  stickyNote: StickyNoteNode,
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

const DefaultStory = () => {
  const initialNodes: Node<StickyNoteData>[] = [
    {
      id: "yellow-note",
      type: "stickyNote",
      position: { x: 50, y: 50 },
      data: {
        color: "yellow",
        content: "**Markdown Support!**\n\nDouble-click to edit with *markdown*\n- Drag to move\n- Resize from corners",
      },
      width: 250,
      height: 150,
    },
    {
      id: "pink-note",
      type: "stickyNote",
      position: { x: 350, y: 50 },
      data: {
        color: "pink",
        content: "## Important\n\n~~Strikethrough~~ and `inline code` work too!",
      },
      width: 250,
      height: 150,
    },
    {
      id: "blue-note",
      type: "stickyNote",
      position: { x: 650, y: 50 },
      data: {
        color: "blue",
        content: "**Lists:**\n\n1. First item\n2. Second item\n3. Third item",
      },
      width: 250,
      height: 150,
    },
    {
      id: "green-note",
      type: "stickyNote",
      position: { x: 50, y: 250 },
      data: {
        color: "green",
        content: "Green note for positive feedback",
      },
      width: 250,
      height: 150,
    },
    {
      id: "purple-note",
      type: "stickyNote",
      position: { x: 350, y: 250 },
      data: {
        color: "purple",
        content: "Purple note for creative thoughts",
      },
      width: 250,
      height: 150,
    },
    {
      id: "orange-note",
      type: "stickyNote",
      position: { x: 650, y: 250 },
      data: {
        color: "orange",
        content: "Orange note for urgent items",
      },
      width: 250,
      height: 150,
    },
    {
      id: "white-note",
      type: "stickyNote",
      position: { x: 50, y: 450 },
      data: {
        color: "white",
        content: "White note for general notes",
      },
      width: 250,
      height: 150,
    },
    {
      id: "long-note",
      type: "stickyNote",
      position: { x: 350, y: 450 },
      data: {
        color: "yellow",
        content:
          "This is a longer sticky note with lots of content to demonstrate scrolling.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDouble-click to edit, then use mouse wheel to scroll through the content.",
      },
      width: 280,
      height: 200,
    },
  ];

  const [nodes, setNodes] = useState<Node<StickyNoteData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<StickyNoteData>[]),
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
