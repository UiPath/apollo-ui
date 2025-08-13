import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback } from "react";
import { Node, Position, ReactFlowProvider, Edge, Panel, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { ArtifactNode } from "./ArtifactNode";
import type { ArtifactNodeData } from "./ArtifactNode.types";
import { CanvasPositionControls } from "../CanvasPositionControls";

const meta: Meta<typeof ArtifactNode> = {
  title: "Canvas/ArtifactNode",
  component: ArtifactNode,
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

// Default story showing basic artifact nodes
export const Default: Story = {
  render: () => {
    const initialNodes: Node<ArtifactNodeData>[] = [
      {
        id: "image-artifact",
        type: "artifactNode",
        position: { x: 200, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="image" variant="outlined" color="var(--color-foreground-de-emp)" />,
          label: "Header",
          subLabel: "Secondary header",
          topLeftAdornment: (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="12" fill="var(--color-background)" />
              <circle cx="12" cy="12" r="10" fill="red" />
            </svg>
          ),
          bottomRightAdornment: <ApIcon name="shield" variant="outlined" size="20px" color="var(--color-foreground-de-emp)" />,
          handleConfigurations: [
            {
              position: Position.Right,
              handle: { id: "output", type: "source", handleType: "output", showButton: true },
            },
          ],
        },
      },
    ];

    const initialEdges: Edge[] = [];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const nodeTypes = {
      artifactNode: ArtifactNode,
    };

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};

// Example with different artifact types
export const ArtifactTypes: Story = {
  render: () => {
    const initialNodes: Node<ArtifactNodeData>[] = [
      {
        id: "memory",
        type: "artifactNode",
        position: { x: 100, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="memory" color="var(--color-foreground-de-emp)" />,
          label: "Memory",
          subLabel: "Cache Store",
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "read", type: "source", handleType: "output", label: "Read", showButton: true },
            },
            {
              position: Position.Bottom,
              handle: { id: "write", type: "target", handleType: "input", label: "Write" },
            },
          ],
        },
      },
      {
        id: "context",
        type: "artifactNode",
        position: { x: 300, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="folder_open" color="var(--color-foreground-de-emp)" />,
          label: "Context",
          subLabel: "Session Data",
          handleConfigurations: [
            {
              position: Position.Right,
              handle: { id: "output", type: "source", handleType: "output", label: "Export", showButton: true },
            },
          ],
        },
      },
      {
        id: "escalation",
        type: "artifactNode",
        position: { x: 500, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="escalator_warning" color="var(--color-error-icon)" />,
          label: "Escalation",
          subLabel: "Human Review",
          topRightAdornment: <ApIcon name="priority_high" size="small" color="red" />,
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "trigger", type: "target", handleType: "input", label: "Trigger" },
            },
          ],
        },
      },
      {
        id: "api",
        type: "artifactNode",
        position: { x: 700, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="api" color="var(--color-foreground-de-emp)" />,
          label: "API",
          subLabel: "External Service",
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "request", type: "target", handleType: "input", label: "Request" },
            },
            {
              position: Position.Bottom,
              handle: { id: "response", type: "source", handleType: "output", label: "Response", showButton: true },
            },
          ],
        },
      },
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>([]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const nodeTypes = {
      artifactNode: ArtifactNode,
    };

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};

// Connected artifact flow
export const ConnectedFlow: Story = {
  render: () => {
    const initialNodes: Node<ArtifactNodeData>[] = [
      {
        id: "input-1",
        type: "artifactNode",
        position: { x: 50, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="upload_file" color="var(--color-foreground-de-emp)" />,
          label: "Upload",
          subLabel: "Source File",
          handleConfigurations: [
            {
              position: Position.Right,
              handle: { id: "out", type: "source", handleType: "output" },
            },
          ],
        },
      },
      {
        id: "process-1",
        type: "artifactNode",
        position: { x: 250, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="transform" color="var(--color-foreground-de-emp)" />,
          label: "Transform",
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "in", type: "target", handleType: "input" },
            },
            {
              position: Position.Right,
              handle: { id: "out", type: "source", handleType: "output" },
            },
          ],
        },
      },
      {
        id: "validate",
        type: "artifactNode",
        position: { x: 450, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="verified" color="green" />,
          label: "Validate",
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "in", type: "target", handleType: "input" },
            },
            {
              position: Position.Bottom,
              handle: { id: "error", type: "source", handleType: "output", label: "Error", showButton: true },
            },
            {
              position: Position.Right,
              handle: { id: "success", type: "source", handleType: "output", label: "Success", showButton: true },
            },
          ],
        },
      },
      {
        id: "store",
        type: "artifactNode",
        position: { x: 650, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="save" color="var(--color-foreground-de-emp)" />,
          label: "Store",
          subLabel: "Database",
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "in", type: "target", handleType: "input" },
            },
          ],
        },
      },
      {
        id: "error-handler",
        type: "artifactNode",
        position: { x: 450, y: 300 },
        data: {
          icon: <ApIcon size="48px" name="error" color="red" />,
          label: "Error Log",
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "in", type: "target", handleType: "input" },
            },
          ],
        },
      },
    ];

    const initialEdges: Edge[] = [
      {
        id: "e1",
        source: "input-1",
        sourceHandle: "out",
        target: "process-1",
        targetHandle: "in",
        animated: true,
      },
      {
        id: "e2",
        source: "process-1",
        sourceHandle: "out",
        target: "validate",
        targetHandle: "in",
        animated: true,
      },
      {
        id: "e3",
        source: "validate",
        sourceHandle: "success",
        target: "store",
        targetHandle: "in",
        style: { stroke: "green" },
      },
      {
        id: "e4",
        source: "validate",
        sourceHandle: "error",
        target: "error-handler",
        targetHandle: "in",
        style: { stroke: "red" },
      },
    ];

    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    const nodeTypes = {
      artifactNode: ArtifactNode,
    };

    return (
      <BaseCanvas
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        mode="design"
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};
