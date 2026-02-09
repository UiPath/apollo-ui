import type { Meta, StoryObj } from '@storybook/react';
import type { Connection, Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DefaultCanvasTranslations } from '../../types';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import type { ListItem } from '../Toolbox';
import {
  createGroupModificationHandlers,
  GroupModificationType,
  getHandlerForModificationType,
} from '../utils/GroupModificationUtils';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import type { StageNodeProps, StageTaskItem } from './StageNode.types';

const meta: Meta<typeof StageNode> = {
  title: 'Canvas/StageNode',
  component: StageNode as any,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      // Allow stories to use custom render
      if (context.parameters?.useCustomRender) {
        return <Story />;
      }

      // Create a wrapper component that passes props correctly
      const StageNodeWrapper = (props: any) => {
        // React Flow passes node data in props.data, so we need to spread it
        return <StageNode {...props} {...props.data} />;
      };

      const initialNodes = context.parameters?.nodes || [
        {
          id: '1',
          type: 'stage',
          position: { x: 250, y: 100 },
          data: {
            stageDetails: context.args.stageDetails,
            execution: context.args.execution,
            addTaskLabel: context.args.addTaskLabel,
            menuItems: context.args.menuItems,
            onTaskAdd: context.args.onTaskAdd,
            onTaskClick: context.args.onTaskClick,
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

      const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), [StageNodeWrapper]);
      const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);
      const defaultEdgeOptions = useMemo(() => ({ type: 'stage' }), []);

      return (
        <div style={{ width: '100vw', height: '100vh' }}>
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
                <CanvasPositionControls translations={DefaultCanvasTranslations} />
              </Panel>
            </BaseCanvas>
          </ReactFlowProvider>
        </div>
      );
    },
  ],
  args: {
    stageDetails: {
      label: 'Default Stage',
      tasks: [],
    },
  },
  argTypes: {
    addTaskLabel: {
      control: 'text',
      description: 'Label for the add process button',
      defaultValue: 'Add process',
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
  [{ id: 'liability_check', label: 'Liability Check', icon: <VerificationIcon /> }],
  [{ id: 'credit_review', label: 'Credit Review', icon: <DocumentIcon /> }],
  // Parallel tasks - these run at the same time
  [
    {
      id: 'address_verification',
      label: 'Address Verification and a really long label that might wrap',
      icon: <VerificationIcon />,
    },
    { id: 'property_verification', label: 'Property Verification', icon: <VerificationIcon /> },
  ],
  [{ id: 'processing_review', label: 'Processing Review', icon: <ProcessIcon /> }],
];

export const Default: Story = {
  name: 'Default',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Application',
            tasks: [],
          },
          execution: {
            stageStatus: {
              duration: 'SLA: None',
            },
          },
          onTaskAdd: () => {
            window.alert('Add task functionality - this would open a dialog to add a new task');
          },
        },
      },
      {
        id: '1',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Processing with a really really really long label that might wrap',
            tasks: sampleTasks,
            sla: '1h',
            slaBreached: false,
            escalation: '1h',
            escalationsTriggered: false,
          },
          execution: {
            stageStatus: {
              duration: 'SLA: None',
            },
          },
          onAddTaskFromToolbox: (taskItem: ListItem) => {
            window.alert(
              `Add task (${taskItem.data.type}) - this would open a panel to configure the new task`
            );
          },
          taskOptions: sampleTasks.flat().map((task) => ({
            id: task.id,
            name: task.label,
            icon: { Component: () => task.icon },
            data: { type: task.id },
          })),
        },
      },
    ],
  },
  args: {},
};

