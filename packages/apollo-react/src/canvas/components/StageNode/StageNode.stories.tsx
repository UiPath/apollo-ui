import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo } from "react";
import type { Connection, Edge } from "@xyflow/react";
import { Panel, ReactFlowProvider, useNodesState, useEdgesState, addEdge, ConnectionMode } from "@xyflow/react";
import { StageNode } from "./StageNode";
import type { StageNodeData, StageTaskItem, StageNodeProps } from "./StageNode.types";
import type { NodeMenuItem } from "../NodeContextMenu";
import { BaseCanvas } from "../BaseCanvas";
import { CanvasPositionControls } from "../CanvasPositionControls";
import { StageEdge } from "./StageEdge";
import { StageConnectionEdge } from "./StageConnectionEdge";

const meta = {
  title: "Canvas/StageNode",
  component: StageNode as any,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story, context) => {
      // Create a wrapper component that passes props correctly
      const StageNodeWrapper = (props: any) => {
        // Extract execution and other props from data and pass them as direct props
        const { execution, addProcessLabel, menuItems, onAddProcess, ...restData } = props.data;
        return (
          <StageNode
            {...props}
            data={restData}
            execution={execution}
            addProcessLabel={addProcessLabel}
            menuItems={menuItems}
            onAddProcess={onAddProcess}
          />
        );
      };

      const initialNodes = context.parameters?.nodes || [
        {
          id: "1",
          type: "stage",
          position: { x: 250, y: 100 },
          data: context.args as never as StageNodeData,
        },
      ];

      const initialEdges = context.parameters?.edges || [];

      const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
      const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

      const onConnect = useCallback(
        (connection: Connection) => {
          setEdges((eds) => addEdge(connection, eds));
        },
        [setEdges]
      );

      const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
      const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);
      const defaultEdgeOptions = useMemo(() => ({ type: "stage" }), []);

      return (
        <div style={{ width: "100vw", height: "100vh" }}>
          <ReactFlowProvider>
            <BaseCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              mode="design"
              connectionMode={ConnectionMode.Strict}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionLineComponent={StageConnectionEdge}
              elevateEdgesOnSelect
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
    addProcessLabel: {
      control: "text",
      description: "Label for the add process button",
      defaultValue: "Add process",
    },
  },
} satisfies Meta<StageNodeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Example with both sequential and parallel tasks
const sampleTasks: StageTaskItem[][] = [
  [{ id: "1", label: "Liability Check" }],
  [{ id: "2", label: "Credit Review" }],
  // Parallel tasks - these run at the same time
  [
    { id: "3", label: "Address Verification and a really long label that might wrap" },
    { id: "4", label: "Property Verification" },
  ],
  [{ id: "5", label: "Processing Review" }],
];

export const Default: Story = {
  name: "Default",
  parameters: {
    nodes: [
      {
        id: "0",
        type: "stage",
        position: { x: 50, y: 100 },
        data: {
          label: "Application",
          tasks: [],
          menuItems: [
            {
              id: "edit",
              label: "Edit Stage",
              onClick: () => console.log("Edit Application stage"),
            },
            {
              id: "duplicate",
              label: "Duplicate",
              onClick: () => console.log("Duplicate Application stage"),
            },
            { type: "divider" },
            {
              id: "delete",
              label: "Delete",
              onClick: () => console.log("Delete Application stage"),
            },
          ],
        } as StageNodeData & { menuItems: NodeMenuItem[] },
      },
      {
        id: "1",
        type: "stage",
        position: { x: 400, y: 100 },
        data: {
          label: "Processing with a really really really long label that might wrap",
          tasks: sampleTasks,
          menuItems: [
            {
              id: "edit",
              label: "Edit Stage",
              onClick: () => console.log("Edit Processing stage"),
            },
            {
              id: "add-task",
              label: "Add Task",
              onClick: () => console.log("Add task to Processing stage"),
            },
            {
              id: "configure",
              label: "Configure",
              onClick: () => console.log("Configure Processing stage"),
            },
            { type: "divider" },
            {
              id: "duplicate",
              label: "Duplicate",
              onClick: () => console.log("Duplicate Processing stage"),
            },
            {
              id: "delete",
              label: "Delete",
              onClick: () => console.log("Delete Processing stage"),
              disabled: true,
            },
          ],
        } as StageNodeData & { menuItems: NodeMenuItem[] },
      },
    ],
  },
  args: {},
};

