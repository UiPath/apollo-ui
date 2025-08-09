import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useCallback } from "react";
import { Node, Position, ReactFlowProvider, Edge, Panel, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { BaseCanvas } from "../BaseCanvas/BaseCanvas";
import { BaseNode } from "../BaseNode/BaseNode";
import { AgentNode } from "./AgentNode";
import { ArtifactNode } from "../ArtifactNode/ArtifactNode";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { Icons } from "@uipath/uix-core";

const meta: Meta<typeof AgentNode> = {
  title: "Canvas/AgentNode",
  component: AgentNode,
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
  render: () => {
    const initialNodes: Node[] = [
      {
        id: "hiring",
        type: "artifactNode",
        position: { x: 410, y: 50 },
        data: {
          icon: <ApIcon size="48px" name="description" color="var(--color-foreground-de-emp)" />,
          label: "Hiring",
          handleConfigurations: [
            {
              position: Position.Bottom,
              handle: { id: "context-out", type: "source", handleType: "output" },
            },
          ],
        },
      },
      {
        id: "screener-agent",
        type: "agentNode",
        position: { x: 300, y: 250 },
        data: {
          icon: <ApIcon size="48px" name="settings" color="var(--color-foreground-de-emp)" />,
          label: "Screener agent",
          subLabel: "Agent",
        },
      },
      {
        id: "gpt-model",
        type: "artifactNode",
        position: { x: 200, y: 450 },
        data: {
          icon: <Icons.OpenAIIcon w={48} h={48} />,
          label: "gpt-4o-2024-11-20 Community agents",
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "model-in", type: "target", handleType: "output" },
            },
          ],
        },
      },
      {
        id: "get-role",
        type: "artifactNode",
        position: { x: 650, y: 450 },
        data: {
          icon: <ApIcon size="48px" name="drive_eta" color="var(--color-foreground-de-emp)" />,
          label: "Get role description by ApplicationId",
          topRightAdornment: <ApIcon name="verified_user" size="small" color="green" />,
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "tools-in", type: "target", handleType: "output" },
            },
          ],
        },
      },
    ];

    const initialEdges: Edge[] = [
      {
        id: "e1",
        source: "hiring",
        sourceHandle: "context-out",
        target: "screener-agent",
        targetHandle: "context",
      },
      {
        id: "e2",
        source: "screener-agent",
        sourceHandle: "model",
        target: "gpt-model",
        targetHandle: "model-in",
        animated: true,
      },
      {
        id: "e3",
        source: "screener-agent",
        sourceHandle: "tools",
        target: "get-role",
        targetHandle: "tools-in",
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
      agentNode: AgentNode,
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

export const HiringWorkflow: Story = {
  render: () => {
    const initialNodes: Node[] = [
      // Start node - Manual trigger
      {
        id: "manual-trigger",
        type: "baseNode",
        position: { x: 50, y: 150 },
        data: {
          icon: <ApIcon size="48px" name="play_circle" color="var(--color-foreground-de-emp)" />,
          label: "Manual trigger",
          subLabel: "New application",
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [{ id: "trigger-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Digitize resume node
      {
        id: "digitize-resume",
        type: "baseNode",
        position: { x: 250, y: 150 },
        data: {
          icon: <ApIcon size="48px" name="document_scanner" color="var(--color-foreground-de-emp)" />,
          label: "Digitize resume",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "digitize-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Bottom,
              handles: [{ id: "digitize-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Download file node
      {
        id: "download-file",
        type: "baseNode",
        position: { x: 250, y: 300 },
        data: {
          icon: <ApIcon size="48px" name="file_download" color="var(--color-foreground-de-emp)" />,
          label: "Download file",
          handleConfigurations: [
            {
              position: Position.Top,
              handles: [{ id: "download-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Bottom,
              handles: [{ id: "download-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Extract PDF text node
      {
        id: "extract-pdf",
        type: "baseNode",
        position: { x: 250, y: 450 },
        data: {
          icon: <ApIcon size="48px" name="picture_as_pdf" color="red" />,
          label: "Extract PDF text",
          handleConfigurations: [
            {
              position: Position.Top,
              handles: [{ id: "extract-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "extract-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Hiring context artifact
      {
        id: "hiring-context",
        type: "artifactNode",
        position: { x: 500, y: 100 },
        data: {
          icon: <ApIcon size="48px" name="description" color="var(--color-foreground-de-emp)" />,
          label: "Hiring",
          handleConfigurations: [
            {
              position: Position.Bottom,
              handle: { id: "context-out", type: "source", handleType: "output", label: "Context" },
            },
          ],
        },
      },

      // Screener agent
      {
        id: "screener-agent",
        type: "agentNode",
        position: { x: 450, y: 350 },
        data: {
          icon: <ApIcon size="48px" name="smart_toy" color="var(--color-foreground-de-emp)" />,
          label: "Screener agent",
          subLabel: "Agent",
        },
      },

      // GPT Model artifact
      {
        id: "gpt-model",
        type: "artifactNode",
        position: { x: 450, y: 550 },
        data: {
          icon: <ApIcon size="48px" name="model_training" color="var(--color-foreground-de-emp)" />,
          label: "gpt-4o-2024-11-20 Community agents",
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "model-in", type: "target", handleType: "input", label: "Model" },
            },
          ],
        },
      },

      // Get role description artifact
      {
        id: "get-role",
        type: "artifactNode",
        position: { x: 750, y: 550 },
        data: {
          icon: <ApIcon size="48px" name="drive_eta" color="var(--color-foreground-de-emp)" />,
          label: "Get role description by ApplicationId",
          topRightAdornment: <ApIcon name="verified_user" size="small" color="green" />,
          handleConfigurations: [
            {
              position: Position.Top,
              handle: { id: "tools-in", type: "target", handleType: "input", label: "Tools" },
            },
          ],
        },
      },

      // Manager review node
      {
        id: "manager-review",
        type: "baseNode",
        position: { x: 850, y: 350 },
        data: {
          icon: <ApIcon size="48px" name="person" color="var(--color-foreground-de-emp)" />,
          label: "Manager review",
          topLeftAdornment: <ApIcon name="warning" size="small" color="orange" />,
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "review-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "review-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Decision node - Applicant approved?
      {
        id: "decision",
        type: "baseNode",
        position: { x: 1050, y: 350 },
        data: {
          icon: <ApIcon size="48px" name="help_outline" color="var(--color-foreground-de-emp)" />,
          label: "Applicant approved?",
          shape: "square",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "decision-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Top,
              handles: [{ id: "decision-yes", type: "source", handleType: "output", label: "Yes" }],
            },
            {
              position: Position.Bottom,
              handles: [{ id: "decision-no", type: "source", handleType: "output", label: "No" }],
            },
          ],
        },
      },

      // Schedule interview node
      {
        id: "schedule-interview",
        type: "baseNode",
        position: { x: 1250, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="calendar_month" color="blue" />,
          label: "Schedule interview",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "schedule-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "schedule-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Interview scheduled end node
      {
        id: "interview-scheduled",
        type: "baseNode",
        position: { x: 1450, y: 200 },
        data: {
          icon: <ApIcon size="48px" name="check_circle" color="var(--color-foreground-de-emp)" />,
          label: "Interview scheduled",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "scheduled-in", type: "target", handleType: "input" }],
            },
          ],
        },
      },

      // Send email node
      {
        id: "send-email",
        type: "baseNode",
        position: { x: 1250, y: 450 },
        data: {
          icon: <ApIcon size="48px" name="mail" color="var(--color-foreground-de-emp)" />,
          label: "Send email",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "email-in", type: "target", handleType: "input" }],
            },
            {
              position: Position.Right,
              handles: [{ id: "email-out", type: "source", handleType: "output" }],
            },
          ],
        },
      },

      // Applicant rejected end node
      {
        id: "applicant-rejected",
        type: "baseNode",
        position: { x: 1450, y: 450 },
        data: {
          icon: <ApIcon size="48px" name="cancel" color="var(--color-foreground-de-emp)" />,
          label: "Applicant rejected",
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [{ id: "rejected-in", type: "target", handleType: "input" }],
            },
          ],
        },
      },
    ];

    const initialEdges: Edge[] = [
      // Main flow
      {
        id: "e1",
        source: "manual-trigger",
        sourceHandle: "trigger-out",
        target: "digitize-resume",
        targetHandle: "digitize-in",
      },
      {
        id: "e2",
        source: "digitize-resume",
        sourceHandle: "digitize-out",
        target: "download-file",
        targetHandle: "download-in",
      },
      {
        id: "e3",
        source: "download-file",
        sourceHandle: "download-out",
        target: "extract-pdf",
        targetHandle: "extract-in",
      },
      {
        id: "e4",
        source: "extract-pdf",
        sourceHandle: "extract-out",
        target: "screener-agent",
        targetHandle: "input",
      },
      // Context connection
      {
        id: "e5",
        source: "hiring-context",
        sourceHandle: "context-out",
        target: "screener-agent",
        targetHandle: "context",
        style: { strokeDasharray: "5 5" },
      },
      // Model connection
      {
        id: "e6",
        source: "screener-agent",
        sourceHandle: "model",
        target: "gpt-model",
        targetHandle: "model-in",
        style: { strokeDasharray: "5 5" },
      },
      // Tools connection
      {
        id: "e7",
        source: "screener-agent",
        sourceHandle: "tools",
        target: "get-role",
        targetHandle: "tools-in",
        style: { strokeDasharray: "5 5" },
      },
      // Continue to manager review
      {
        id: "e8",
        source: "screener-agent",
        sourceHandle: "output",
        target: "manager-review",
        targetHandle: "review-in",
      },
      // To decision
      {
        id: "e9",
        source: "manager-review",
        sourceHandle: "review-out",
        target: "decision",
        targetHandle: "decision-in",
      },
      // Yes path
      {
        id: "e10",
        source: "decision",
        sourceHandle: "decision-yes",
        target: "schedule-interview",
        targetHandle: "schedule-in",
        label: "Yes",
      },
      {
        id: "e11",
        source: "schedule-interview",
        sourceHandle: "schedule-out",
        target: "interview-scheduled",
        targetHandle: "scheduled-in",
      },
      // No path
      {
        id: "e12",
        source: "decision",
        sourceHandle: "decision-no",
        target: "send-email",
        targetHandle: "email-in",
        label: "No",
      },
      {
        id: "e13",
        source: "send-email",
        sourceHandle: "email-out",
        target: "applicant-rejected",
        targetHandle: "rejected-in",
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
      baseNode: BaseNode,
      agentNode: AgentNode,
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