export const WithTaskIcons: Story = {
  name: 'With Task Icons',
  parameters: {
    nodes: [
      {
        id: '1',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Task Icons Demo',
            tasks: [
              [
                {
                  id: 'human-task',
                  label: 'Human in the Loop',
                  icon: <TaskIcon type={TaskItemTypeValues.User} size="sm" />,
                },
              ],
              [
                {
                  id: 'agent-task',
                  label: 'Agent Task',
                  icon: <TaskIcon type={TaskItemTypeValues.Agent} size="sm" />,
                },
                {
                  id: 'external-agent-task',
                  label: 'External Agent',
                  icon: <TaskIcon type={TaskItemTypeValues.ExternalAgent} size="sm" />,
                },
              ],
              [
                {
                  id: 'rpa-task',
                  label: 'RPA Automation',
                  icon: <TaskIcon type={TaskItemTypeValues.Automation} size="sm" />,
                },
                {
                  id: 'api-task',
                  label: 'API Automation',
                  icon: <TaskIcon type={TaskItemTypeValues.ApiAutomation} size="sm" />,
                },
              ],
              [
                {
                  id: 'process-task',
                  label: 'Agentic Process',
                  icon: <TaskIcon type={TaskItemTypeValues.AgenticProcess} size="sm" />,
                },
                {
                  id: 'connector-task',
                  label: 'Connector',
                  icon: <TaskIcon type={TaskItemTypeValues.Connector} size="sm" />,
                },
              ],
              [
                {
                  id: 'timer-task',
                  label: 'Timer',
                  icon: <TaskIcon type={TaskItemTypeValues.Timer} size="sm" />,
                },
              ],
            ],
          },
        },
      },
    ],
  },
  args: {},
};

export const ExecutionStatus: Story = {
  name: 'Execution Status',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            sla: '1h',
            slaBreached: false,
            escalation: '1h',
            escalationsTriggered: false,
            label: 'Application',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'KYC and AML Checks', icon: <VerificationIcon /> }],
              [
                {
                  id: '2',
                  label: 'Document Verification is going to be very very really long',
                  icon: <DocumentIcon />,
                },
              ],
            ],
          },
          execution: {
            stageStatus: {
              status: 'Completed',
              duration: 'SLA: 4h',
            },
            taskStatus: {
              '1': { status: 'Completed', label: 'KYC and AML Checks', duration: '2h 15m' },
              '2': { status: 'Completed', label: 'Document Verification', duration: '1h 45m' },
            },
          },
        },
      },
      {
        id: '1',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            sla: '1h',
            slaBreached: true,
            escalation: '1h',
            escalationsTriggered: true,
            label: 'Processing',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Liability Check', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Credit Review', icon: <DocumentIcon /> }],
              [
                { id: '3', label: 'Address Verification', icon: <VerificationIcon /> },
                { id: '4', label: 'Property Verification', icon: <VerificationIcon /> },
              ],
              [{ id: '5', label: 'Processing Review', icon: <ProcessIcon /> }],
            ],
            selectedTasks: ['2'],
          },
          execution: {
            stageStatus: {
              status: 'Completed',
              duration: 'SLA: 6h 15m',
            },
            taskStatus: {
              '1': {
                status: 'Completed',
                label: 'Liability Check',
                duration: '1h 30m',
                retryDuration: '25m',
                badge: 'Reworked',
                badgeStatus: 'error',
                retryCount: 2,
              },
              '2': {
                status: 'Completed',
                label: 'Credit Review',
                duration: '1h 30m',
                retryDuration: '32m',
                badge: 'Reworked',
                retryCount: 1,
              },
              '3': { status: 'Completed', label: 'Address Verification', duration: '30m' },
              '4': {
                status: 'Completed',
                label: 'Property Verification',
                duration: '1h 30m',
                retryDuration: '1h 5m',
                badge: 'Reworked',
                retryCount: 3,
              },
              '5': { status: 'Completed', label: 'Processing Review', duration: '1h 15m' },
            },
          },
        },
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Underwriting',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Report Ordering', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'Underwriting Verification', icon: <VerificationIcon /> }],
            ],
          },
          onTaskClick: (id: string) => window.alert(`Task clicked: ${id}`),
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              duration: 'SLA: 2h 15m',
            },
            taskStatus: {
              '1': { status: 'Completed', label: 'Report Ordering', duration: '2h 15m' },
              '2': { status: 'InProgress', label: 'Underwriting Verification' },
            },
          },
        },
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 1104, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Closing',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Loan Packet Creation', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'Customer Signing', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'NotExecuted',
              label: 'Not started',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: '4',
        type: 'stage',
        position: { x: 1104, y: 400 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Rejected',
            isException: true,
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Customer Notification', icon: <ProcessIcon /> }],
              [{ id: '2', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'NotExecuted',
              label: 'Not started',
            },
            taskStatus: {},
          },
        },
      },
    ],
    edges: [
      {
        id: 'e1',
        type: 'stage',
        source: '0',
        sourceHandle: '0____source____right',
        target: '1',
        targetHandle: '1____target____left',
      },
      {
        id: 'e2',
        type: 'stage',
        source: '1',
        sourceHandle: '1____source____right',
        target: '2',
        targetHandle: '2____target____left',
      },
      {
        id: 'e3',
        type: 'stage',
        source: '2',
        sourceHandle: '2____source____right',
        target: '3',
        targetHandle: '3____target____left',
      },
    ] as Edge[],
  },
  args: {},
};

