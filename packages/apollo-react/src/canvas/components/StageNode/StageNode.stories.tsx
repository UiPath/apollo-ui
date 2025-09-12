import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo } from "react";
import type { Connection, Edge } from "@xyflow/react";
import { Panel, ReactFlowProvider, useNodesState, useEdgesState, addEdge, ConnectionMode } from "@xyflow/react";
import { StageNode } from "./StageNode";
import type { StageTaskItem, StageNodeProps } from "./StageNode.types";
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
        // React Flow passes node data in props.data, so we need to spread it
        return <StageNode {...props} {...props.data} />;
      };

      const initialNodes = context.parameters?.nodes || [
        {
          id: "1",
          type: "stage",
          position: { x: 250, y: 100 },
          data: {
            stageDetails: context.args.stageDetails,
            execution: context.args.execution,
            addTaskLabel: context.args.addTaskLabel,
            menuItems: context.args.menuItems,
            onAddTask: context.args.onAddTask,
          },
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
    addTaskLabel: {
      control: "text",
      description: "Label for the add process button",
      defaultValue: "Add process",
    },
  },
} satisfies Meta<StageNodeProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create icon components
const ProcessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const VerificationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 11L12 14L20 6" />
    <path d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H13" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C20 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
    <path d="M14 2V8H20" />
    <path d="M8 12H16" />
    <path d="M8 16H16" />
  </svg>
);

// Example with both sequential and parallel tasks
const sampleTasks: StageTaskItem[][] = [
  [{ id: "1", label: "Liability Check", icon: <VerificationIcon /> }],
  [{ id: "2", label: "Credit Review", icon: <DocumentIcon /> }],
  // Parallel tasks - these run at the same time
  [
    { id: "3", label: "Address Verification and a really long label that might wrap", icon: <VerificationIcon /> },
    { id: "4", label: "Property Verification", icon: <VerificationIcon /> },
  ],
  [{ id: "5", label: "Processing Review", icon: <ProcessIcon /> }],
];