export const ExecutionStatus: Story = {
  name: "Execution Status",
  parameters: {
    nodes: [
      {
        id: "0",
        type: "stage",
        position: { x: 50, y: 100 },
        data: {
          label: "Application",
          tasks: [
            [{ id: "1", label: "KYC and AML Checks" }],
            [{ id: "2", label: "Document Verification is going to be very very really long" }],
          ],
          execution: {
            stageStatus: "Completed",
            taskStatus: {
              "1": { status: "Completed", label: "KYC and AML Checks", duration: "2h 15m" },
              "2": { status: "Completed", label: "Document Verification", duration: "1h 45m" },
            },
          },
        } as StageNodeData,
      },
      {
        id: "1",
        type: "stage",
        position: { x: 400, y: 100 },
        data: {
          label: "Processing",
          tasks: [
            [{ id: "1", label: "Liability Check" }],
            [{ id: "2", label: "Credit Review" }],
            [
              { id: "3", label: "Address Verification" },
              { id: "4", label: "Property Verification" },
            ],
            [{ id: "5", label: "Processing Review" }],
          ],
          execution: {
            stageStatus: "Completed",
            taskStatus: {
              "1": { status: "Completed", label: "Liability Check", duration: "1h 30m", badge: "Reworked" },
              "2": { status: "Completed", label: "Credit Review", duration: "1h 30m", badge: "Reworked" },
              "3": { status: "Completed", label: "Address Verification", duration: "30m" },
              "4": { status: "Completed", label: "Property Verification", duration: "1h 30m", badge: "Reworked" },
              "5": { status: "Completed", label: "Processing Review", duration: "1h 15m" },
            },
          },
        } as StageNodeData,
      },
      {
        id: "2",
        type: "stage",
        position: { x: 750, y: 100 },
        data: {
          label: "Underwriting",
          tasks: [[{ id: "1", label: "Report Ordering" }], [{ id: "2", label: "Underwriting Verification" }]],
          execution: {
            stageStatus: "InProgress",
            stageStatusLabel: "In progress",
            taskStatus: {
              "1": { status: "Completed", label: "Report Ordering", duration: "2h 15m" },
              "2": { status: "InProgress", label: "Underwriting Verification" },
            },
          },
        } as StageNodeData,
      },
      {
        id: "3",
        type: "stage",
        position: { x: 1100, y: 100 },
        data: {
          label: "Closing",
          tasks: [
            [{ id: "1", label: "Loan Packet Creation" }],
            [{ id: "2", label: "Customer Signing" }],
            [{ id: "3", label: "Generate Audit Report" }],
          ],
          execution: {
            stageStatus: "NotExecuted",
            stageStatusLabel: "Not started",
            taskStatus: {},
          },
        } as StageNodeData,
      },
      {
        id: "4",
        type: "stage",
        position: { x: 1100, y: 400 },
        data: {
          label: "Rejected",
          tasks: [[{ id: "1", label: "Customer Notification" }], [{ id: "2", label: "Generate Audit Report" }]],
          execution: {
            stageStatus: "NotExecuted",
            stageStatusLabel: "Not started",
            taskStatus: {},
          },
        } as StageNodeData,
      },
    ],
    edges: [
      {
        id: "e1",
        type: "stage",
        source: "0",
        sourceHandle: "output",
        target: "1",
        targetHandle: "input",
      },
      {
        id: "e2",
        type: "stage",
        source: "1",
        sourceHandle: "output",
        target: "2",
        targetHandle: "input",
      },
      {
        id: "e3",
        type: "stage",
        source: "2",
        sourceHandle: "output",
        target: "3",
        targetHandle: "input",
      },
    ] as Edge[],
  },
  args: {},
};