export const InteractiveTaskManagement: Story = {
  name: 'Interactive Task Management',
  parameters: {
    nodes: [
      {
        id: 'design-stage',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: 352,
        data: {
          stageDetails: {
            label: 'Design Mode - Editable',
            tasks: [
              [{ id: '1', label: 'Initial Task', icon: <VerificationIcon /> }],
              [
                {
                  id: '2',
                  label:
                    'Credit Review with a very long label that will be truncated and show tooltip',
                  icon: <DocumentIcon />,
                },
              ],
              [
                { id: '3', label: 'Address Verification', icon: <VerificationIcon /> },
                {
                  id: '4',
                  label: 'Property Verification with Long Name',
                  icon: <VerificationIcon />,
                },
                { id: '5', label: 'Background Check', icon: <ProcessIcon /> },
              ],
              [
                {
                  id: '6',
                  label: 'Final Review Task with Extended Description',
                  icon: <ProcessIcon />,
                },
              ],
            ],
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
          onTaskRemove: (groupIndex: number, taskIndex: number) => {
            window.alert(
              `Task removal requested!\nGroup: ${groupIndex}\nTask: ${taskIndex}\n\nIn a real app, this would remove the task from the data.`
            );
          },
          onTaskAdd: () => {
            window.alert('Add task functionality - this would open a dialog to add a new task');
          },
        },
      },
      {
        id: 'execution-stage',
        type: 'stage',
        position: { x: 448, y: 96 },
        width: 352,
        data: {
          stageDetails: {
            label: 'Execution Mode - Read Only',
            isReadOnly: true,
            tasks: [
              [
                {
                  id: '1',
                  label: 'Task with execution status and very long name that will be truncated',
                  icon: <VerificationIcon />,
                },
              ],
              [{ id: '2', label: 'Credit Review Processing', icon: <DocumentIcon /> }],
              [
                {
                  id: '3',
                  label: 'Parallel Address Verification Task',
                  icon: <VerificationIcon />,
                },
                {
                  id: '4',
                  label: 'Parallel Property Verification with Extended Name',
                  icon: <VerificationIcon />,
                },
              ],
              [{ id: '5', label: 'Final Review and Approval Process', icon: <ProcessIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              duration: '2h 15m',
            },
            taskStatus: {
              '1': {
                status: 'Completed',
                duration: '30m',
                badge: 'Completed',
                badgeStatus: 'info',
              },
              '2': {
                status: 'InProgress',
                duration: '1h 15m',
                retryDuration: '15m',
                badge: 'Retry',
                badgeStatus: 'warning',
                retryCount: 2,
              },
              '3': { status: 'Completed', duration: '45m' },
              '4': {
                status: 'Failed',
                duration: '20m',
                retryDuration: '10m',
                badge: 'Error',
                badgeStatus: 'error',
                retryCount: 1,
              },
              '5': { status: 'NotExecuted' },
            },
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId} (execution mode - read only)`);
          },
        },
      },
    ],
  },
  args: {},
};

export const LoanProcessingWorkflow: Story = {
  name: 'Loan Processing Workflow',
  parameters: {
    nodes: [
      // Application Stage
      {
        id: 'application',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Application',
            tasks: [
              [{ id: '1', label: 'KYC and AML Checks', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Document Verification', icon: <DocumentIcon /> }],
            ],
            selectedTasks: ['1'],
          },
        },
      },
      // Processing Stage
      {
        id: 'processing',
        type: 'stage',
        position: { x: 448, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Processing',
            tasks: [
              [{ id: '1', label: 'Liability Check', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Credit Review', icon: <DocumentIcon /> }],
              [
                { id: '3', label: 'Address Verification', icon: <VerificationIcon /> },
                { id: '4', label: 'Property Verification', icon: <VerificationIcon /> },
              ],
              [{ id: '5', label: 'Processing Review', icon: <ProcessIcon /> }],
            ],
            selectedTasks: ['4'],
          },
        },
      },
      // Underwriting Stage
      {
        id: 'underwriting',
        type: 'stage',
        position: { x: 848, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Underwriting',
            tasks: [
              [{ id: '1', label: 'Report Ordering', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'Underwriting Verification', icon: <VerificationIcon /> }],
            ],
          },
        },
      },
      // Closing Stage
      {
        id: 'closing',
        type: 'stage',
        position: { x: 1248, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Closing',
            tasks: [
              [{ id: '1', label: 'Loan Packet Creation', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'Customer Signing', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Funding Stage
      {
        id: 'funding',
        type: 'stage',
        position: { x: 1648, y: 96 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Funding',
            tasks: [
              [{ id: '1', label: 'Disperse Loan', icon: <ProcessIcon /> }],
              [{ id: '2', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Rejected Stage
      {
        id: 'rejected',
        type: 'stage',
        position: { x: 1248, y: 400 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Rejected',
            isException: true,
            tasks: [
              [{ id: '1', label: 'Customer Notification', icon: <ProcessIcon /> }],
              [{ id: '2', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
        },
      },
      // Withdrawn Stage
      {
        id: 'withdrawn',
        type: 'stage',
        position: { x: 448, y: 608 },
        width: 304,
        data: {
          stageDetails: {
            label: 'Withdrawn',
            isException: true,
            tasks: [
              [{ id: '1', label: 'Customer Notification', icon: <ProcessIcon /> }],
              [{ id: '2', label: 'Generate Audit Report', icon: <DocumentIcon /> }],
            ],
          },
        },
      },
    ],
    edges: [
      // Main flow
      {
        id: 'e1',
        type: 'stage',
        source: 'application',
        sourceHandle: 'application____source____right',
        target: 'processing',
        targetHandle: 'processing____target____left',
      },
      {
        id: 'e2',
        type: 'stage',
        source: 'processing',
        sourceHandle: 'processing____source____right',
        target: 'underwriting',
        targetHandle: 'underwriting____target____left',
      },
      {
        id: 'e3',
        type: 'stage',
        source: 'underwriting',
        sourceHandle: 'underwriting____source____right',
        target: 'closing',
        targetHandle: 'closing____target____left',
      },
      {
        id: 'e4',
        type: 'stage',
        source: 'closing',
        sourceHandle: 'closing____source____right',
        target: 'funding',
        targetHandle: 'funding____target____left',
      },
    ] as Edge[],
  },
  args: {} as any, // No args needed as we're using parameters
};

const initialTasks: StageTaskItem[][] = [
  [{ id: 'task-1', label: 'KYC Verification', icon: <VerificationIcon /> }],
  [
    { id: 'task-2', label: 'Document Review', icon: <DocumentIcon /> },
    { id: 'task-6', label: 'Credit Check', icon: <VerificationIcon /> },
  ],
  [
    { id: 'task-3', label: 'Address Check', icon: <VerificationIcon /> },
    { id: 'task-4', label: 'Property Check', icon: <VerificationIcon /> },
  ],
  [{ id: 'task-5', label: 'Final Approval', icon: <ProcessIcon /> }],
];

const DraggableTaskReorderingStory = () => {
  const StageNodeWrapper = useMemo(
    () =>
      function StageNodeWrapperComponent(props: any) {
        return <StageNode {...props} {...props.data} />;
      },
    []
  );

  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), [StageNodeWrapper]);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'reorder-stage',
      type: 'stage',
      position: { x: 320, y: 96 },
      data: {
        stageDetails: {
          label: 'Drag to Reorder Tasks',
          tasks: initialTasks,
        },
        onTaskClick: (taskId: string) => console.log('Task clicked:', taskId),
      },
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleTaskReorder = useCallback(
    (reorderedTasks: StageTaskItem[][]) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'reorder-stage'
            ? {
                ...node,
                data: {
                  ...node.data,
                  stageDetails: {
                    ...node.data.stageDetails,
                    tasks: reorderedTasks,
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const nodesWithHandler = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onTaskReorder: handleTaskReorder,
        },
      })),
    [nodes, handleTaskReorder]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodesWithHandler}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

export const DraggableTaskReordering: Story = {
  name: 'Draggable Task Reordering',
  parameters: {
    useCustomRender: true,
  },
  render: () => <DraggableTaskReorderingStory />,
  args: {},
};

const initialTasksForAddReplace: StageTaskItem[][] = [
  [{ id: 'task-1', label: 'Initial Verification', icon: <VerificationIcon /> }],
  [{ id: 'task-2', label: 'Document Review', icon: <DocumentIcon /> }],
];

const availableTaskOptions: ListItem[] = [
  {
    id: 'verification-task',
    name: 'Verification task',
    icon: { Component: () => <VerificationIcon /> },
    data: { type: 'verification' },
  },
  {
    id: 'document-task',
    name: 'Document task',
    icon: { Component: () => <DocumentIcon /> },
    data: { type: 'document' },
  },
  {
    id: 'process-task',
    name: 'Process task',
    icon: { Component: () => <ProcessIcon /> },
    data: { type: 'process' },
  },
  {
    id: 'credit-check',
    name: 'Credit check',
    icon: { Component: () => <VerificationIcon /> },
    data: { type: 'credit' },
  },
  {
    id: 'address-verification',
    name: 'Address verification',
    icon: { Component: () => <VerificationIcon /> },
    data: { type: 'address' },
  },
];

const AddAndReplaceTasksStory = () => {
  const StageNodeWrapper = useMemo(
    () =>
      function StageNodeWrapperComponent(props: any) {
        return <StageNode {...props} {...props.data} />;
      },
    []
  );

  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), [StageNodeWrapper]);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const [tasks, setTasks] = useState<StageTaskItem[][]>(initialTasksForAddReplace);

  const handleAddTask = useCallback((taskItem: ListItem) => {
    const newTask: StageTaskItem = {
      id: `${taskItem.id}-${Date.now()}`,
      label: taskItem.name,
      icon: taskItem.icon?.Component ? <taskItem.icon.Component /> : undefined,
    };

    setTasks((prevTasks: StageTaskItem[][]) => {
      return [...prevTasks, [newTask]];
    });
  }, []);

  const handleReplaceTask = useCallback(
    (taskItem: StageTaskItem, groupIndex: number, taskIndex: number) => {
      // Validate indices
      if (groupIndex < 0 || taskIndex < 0) {
        return;
      }

      // The component passes a ListItem cast as StageTaskItem, so convert it properly
      const listItem = taskItem as unknown as ListItem;
      const replacedTask: StageTaskItem = {
        id: `${listItem.id}-replaced-${Date.now()}`,
        label: listItem.name,
        icon: listItem.icon?.Component ? <listItem.icon.Component /> : undefined,
      };

      setTasks((prevTasks: StageTaskItem[][]) => {
        // Validate that indices are within bounds
        if (groupIndex >= prevTasks.length) {
          return prevTasks;
        }

        const currentGroup = prevTasks[groupIndex];
        if (!currentGroup || taskIndex >= currentGroup.length) {
          return prevTasks;
        }

        const updatedTasks = prevTasks.map((group: StageTaskItem[], gIdx: number) => {
          if (gIdx === groupIndex) {
            return group.map((task: StageTaskItem, tIdx: number) =>
              tIdx === taskIndex ? replacedTask : task
            );
          }
          return group;
        });

        return updatedTasks;
      });
    },
    [setTasks]
  );

  const groupModificationHandlers = useMemo(
    () => createGroupModificationHandlers<StageTaskItem>(),
    []
  );

  const handleTaskGroupModification = useCallback(
    (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => {
      const handler = getHandlerForModificationType(
        groupModificationHandlers,
        groupModificationType
      );
      // Handler returns modified array, we update state with it
      setTasks((prevTasks) => handler(prevTasks, groupIndex, taskIndex));
    },
    [groupModificationHandlers, setTasks]
  );

  const nodes = useMemo(
    () => [
      {
        id: 'add-replace-stage',
        type: 'stage',
        position: { x: 320, y: 96 },
        data: {
          stageDetails: {
            label: 'Add, Replace, and Group Tasks',
            tasks: tasks,
          },
          taskOptions: availableTaskOptions,
          onAddTaskFromToolbox: handleAddTask,
          onTaskReplace: handleReplaceTask,
          onTaskGroupModification: handleTaskGroupModification,
        },
      },
    ],
    [tasks, handleAddTask, handleReplaceTask, handleTaskGroupModification]
  );

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync nodes when tasks change
  useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodesState}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        >
          <Panel position="bottom-right">
            <CanvasPositionControls translations={DefaultCanvasTranslations} />
          </Panel>
        </BaseCanvas>
      </ReactFlowProvider>
    </div>
  );
};

export const AddAndReplaceTasks: Story = {
  name: 'Add, Replace, and Group Tasks',
  parameters: {
    useCustomRender: true,
  },
  render: () => <AddAndReplaceTasksStory />,
  args: {},
};
