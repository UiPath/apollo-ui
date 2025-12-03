import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useState, useMemo } from "react";
import type { Connection, Node, Edge, NodeChange, EdgeChange } from "@uipath/uix/xyflow/react";
import { Panel, ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge, Position } from "@uipath/uix/xyflow/react";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { StickyNoteNode } from "./StickyNoteNode";
import type { StickyNoteData } from "./StickyNoteNode.types";
import { BaseNode } from "../BaseNode/BaseNode";
import { ExecutionStatusContext } from "../BaseNode/ExecutionStatusContext";
import { NodeRegistryProvider } from "../BaseNode/NodeRegistryProvider";
import { baseNodeRegistration } from "../BaseNode/node-types";
import { ApIcon } from "@uipath/portal-shell-react";

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
  baseNode: BaseNode,
};

export const Default: Story = {
  render: () => <DefaultStory />,
};

export const WithBaseNodes: Story = {
  render: () => <WithBaseNodesStory />,
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
    >
      <Panel position="bottom-right">
        <CanvasPositionControls />
      </Panel>
    </BaseCanvas>
  );
};

const WithBaseNodesStory = () => {
  const registrations = useMemo(() => [baseNodeRegistration], []);
  const executions = useMemo(() => ({ getExecutionState: () => "NotExecuted" }), []);

  const WithBaseNodesComponent = () => {
    const initialNodes: Node[] = [
      // Data Ingestion Section - Blue sticky note
      {
        id: "sticky-ingestion",
        type: "stickyNote",
        position: { x: 48, y: 48 },
        data: {
          color: "blue",
          content: "## Data Ingestion\nCollect and validate incoming data",
        } as StickyNoteData,
        width: 608,
        height: 512,
        zIndex: -10,
      },
      {
        id: "node-source",
        type: "baseNode",
        position: { x: 128, y: 224 },
        data: {
          icon: <ApIcon size="48px" name="cloud_upload" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Data Source",
          subLabel: "Input Stream",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Output" }],
            },
          ],
        },
        zIndex: 0,
      },
      {
        id: "node-filter",
        type: "baseNode",
        position: { x: 416, y: 224 },
        data: {
          icon: <ApIcon size="48px" name="filter_list" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Filter",
          subLabel: "Validation Rules",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
            },
            {
              position: Position.Right,
              handles: [
                { id: "transform", type: "source", handleType: "output", label: "Transform" },
                { id: "enrich", type: "source", handleType: "output", label: "Enrich" },
              ],
            },
          ],
        },
        zIndex: 0,
      },

      // Data Processing Section - Yellow sticky note
      {
        id: "sticky-processing",
        type: "stickyNote",
        position: { x: 720, y: 48 },
        data: {
          color: "yellow",
          content: "## Data Processing\nTransform and combine data streams",
        } as StickyNoteData,
        width: 800,
        height: 512,
        zIndex: -10,
      },
      {
        id: "node-transform",
        type: "baseNode",
        position: { x: 800, y: 144 },
        data: {
          icon: <ApIcon size="48px" name="settings" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Transform",
          subLabel: "Data Processing",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Output" }],
            },
          ],
        },
        zIndex: 0,
      },
      {
        id: "node-enrich",
        type: "baseNode",
        position: { x: 800, y: 304 },
        data: {
          icon: <ApIcon size="48px" name="add_circle" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Enrich",
          subLabel: "Add Metadata",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Output" }],
            },
          ],
        },
        zIndex: 0,
      },
      {
        id: "node-merge",
        type: "baseNode",
        position: { x: 1216, y: 224 },
        data: {
          icon: <ApIcon size="48px" name="merge_type" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Merge",
          subLabel: "Combine Streams",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                { id: "input1", type: "target", handleType: "input", label: "Stream 1" },
                { id: "input2", type: "target", handleType: "input", label: "Stream 2" },
              ],
            },
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Merged" }],
            },
          ],
        },
        zIndex: 0,
      },

      // Data Storage Section - Green sticky note
      {
        id: "sticky-storage",
        type: "stickyNote",
        position: { x: 1584, y: 48 },
        data: {
          color: "green",
          content: "## Storage & Analytics\nPersist and analyze processed data",
        } as StickyNoteData,
        width: 800,
        height: 512,
        zIndex: -10,
      },
      {
        id: "node-storage",
        type: "baseNode",
        position: { x: 1664, y: 144 },
        data: {
          icon: <ApIcon size="48px" name="storage" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Storage",
          subLabel: "Database",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Logs" }],
            },
          ],
        },
        zIndex: 0,
      },
      {
        id: "node-index",
        type: "baseNode",
        position: { x: 1664, y: 304 },
        data: {
          icon: <ApIcon size="48px" name="search" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Index",
          subLabel: "Search Engine",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "input", type: "target", handleType: "input", label: "Input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "output", type: "source", handleType: "output", label: "Events" }],
            },
          ],
        },
        zIndex: 0,
      },
      {
        id: "node-monitor",
        type: "baseNode",
        position: { x: 2080, y: 224 },
        data: {
          icon: <ApIcon size="48px" name="analytics" color="var(--uix-canvas-foreground-de-emp)" />,
          label: "Monitor",
          subLabel: "Analytics",
          parameters: {},
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                { id: "logs", type: "target", handleType: "input", label: "Logs" },
                { id: "events", type: "target", handleType: "input", label: "Events" },
              ],
            },
          ],
        },
        zIndex: 0,
      },

      // Overall workflow annotation - Pink sticky note
      {
        id: "sticky-annotation",
        type: "stickyNote",
        position: { x: 48, y: 608 },
        data: {
          color: "pink",
          content:
            "**Data Pipeline Pattern**\n\nThis workflow demonstrates using sticky notes as visual containers to organize and document sections of a data processing pipeline. Each colored section groups related operations while nodes and edges remain fully interactive on top.",
        } as StickyNoteData,
        width: 1024,
        height: 176,
        zIndex: -10,
      },
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>([
      // Data Ingestion flow
      {
        id: "e-source-filter",
        source: "node-source",
        sourceHandle: "output",
        target: "node-filter",
        targetHandle: "input",
        type: "smoothstep",
      },
      // Processing flows - parallel streams
      {
        id: "e-filter-transform",
        source: "node-filter",
        sourceHandle: "transform",
        target: "node-transform",
        targetHandle: "input",
        type: "smoothstep",
      },
      {
        id: "e-filter-enrich",
        source: "node-filter",
        sourceHandle: "enrich",
        target: "node-enrich",
        targetHandle: "input",
        type: "smoothstep",
      },
      // Merge flows
      {
        id: "e-transform-merge",
        source: "node-transform",
        sourceHandle: "output",
        target: "node-merge",
        targetHandle: "input1",
        type: "smoothstep",
      },
      {
        id: "e-enrich-merge",
        source: "node-enrich",
        sourceHandle: "output",
        target: "node-merge",
        targetHandle: "input2",
        type: "smoothstep",
      },
      // Storage flows
      {
        id: "e-merge-storage",
        source: "node-merge",
        sourceHandle: "output",
        target: "node-storage",
        targetHandle: "input",
        type: "smoothstep",
      },
      {
        id: "e-merge-index",
        source: "node-merge",
        sourceHandle: "output",
        target: "node-index",
        targetHandle: "input",
        type: "smoothstep",
      },
      // Analytics flows
      {
        id: "e-storage-monitor",
        source: "node-storage",
        sourceHandle: "output",
        target: "node-monitor",
        targetHandle: "logs",
        type: "smoothstep",
      },
      {
        id: "e-index-monitor",
        source: "node-index",
        sourceHandle: "output",
        target: "node-monitor",
        targetHandle: "events",
        type: "smoothstep",
      },
    ]);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

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
        elevateNodesOnSelect={true}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  };

  return (
    <NodeRegistryProvider registrations={registrations}>
      <ExecutionStatusContext.Provider value={executions}>
        <ReactFlowProvider>
          <div style={{ height: "100vh", width: "100vw" }}>
            <WithBaseNodesComponent />
          </div>
        </ReactFlowProvider>
      </ExecutionStatusContext.Provider>
    </NodeRegistryProvider>
  );
};