export const LoanProcessingWorkflow: Story = {
  name: "Loan Processing Workflow",
  parameters: {
    nodes: [
      // Application Stage
      {
        id: "application",
        type: "stage",
        position: { x: 50, y: 100 },
        data: {
          label: "Application",
          tasks: [[{ id: "1", label: "KYC and AML Checks" }], [{ id: "2", label: "Document Verification" }]],
        } as StageNodeData,
      },
      // Processing Stage
      {
        id: "processing",
        type: "stage",
        position: { x: 350, y: 100 },
        data: {
          label: "Processing",
          tasks: [
            [{ id: "1", label: "Liability Check" }],
            [{ id: "2", label: "Credit Review" }],
            [
              { id: "3", label: "Address Verification" },
              { id: "4", label: "Property Verification" },
            ],
            [{ id: "5", label: "Processing Review" }],
          ],
        } as StageNodeData,
      },
      // Underwriting Stage
      {
        id: "underwriting",
        type: "stage",
        position: { x: 650, y: 100 },
        data: {
          label: "Underwriting",
          tasks: [[{ id: "1", label: "Report Ordering" }], [{ id: "2", label: "Underwriting Verification" }]],
        } as StageNodeData,
      },
      // Closing Stage
      {
        id: "closing",
        type: "stage",
        position: { x: 950, y: 100 },
        data: {
          label: "Closing",
          tasks: [
            [{ id: "1", label: "Loan Packet Creation" }],
            [{ id: "2", label: "Customer Signing" }],
            [{ id: "3", label: "Generate Audit Report" }],
          ],
        } as StageNodeData,
      },
      // Funding Stage
      {
        id: "funding",
        type: "stage",
        position: { x: 1250, y: 100 },
        data: {
          label: "Funding",
          tasks: [[{ id: "1", label: "Disperse Loan" }], [{ id: "2", label: "Generate Audit Report" }]],
        } as StageNodeData,
      },
      // Rejected Stage
      {
        id: "rejected",
        type: "stage",
        position: { x: 950, y: 550 },
        data: {
          label: "Rejected",
          tasks: [[{ id: "1", label: "Customer Notification" }], [{ id: "2", label: "Generate Audit Report" }]],
        } as StageNodeData,
      },
      // Withdrawn Stage
      {
        id: "withdrawn",
        type: "stage",
        position: { x: 350, y: 650 },
        data: {
          label: "Withdrawn",
          tasks: [[{ id: "1", label: "Customer Notification" }], [{ id: "2", label: "Generate Audit Report" }]],
        } as StageNodeData,
      },
    ],
    edges: [
      // Main flow
      {
        id: "e1",
        type: "stage",
        source: "application",
        sourceHandle: "output",
        target: "processing",
        targetHandle: "input",
      },
      {
        id: "e2",
        type: "stage",
        source: "processing",
        sourceHandle: "output",
        target: "underwriting",
        targetHandle: "input",
      },
      {
        id: "e3",
        type: "stage",
        source: "underwriting",
        sourceHandle: "output",
        target: "closing",
        targetHandle: "input",
      },
      {
        id: "e4",
        type: "stage",
        source: "closing",
        sourceHandle: "output",
        target: "funding",
        targetHandle: "input",
      },
      // Rejection flow
      {
        id: "e5",
        type: "stage",
        source: "processing",
        sourceHandle: "output",
        target: "rejected",
        targetHandle: "input",
        animated: true,
        style: { stroke: "var(--color-error-text)" },
      },
      // Withdrawal flow
      {
        id: "e6",
        type: "stage",
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