export const Default: Story = {
  name: "Default",
  parameters: {
    nodes: [
      {
        id: "0",
        type: "stage",
        position: { x: 50, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Application",
            tasks: [],
          },
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
        },
      },
      {
        id: "1",
        type: "stage",
        position: { x: 400, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Processing with a really really really long label that might wrap",
            tasks: sampleTasks,
          },
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
        },
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
        width: 300,
        data: {
          stageDetails: {
            label: "Application",
            tasks: [
              [{ id: "1", label: "KYC and AML Checks", icon: <VerificationIcon /> }],
              [{ id: "2", label: "Document Verification is going to be very very really long", icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: "Completed",
              duration: "4h",
            },
            taskStatus: {
              "1": { status: "Completed", label: "KYC and AML Checks", duration: "2h 15m" },
              "2": { status: "Completed", label: "Document Verification", duration: "1h 45m" },
            },
          },
        },
      },
      {
        id: "1",
        type: "stage",
        position: { x: 400, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Processing",
            tasks: [
              [{ id: "1", label: "Liability Check", icon: <VerificationIcon /> }],
              [{ id: "2", label: "Credit Review", icon: <DocumentIcon /> }],
              [
                { id: "3", label: "Address Verification", icon: <VerificationIcon /> },
                { id: "4", label: "Property Verification", icon: <VerificationIcon /> },
              ],
              [{ id: "5", label: "Processing Review", icon: <ProcessIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: "Completed",
              duration: "6h 15m",
            },
            taskStatus: {
              "1": {
                status: "Completed",
                label: "Liability Check",
                duration: "1h 30m",
                retryDuration: "25m",
                badge: "Reworked",
                badgeStatus: "error",
                retryCount: 2,
              },
              "2": {
                status: "Completed",
                label: "Credit Review",
                duration: "1h 30m",
                retryDuration: "32m",
                badge: "Reworked",
                retryCount: 1,
              },
              "3": { status: "Completed", label: "Address Verification", duration: "30m" },
              "4": {
                status: "Completed",
                label: "Property Verification",
                duration: "1h 30m",
                retryDuration: "1h 5m",
                badge: "Reworked",
                retryCount: 3,
              },
              "5": { status: "Completed", label: "Processing Review", duration: "1h 15m" },
            },
          },
        },
      },
      {
        id: "2",
        type: "stage",
        position: { x: 750, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Underwriting",
            tasks: [
              [{ id: "1", label: "Report Ordering", icon: <DocumentIcon /> }],
              [{ id: "2", label: "Underwriting Verification", icon: <VerificationIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: "InProgress",
              label: "In progress",
              duration: "2h 15m",
            },
            taskStatus: {
              "1": { status: "Completed", label: "Report Ordering", duration: "2h 15m" },
              "2": { status: "InProgress", label: "Underwriting Verification" },
            },
          },
        },
      },
      {
        id: "3",
        type: "stage",
        position: { x: 1100, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Closing",
            tasks: [
              [{ id: "1", label: "Loan Packet Creation", icon: <DocumentIcon /> }],
              [{ id: "2", label: "Customer Signing", icon: <DocumentIcon /> }],
              [{ id: "3", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: "NotExecuted",
              label: "Not started",
            },
            taskStatus: {},
          },
        },
      },
      {
        id: "4",
        type: "stage",
        position: { x: 1100, y: 400 },
        width: 300,
        data: {
          stageDetails: {
            label: "Rejected",
            isException: true,
            tasks: [
              [{ id: "1", label: "Customer Notification", icon: <ProcessIcon /> }],
              [{ id: "2", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: "NotExecuted",
              label: "Not started",
            },
            taskStatus: {},
          },
        },
      },
    ],
    edges: [
      {
        id: "e1",
        type: "stage",
        source: "0",
        sourceHandle: "0____source____right",
        target: "1",
        targetHandle: "1____target____left",
      },
      {
        id: "e2",
        type: "stage",
        source: "1",
        sourceHandle: "1____source____right",
        target: "2",
        targetHandle: "2____target____left",
      },
      {
        id: "e3",
        type: "stage",
        source: "2",
        sourceHandle: "2____source____right",
        target: "3",
        targetHandle: "3____target____left",
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
        width: 300,
        data: {
          stageDetails: {
            label: "Application",
            tasks: [
              [{ id: "1", label: "KYC and AML Checks", icon: <VerificationIcon /> }],
              [{ id: "2", label: "Document Verification", icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Processing Stage
      {
        id: "processing",
        type: "stage",
        position: { x: 450, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Processing",
            tasks: [
              [{ id: "1", label: "Liability Check", icon: <VerificationIcon /> }],
              [{ id: "2", label: "Credit Review", icon: <DocumentIcon /> }],
              [
                { id: "3", label: "Address Verification", icon: <VerificationIcon /> },
                { id: "4", label: "Property Verification", icon: <VerificationIcon /> },
              ],
              [{ id: "5", label: "Processing Review", icon: <ProcessIcon /> }],
            ],
          },
        },
      },
      // Underwriting Stage
      {
        id: "underwriting",
        type: "stage",
        position: { x: 850, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Underwriting",
            tasks: [
              [{ id: "1", label: "Report Ordering", icon: <DocumentIcon /> }],
              [{ id: "2", label: "Underwriting Verification", icon: <VerificationIcon /> }],
            ],
          },
        },
      },
      // Closing Stage
      {
        id: "closing",
        type: "stage",
        position: { x: 1250, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Closing",
            tasks: [
              [{ id: "1", label: "Loan Packet Creation", icon: <DocumentIcon /> }],
              [{ id: "2", label: "Customer Signing", icon: <DocumentIcon /> }],
              [{ id: "3", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Funding Stage
      {
        id: "funding",
        type: "stage",
        position: { x: 1650, y: 100 },
        width: 300,
        data: {
          stageDetails: {
            label: "Funding",
            tasks: [
              [{ id: "1", label: "Disperse Loan", icon: <ProcessIcon /> }],
              [{ id: "2", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Rejected Stage
      {
        id: "rejected",
        type: "stage",
        position: { x: 1250, y: 400 },
        width: 300,
        data: {
          stageDetails: {
            label: "Rejected",
            isException: true,
            tasks: [
              [{ id: "1", label: "Customer Notification", icon: <ProcessIcon /> }],
              [{ id: "2", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Withdrawn Stage
      {
        id: "withdrawn",
        type: "stage",
        position: { x: 450, y: 600 },
        width: 300,
        data: {
          stageDetails: {
            label: "Withdrawn",
            isException: true,
            tasks: [
              [{ id: "1", label: "Customer Notification", icon: <ProcessIcon /> }],
              [{ id: "2", label: "Generate Audit Report", icon: <DocumentIcon /> }],
            ],
          },
        },
      },
    ],
    edges: [
      // Main flow
      {
        id: "e1",
        type: "stage",
        source: "application",
        sourceHandle: "application____source____right",
        target: "processing",
        targetHandle: "processing____target____left",
      },
      {
        id: "e2",
        type: "stage",
        source: "processing",
        sourceHandle: "processing____source____right",
        target: "underwriting",
        targetHandle: "underwriting____target____left",
      },
      {
        id: "e3",
        type: "stage",
        source: "underwriting",
        sourceHandle: "underwriting____source____right",
        target: "closing",
        targetHandle: "closing____target____left",
      },
      {
        id: "e4",
        type: "stage",
        source: "closing",
        sourceHandle: "closing____source____right",
        target: "funding",
        targetHandle: "funding____target____left",
      },
      // Rejection flow
      {
        id: "e5",
        type: "stage",
        source: "processing",
        sourceHandle: "processing____source____right",
        target: "rejected",
        targetHandle: "rejected____target____left",
        animated: true,
        style: { stroke: "var(--color-error-text)" },
      },
      // Withdrawal flow
      {
        id: "e6",
        type: "stage",
        source: "application",
        sourceHandle: "application____source____right",
        target: "withdrawn",
        targetHandle: "withdrawn____target____left",
        animated: true,
        style: { stroke: "var(--color-warning-text)", strokeDasharray: "5,5" },
      },
    ] as Edge[],
  },
  args: {} as any, // No args needed as we're using parameters
};
