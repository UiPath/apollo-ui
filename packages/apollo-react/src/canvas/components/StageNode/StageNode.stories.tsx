import type { Meta, StoryObj } from "@storybook/react";
import React, { useCallback } from "react";
import { Panel, ReactFlowProvider, Position, useNodesState, useEdgesState, addEdge, Connection, Edge, MarkerType } from "@xyflow/react";
import { StageNode } from "./StageNode";
import { StageNodeData, ProcessItem } from "./StageNode.types";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";

const meta = {
  title: "Canvas/StageNode",
  component: StageNode,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      const initialNodes = context.parameters?.nodes || [
        {
          id: "1",
          type: "stage",
          position: { x: 250, y: 100 },
          data: context.args as never as StageNodeData,
        },
      ];

      const initialEdges = context.parameters?.edges || [];

      const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
      const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

      const onConnect = useCallback((connection: Connection) => {
        setEdges((eds) => addEdge(connection, eds));
      }, []);

      return (
        <div style={{ width: "100vw", height: "100vh" }}>
          <ReactFlowProvider>
            <BaseCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={{ stage: StageNode }}
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
    title: {
      control: "text",
      description: "Title of the stage",
      defaultValue: "Processing",
    },
    processes: {
      control: false,
      description: "Array of process items in the stage",
    },
    addProcessLabel: {
      control: "text",
      description: "Label for the add process button",
      defaultValue: "Add process",
    },
  },
} satisfies Meta<StageNodeData>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example with both sequential and parallel processes
const sampleProcesses: ProcessItem[][] = [
  // Single process (sequential)
  [{ id: "1", label: "Liability Check" }],
  // Single process (sequential)
  [{ id: "2", label: "Credit Review" }],
  // Parallel processes - these run at the same time
  [
    { id: "3", label: "Address Verification" },
    { id: "4", label: "Property Verification" },
  ],
  // Back to sequential
  [{ id: "5", label: "Processing Review" }],
];

export const Default: Story = {
  args: {
    title: "Processing",
    processes: sampleProcesses,
    onAddProcess: () => console.log("Add process clicked"),
    handleConfigurations: [
      {
        position: Position.Left,
        handles: [
          {
            id: "input-1",
            type: "target" as const,
            handleType: "input" as const,
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
          },
        ],
      },
    ],
  },
};

// Loan Processing Workflow Story
export const LoanProcessingWorkflow: Story = {
  name: "Loan Processing Workflow",
  parameters: {
    nodes: [
      // Application Stage
      {
        id: "application",
        type: "stage",
        position: { x: 50, y: 200 },
        data: {
          title: "Application",
          processes: [[{ id: "1", label: "KYC and AML Checks" }], [{ id: "2", label: "Document Verification" }]],
          onAddProcess: () => console.log("Add process to Application"),
          handleConfigurations: [
            {
              position: Position.Right,
              handles: [
                {
                  id: "output",
                  type: "source" as const,
                  handleType: "output" as const,
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Processing Stage
      {
        id: "processing",
        type: "stage",
        position: { x: 350, y: 100 },
        data: {
          title: "Processing",
          processes: [
            [{ id: "1", label: "Liability Check" }],
            [{ id: "2", label: "Credit Review" }],
            [
              { id: "3", label: "Address Verification" },
              { id: "4", label: "Property Verification" },
            ],
            [{ id: "5", label: "Processing Review" }],
          ],
          onAddProcess: () => console.log("Add process to Processing"),
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
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
                },
              ],
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: "reject",
                  type: "source" as const,
                  handleType: "output" as const,
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Underwriting Stage
      {
        id: "underwriting",
        type: "stage",
        position: { x: 650, y: 100 },
        data: {
          title: "Underwriting",
          processes: [[{ id: "1", label: "Report Ordering" }], [{ id: "2", label: "Underwriting Verification" }]],
          onAddProcess: () => console.log("Add process to Underwriting"),
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
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
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Closing Stage
      {
        id: "closing",
        type: "stage",
        position: { x: 950, y: 100 },
        data: {
          title: "Closing",
          processes: [
            [{ id: "1", label: "Loan Packet Creation" }],
            [{ id: "2", label: "Customer Signing" }],
            [{ id: "3", label: "Generate Audit Report" }],
          ],
          onAddProcess: () => console.log("Add process to Closing"),
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
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
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Funding Stage
      {
        id: "funding",
        type: "stage",
        position: { x: 1250, y: 100 },
        data: {
          title: "Funding",
          processes: [[{ id: "1", label: "Disperse Loan" }], [{ id: "2", label: "Generate Audit Report" }]],
          onAddProcess: () => console.log("Add process to Funding"),
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Rejected Stage
      {
        id: "rejected",
        type: "stage",
        position: { x: 950, y: 550 },
        data: {
          title: "Rejected",
          processes: [[{ id: "1", label: "Customer Notification" }], [{ id: "2", label: "Generate Audit Report" }]],
          onAddProcess: () => console.log("Add process to Rejected"),
          handleConfigurations: [
            {
              position: Position.Left,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
                },
              ],
            },
          ],
        } as StageNodeData,
      },
      // Withdrawn Stage
      {
        id: "withdrawn",
        type: "stage",
        position: { x: 350, y: 650 },
        data: {
          title: "Withdrawn",
          processes: [[{ id: "1", label: "Customer Notification" }], [{ id: "2", label: "Generate Audit Report" }]],
          onAddProcess: () => console.log("Add process to Withdrawn"),
          handleConfigurations: [
            {
              position: Position.Top,
              handles: [
                {
                  id: "input",
                  type: "target" as const,
                  handleType: "input" as const,
                },
              ],
            },
          ],
        } as StageNodeData,
      },
    ],
    edges: [
      // Main flow
      {
        id: "e1",
        source: "application",
        sourceHandle: "output",
        target: "processing",
        targetHandle: "input",
      },
      {
        id: "e2",
        source: "processing",
        sourceHandle: "output",
        target: "underwriting",
        targetHandle: "input",
      },
      {
        id: "e3",
        source: "underwriting",
        sourceHandle: "output",
        target: "closing",
        targetHandle: "input",
      },
      {
        id: "e4",
        source: "closing",
        sourceHandle: "output",
        target: "funding",
        targetHandle: "input",
      },
      // Rejection flow
      {
        id: "e5",
        source: "processing",
        sourceHandle: "reject",
        target: "rejected",
        targetHandle: "input",
        animated: true,
        style: { stroke: "var(--color-error-text)" },
      },
      // Withdrawal flow
      {
        id: "e6",
        source: "application",
        sourceHandle: "output",
        target: "withdrawn",
        targetHandle: "input",
        animated: true,
        style: { stroke: "var(--color-warning-text)", strokeDasharray: "5,5" },
      },
    ] as Edge[],
  },
  args: {} as any, // No args needed as we're using parameters
};
