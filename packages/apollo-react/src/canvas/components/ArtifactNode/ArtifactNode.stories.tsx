import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback } from "react";
import { Node, Position, ReactFlowProvider, Edge, Panel, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { ArtifactNode } from "./ArtifactNode";
import type { ArtifactNodeData } from "./ArtifactNode.types";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { Column } from "../../layouts";

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
        position: { x: 100, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="image" color="var(--color-foreground-de-emp)" />,
          label: "Header",
          subLabel: "Secondary header",
          bottomRightAdornment: <ApIcon name="flash_on" size="small" color="var(--color-warning-icon)" />,
          handleConfigurations: [
            {
              position: Position.Right,
              handle: { id: "output", type: "source", showButton: true },
            },
          ],
        },
      },
      {
        id: "document-artifact",
        type: "artifactNode",
        position: { x: 350, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="description" color="var(--color-foreground-de-emp)" />,
          label: "Document",
          subLabel: "PDF File",
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "input", type: "target" },
            },
            {
              position: Position.Right,
              handle: { id: "output", type: "source", showButton: true },
            },
          ],
        },
      },
      {
        id: "data-artifact",
        type: "artifactNode",
        position: { x: 600, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="dataset" color="var(--color-foreground-de-emp)" />,
          label: "Dataset",
          subLabel: "CSV Data",
          topRightAdornment: <ApIcon name="check_circle" size="small" color="green" />,
          handleConfigurations: [
            {
              position: Position.Left,
              handle: { id: "input", type: "target" },
            },
          ],
        },
      },
    ];

    const initialEdges: Edge[] = [
      {
        id: "e1-2",
        source: "image-artifact",
        sourceHandle: "output",
        target: "document-artifact",
        targetHandle: "input",
      },
      {
        id: "e2-3",
        source: "document-artifact",
        sourceHandle: "output",
        target: "data-artifact",
        targetHandle: "input",
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
        <Panel position="top-center">
          <Column
            p={12}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
              borderRadius: 4,
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH4Bold}>Artifact Nodes</ApTypography>
            <ApTypography variant={FontVariantToken.fontSizeS}>Circular nodes with single handles per position</ApTypography>
          </Column>
        </Panel>
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
              handle: { id: "read", type: "source", label: "Read", showButton: true },
            },
            {
              position: Position.Bottom,
              handle: { id: "write", type: "target", label: "Write" },
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
              handle: { id: "output", type: "source", label: "Export", showButton: true },
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
              handle: { id: "trigger", type: "target", label: "Trigger" },
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
              handle: { id: "request", type: "target", label: "Request" },
            },
            {
              position: Position.Bottom,
              handle: { id: "response", type: "source", label: "Response", showButton: true },
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
        <Panel position="top-center">
          <Column
            p={12}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
              borderRadius: 4,
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH4Bold}>Artifact Types</ApTypography>
            <ApTypography variant={FontVariantToken.fontSizeS}>Different artifact node configurations</ApTypography>
          </Column>
        </Panel>
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
              handle: { id: "out", type: "source" },
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
              handle: { id: "in", type: "target" },
            },
            {
              position: Position.Right,
              handle: { id: "out", type: "source" },
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
              handle: { id: "in", type: "target" },
            },
            {
              position: Position.Bottom,
              handle: { id: "error", type: "source", label: "Error", showButton: true },
            },
            {
              position: Position.Right,
              handle: { id: "success", type: "source", label: "Success", showButton: true },
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
              handle: { id: "in", type: "target" },
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
              handle: { id: "in", type: "target" },
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
        <Panel position="top-center">
          <Column
            p={12}
            style={{
              color: "var(--color-foreground)",
              backgroundColor: "var(--color-background-secondary)",
              borderRadius: 4,
            }}
          >
            <ApTypography variant={FontVariantToken.fontSizeH4Bold}>Artifact Processing Flow</ApTypography>
            <ApTypography variant={FontVariantToken.fontSizeS}>Connected artifact nodes with validation</ApTypography>
          </Column>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    );
  },
};
