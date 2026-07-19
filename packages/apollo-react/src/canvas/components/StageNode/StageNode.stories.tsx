import type { Meta, StoryObj } from '@storybook/react';
import type { Connection, Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  addEdge,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultCanvasTranslations } from '../../types';
import {
  createGroupModificationHandlers,
  type GroupModificationType,
  getHandlerForModificationType,
} from '../../utils/GroupModificationUtils';
import { BaseCanvas } from '../BaseCanvas';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import type { ListItem } from '../Toolbox';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';
import { StageNode } from './StageNode';
import { StageNodeWrapper } from './StageNode.stories.utils';
import { StageHeaderChipType, type StageNodeProps, type StageTaskItem } from './StageNode.types';

// Default stage width used by the Maestro (PO.Frontend) case-management canvas.
// Kept in sync with the product's stage width so these stories render stages at
// their real production size.
const DEFAULT_STAGE_WIDTH = 336;

const DefaultCanvasDecorator = ({
  initialNodes,
  initialEdges = [],
}: {
  initialNodes: Node[];
  initialEdges?: Edge[];
}) => {
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
};

const meta: Meta<StageNodeProps> = {
  title: 'Components/Nodes/StageNode',
  component: StageNode,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      if (context.parameters?.useCustomRender) {
        return <Story />;
      }

      const initialNodes = context.parameters?.nodes || [
        {
          id: '1',
          type: 'stage',
          position: { x: 250, y: 100 },
          data: {
            stageDetails: context.args.stageDetails,
            execution: context.args.execution,
            menuItems: context.args.menuItems,
            onTaskAdd: context.args.onTaskAdd,
            onTaskClick: context.args.onTaskClick,
          },
        },
      ];

      const initialEdges = context.parameters?.edges || [];

      return <DefaultCanvasDecorator initialNodes={initialNodes} initialEdges={initialEdges} />;
    },
  ],
  args: {
    stageDetails: {
      label: 'Default Stage',
      tasks: [],
    },
  },
};

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
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
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
      isRequired: true,
    },
    { id: 'property_verification', label: 'Property Verification', icon: <VerificationIcon /> },
  ],
  [
    {
      id: 'processing_review',
      label: 'Processing Review',
      icon: <ProcessIcon />,
      isRequired: true,
    },
  ],
];

export const Default: Story = {
  name: 'Default',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Application',
            tasks: [],
          },
          execution: {
            stageStatus: {
              slaText: 'SLA: None',
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
        width: DEFAULT_STAGE_WIDTH,
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
              slaText: 'SLA: None',
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
      {
        id: '2',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          onReplaceTaskFromToolbox: () => {},
          onStatusClick: () => {
            window.alert('Status icon clicked - this would navigate to the validation issue');
          },
          stageDetails: {
            label: 'Validation - Failed',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Data Validation', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Compliance Check', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              label: 'error message',
              status: 'Failed',
            },
            taskStatus: {
              '2': {
                status: 'Failed',
                message: 'Compliance requirements not met',
              },
            },
          },
        },
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 1104, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          onStatusClick: () => {
            window.alert('Status icon clicked - this would navigate to the validation issue');
          },
          stageDetails: {
            label: 'Review - Warning',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Risk Assessment', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Policy Review', icon: <DocumentIcon />, isRequired: true }],
              [
                {
                  id: '3',
                  label:
                    'Final task with a long task string, really it is so long that it should cut off',
                  icon: <DocumentIcon />,
                  isRequired: true,
                },
              ],
            ],
          },
          execution: {
            stageStatus: {
              label: 'Needs attention',
              status: 'Warning',
            },
            taskStatus: {
              '2': {
                status: 'Warning',
                message: 'Policy review requires manual intervention',
              },
              '3': {
                status: 'Warning',
                message: 'Warning message',
              },
            },
          },
        },
      },
    ],
  },
};

export const WithTaskIcons: Story = {
  name: 'With Task Icons',
  parameters: {
    nodes: [
      {
        id: '1',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
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
};

export const ExecutionStatus: Story = {
  name: 'Execution Status',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
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
                  isRequired: true,
                },
              ],
            ],
          },
          execution: {
            stageStatus: {
              status: 'Completed',
              slaText: 'SLA: 4h',
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
        width: DEFAULT_STAGE_WIDTH,
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
              slaText: 'SLA: 6h 15m',
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
        width: DEFAULT_STAGE_WIDTH,
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
              slaText: 'SLA: 2h 15m',
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
};

export const SLAStates: Story = {
  name: 'SLA States',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Stage 1',
            isReadOnly: true,
            tasks: [],
          },
          execution: {
            stageStatus: {
              slaText: 'SLA: None',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: '1',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Closing',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 10 days remaining',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Closing',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 1 day remaining',
              slaIcon: 'warning',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 1104, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Closing',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 1 day overdue',
              slaIcon: 'error',
            },
            taskStatus: {},
          },
        },
      },
    ],
  },
};

export const InteractiveTaskManagement: Story = {
  name: 'Interactive Task Management',
  parameters: {
    nodes: [
      {
        id: 'design-stage',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
                durationTooltip: '45m remaining',
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
};

export const ExecutionModeWithSla: Story = {
  name: 'Execution Mode - Runtime vs SLA',
  parameters: {
    nodes: [
      {
        id: 'exec-runtime-only',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Runtime only',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              duration: 'Duration: 2h 15m',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: 'exec-sla-only',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'SLA only',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 1 day remaining',
              slaIcon: 'warning',
            },
            taskStatus: {},
          },
        },
      },
      {
        id: 'exec-runtime-and-sla',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Runtime + SLA (both)',
            isReadOnly: true,
            tasks: [
              [{ id: '1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: '2', label: 'eSign envelope', icon: <DocumentIcon /> }],
              [{ id: '3', label: 'Review closing docs', icon: <DocumentIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              duration: 'Duration: 2h 15m',
              slaText: 'SLA: 1 day remaining',
              slaIcon: 'warning',
            },
            taskStatus: {},
          },
        },
      },
    ],
  },
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
        width: DEFAULT_STAGE_WIDTH,
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
};

const initialTasks: StageTaskItem[][] = [
  [{ id: 'task-1', label: 'KYC Verification', icon: <VerificationIcon /> }],
  [
    { id: 'task-2', label: 'Document Review', icon: <DocumentIcon /> },
    { id: 'task-6', label: 'Credit Check', icon: <VerificationIcon /> },
  ],
  [{ id: 'task-7', label: 'Ad hoc - Manual Review', icon: <DocumentIcon />, isAdhoc: true }],
  [
    { id: 'task-3', label: 'Address Check', icon: <VerificationIcon /> },
    { id: 'task-4', label: 'Property Check', icon: <VerificationIcon /> },
  ],
  [{ id: 'task-8', label: 'Ad hoc - Exception Handling', icon: <ProcessIcon />, isAdhoc: true }],
  [{ id: 'task-5', label: 'Final Approval', icon: <ProcessIcon /> }],
];

const DraggableTaskReorderingStory = () => {
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
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

      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'reorder-stage'
            ? {
                ...node,
                data: {
                  ...node.data,
                  stageDetails: {
                    ...node.data.stageDetails,
                    tasks: handler(node.data.stageDetails.tasks, groupIndex, taskIndex),
                  },
                },
              }
            : node
        )
      );
    },
    [groupModificationHandlers, setNodes]
  );

  const nodesWithHandler = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onTaskReorder: handleTaskReorder,
          onTaskGroupModification: handleTaskGroupModification,
        },
      })),
    [nodes, handleTaskReorder, handleTaskGroupModification]
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
};

const initialTasksForAddReplace: StageTaskItem[][] = [
  [{ id: 'task-1', label: 'Initial Verification', icon: <VerificationIcon /> }],
  [
    {
      id: 'task-adhoc-1',
      label: 'Ad hoc - Manual Check',
      icon: <VerificationIcon />,
      isAdhoc: true,
    },
  ],
  [{ id: 'task-2', label: 'Document Review', icon: <DocumentIcon /> }],
  [{ id: 'task-3', label: 'Process Validation', icon: <ProcessIcon /> }],
  [
    {
      id: 'task-with-custom-action',
      label: 'Task with Custom Menu Action',
      icon: <ProcessIcon />,
    },
  ],
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
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const [pendingReplaceTask, setPendingReplaceTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);

  const [nodesState, setNodes, onNodesChange] = useNodesState([
    {
      id: 'add-replace-stage',
      type: 'stage',
      position: { x: 320, y: 96 },
      data: {
        stageDetails: {
          label: 'Add, Replace, and Group Tasks',
          isReadOnly: false,
          tasks: initialTasksForAddReplace,
        },
        taskOptions: availableTaskOptions,
      },
    },
    {
      id: 'readonly-stage',
      type: 'stage',
      position: { x: 720, y: 96 },
      data: {
        stageDetails: {
          label: 'ReadOnly Stage',
          isReadOnly: true,
          tasks: initialTasksForAddReplace,
        },
        taskOptions: availableTaskOptions,
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleAddTask = useCallback(
    (taskItem: ListItem) => {
      const newTask: StageTaskItem = {
        id: `${taskItem.id}-${Date.now()}`,
        label: taskItem.name,
        icon: taskItem.icon?.Component ? <taskItem.icon.Component /> : undefined,
      };

      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === 'add-replace-stage'
            ? {
                ...node,
                data: {
                  ...node.data,
                  stageDetails: {
                    ...node.data.stageDetails,
                    tasks: [...node.data.stageDetails.tasks, [newTask]],
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

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

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== 'add-replace-stage') {
            return node;
          }

          const prevTasks = node.data.stageDetails.tasks;

          // Validate that indices are within bounds
          if (groupIndex >= prevTasks.length) {
            return node;
          }

          const currentGroup = prevTasks[groupIndex];
          if (!currentGroup || taskIndex >= currentGroup.length) {
            return node;
          }

          const updatedTasks = prevTasks.map((group: StageTaskItem[], gIdx: number) => {
            if (gIdx === groupIndex) {
              return group.map((task: StageTaskItem, tIdx: number) =>
                tIdx === taskIndex ? replacedTask : task
              );
            }
            return group;
          });

          return {
            ...node,
            data: {
              ...node.data,
              stageDetails: {
                ...node.data.stageDetails,
                tasks: updatedTasks,
              },
            },
          };
        })
      );

      setPendingReplaceTask(false);
      setSelectedTaskId(undefined);
    },
    [setNodes]
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

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== 'add-replace-stage') {
            return node;
          }

          const prevTasks = node.data.stageDetails.tasks;
          const updatedTasks = handler(prevTasks, groupIndex, taskIndex);

          return {
            ...node,
            data: {
              ...node.data,
              stageDetails: {
                ...node.data.stageDetails,
                tasks: updatedTasks,
              },
            },
          };
        })
      );
    },
    [groupModificationHandlers, setNodes]
  );

  const handleTaskReorder = useCallback(
    (reorderedTasks: StageTaskItem[][]) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === 'add-replace-stage'
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

  // Handle task click in canvas (for selection)
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  // Clear task selection when clicking on the canvas background
  const handlePaneClick = useCallback(() => {
    setSelectedTaskId(undefined);
    setPendingReplaceTask(false);
  }, []);

  // Clear replace state when the node is deselected (e.g., clicking on canvas)
  const handleNodesChange = useCallback(
    (...args: Parameters<typeof onNodesChange>) => {
      onNodesChange(...args);
      const deselected = args[0].some(
        (c) => c.type === 'select' && c.id === 'add-replace-stage' && !c.selected
      );
      if (deselected) {
        setPendingReplaceTask(false);
        setSelectedTaskId(undefined);
      }
    },
    [onNodesChange]
  );

  // Get current tasks from node state for menu items
  const currentTasks =
    nodesState.find((n) => n.id === 'add-replace-stage')?.data.stageDetails.tasks || [];

  // Create menu items for task selection
  const taskMenuItems = useMemo(() => {
    return currentTasks.flatMap((group) =>
      group.map((task) => ({
        id: task.id,
        label: task.label,
        icon: task.icon,
        onSelect: () => {
          setSelectedTaskId(task.id);
          setPendingReplaceTask(true);
          setMenuOpen(false);
        },
      }))
    );
  }, [currentTasks]);

  // Update node data with pendingReplaceTask and selectedTaskId
  const nodesWithMetadata = useMemo(
    () =>
      nodesState.map((node) =>
        node.id === 'add-replace-stage'
          ? {
              ...node,
              data: {
                ...node.data,
                ...(selectedTaskId && { pendingReplaceTask }),
                stageDetails: {
                  ...node.data.stageDetails,
                  selectedTaskId,
                },
                onAddTaskFromToolbox: handleAddTask,
                onReplaceTaskFromToolbox: handleReplaceTask,
                onTaskGroupModification: handleTaskGroupModification,
                onTaskReorder: handleTaskReorder,
                onTaskClick: handleTaskClick,
                getTaskContextMenuItems: ({ task }: { task: StageTaskItem }) =>
                  task.id === 'task-with-custom-action'
                    ? [
                        {
                          id: 'go-to-definition',
                          label: 'Go to definition',
                          onClick: () => alert(`Go to definition clicked for task: ${task.id}`),
                        },
                      ]
                    : undefined,
              },
            }
          : node
      ),
    [
      nodesState,
      pendingReplaceTask,
      selectedTaskId,
      handleAddTask,
      handleReplaceTask,
      handleTaskGroupModification,
      handleTaskReorder,
      handleTaskClick,
    ]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Compute button label based on whether a task is being replaced
  const replaceButtonLabel = useMemo(() => {
    if (pendingReplaceTask && selectedTaskId) {
      const taskBeingReplaced = currentTasks.flat().find((t) => t.id === selectedTaskId);
      if (taskBeingReplaced) {
        return `Replacing Task: ${taskBeingReplaced.label}`;
      }
    }
    return 'Replace Task';
  }, [pendingReplaceTask, selectedTaskId, currentTasks]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <BaseCanvas
          nodes={nodesWithMetadata}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          mode="design"
          connectionMode={ConnectionMode.Strict}
          defaultEdgeOptions={{ type: 'stage' }}
          connectionLineComponent={StageConnectionEdge}
          elevateEdgesOnSelect
          defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        >
          <Panel position="top-right">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm">{replaceButtonLabel}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                {taskMenuItems.map((item) => (
                  <DropdownMenuItem key={item.id} onSelect={item.onSelect}>
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Panel>
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
};

const InlineTitleEditStory = () => {
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);

  const setNodesRef = useRef<React.Dispatch<React.SetStateAction<Node[]>>>(null!);

  const createTitleChangeHandler = useCallback(
    (nodeId: string) => (newTitle: string) => {
      setNodesRef.current((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  stageDetails: {
                    ...(node.data.stageDetails as Record<string, unknown>),
                    label: newTitle,
                  },
                },
              }
            : node
        )
      );
    },
    []
  );

  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: 'editable-stage',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Click to Edit Title',
            tasks: [
              [{ id: '1', label: 'KYC Verification', icon: <VerificationIcon /> }],
              [{ id: '2', label: 'Document Review', icon: <DocumentIcon /> }],
            ],
          },
          onTaskAdd: () => {
            window.alert('Add task functionality - this would open a dialog to add a new task');
          },
          onStageTitleChange: createTitleChangeHandler('editable-stage'),
        },
      },
      {
        id: 'long-title-stage',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'A Very Long Stage Title That Should Truncate With Ellipsis',
            tasks: [[{ id: '1', label: 'Processing Task', icon: <ProcessIcon /> }]],
          },
          onTaskAdd: () => {
            window.alert('Add task functionality - this would open a dialog to add a new task');
          },
          onStageTitleChange: createTitleChangeHandler('long-title-stage'),
        },
      },
    ],
    [createTitleChangeHandler]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  setNodesRef.current = setNodes;

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

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

export const EditableStageTitle: Story = {
  name: 'Editable Stage Title',
  parameters: {
    useCustomRender: true,
  },
  render: () => <InlineTitleEditStory />,
};

// Simulate async children fetch (2s delay)
const fetchChildren = (id: string): Promise<ListItem[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: `${id}-sub-1`, name: `${id} - Subtask A`, data: { type: `${id}-a` } },
        { id: `${id}-sub-2`, name: `${id} - Subtask B`, data: { type: `${id}-b` } },
        { id: `${id}-sub-3`, name: `${id} - Subtask C`, data: { type: `${id}-c` } },
      ]);
    }, 2000);
  });

// Top-level items with async children — level 2 loading is handled by Toolbox internally
const loadedTaskOptionsWithChildren: ListItem[] = [
  { id: 'email', name: 'Email', data: { type: 'email' }, children: (id) => fetchChildren(id) },
  {
    id: 'approval',
    name: 'Approval',
    data: { type: 'approval' },
    children: (id) => fetchChildren(id),
  },
  { id: 'script', name: 'Script', data: { type: 'script' }, children: (id) => fetchChildren(id) },
];

const AddTaskLoadingStory = () => {
  const nodeTypes = useMemo(() => ({ stage: StageNodeWrapper }), []);
  const edgeTypes = useMemo(() => ({ stage: StageEdge }), []);
  const setNodesRef = useRef<React.Dispatch<React.SetStateAction<Node[]>>>(null!);

  // Inject per-node handlers — simulates loading state on add-task:
  // 1. Set loadingTaskIds with a placeholder ID so the + button is disabled
  // 2. After 2s, clear loadingTaskIds to re-enable it
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleAddTaskFromToolbox = useCallback((nodeId: string, taskItem: ListItem) => {
    clearTimeout(timeoutRef.current);
    const newTaskId = `task-${Date.now()}`;
    // Add the task to the stage and mark it as loading
    setNodesRef.current((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const data = n.data as Record<string, any>;
        const currentTasks: StageTaskItem[][] = data.stageDetails?.tasks ?? [];
        const newTask: StageTaskItem = { id: newTaskId, label: taskItem.name };
        const currentExecution = data.execution ?? {
          stageStatus: { status: undefined },
          taskStatus: {},
        };
        return {
          ...n,
          data: {
            ...data,
            stageDetails: { ...data.stageDetails, tasks: [...currentTasks, [newTask]] },
            loadingTaskIds: new Set([...((data.loadingTaskIds as Set<string>) ?? []), newTaskId]),
            execution: {
              ...currentExecution,
              taskStatus: { ...currentExecution.taskStatus, [newTaskId]: { status: 'InProgress' } },
            },
          },
        };
      })
    );
    // After 2s, clear loading state and execution status
    timeoutRef.current = setTimeout(() => {
      setNodesRef.current((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const data = n.data as Record<string, any>;
          const { [newTaskId]: _, ...remainingTaskStatus } = data.execution?.taskStatus ?? {};
          return {
            ...n,
            data: {
              ...data,
              loadingTaskIds: new Set(),
              execution: {
                ...data.execution,
                taskStatus: remainingTaskStatus,
              },
            },
          };
        })
      );
    }, 2000);
  }, []);

  const handleTaskReorder = useCallback((nodeId: string, reorderedTasks: StageTaskItem[][]) => {
    setNodesRef.current((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                stageDetails: {
                  ...(n.data as Record<string, any>).stageDetails,
                  tasks: reorderedTasks,
                },
              },
            }
          : n
      )
    );
  }, []);

  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: 'loading-stage-empty',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Loading (+ disabled for 3s)',
            tasks: [],
          },
          loadingTaskIds: new Set(['loading-task']),
          taskOptions: [] as ListItem[],
          onAddTaskFromToolbox: (taskItem: ListItem) => {
            handleAddTaskFromToolbox('loading-stage-empty', taskItem);
          },
          onTaskReorder: (reorderedTasks: StageTaskItem[][]) => {
            handleTaskReorder('loading-stage-empty', reorderedTasks);
          },
          onTaskGroupModification: () => {},
        },
      },
      {
        id: 'loading-stage-children',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Async children (click +)',
            tasks: [[{ id: 'task-1', label: 'Existing Task', icon: <VerificationIcon /> }]],
          },
          loadingTaskIds: new Set(),
          taskOptions: loadedTaskOptionsWithChildren,
          onAddTaskFromToolbox: (taskItem: ListItem) => {
            handleAddTaskFromToolbox('loading-stage-children', taskItem);
          },
          onTaskReorder: (reorderedTasks: StageTaskItem[][]) => {
            handleTaskReorder('loading-stage-children', reorderedTasks);
          },
          onTaskGroupModification: () => {},
        },
      },
      {
        id: 'loading-stage-tasks',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Task loading (3-dot disabled)',
            tasks: [
              [{ id: 'loading-task-1', label: 'Loading Task (3-dot disabled)' }],
              [
                {
                  id: 'ready-task-1',
                  label: 'Ready Task (3-dot enabled)',
                  icon: <VerificationIcon />,
                },
              ],
            ],
          },
          loadingTaskIds: new Set(['loading-task-1']),
          execution: {
            stageStatus: { status: undefined },
            taskStatus: {
              'loading-task-1': { status: 'InProgress' },
            },
          },
          taskOptions: loadedTaskOptionsWithChildren,
          onAddTaskFromToolbox: (taskItem: ListItem) => {
            handleAddTaskFromToolbox('loading-stage-tasks', taskItem);
          },
          onTaskReorder: (reorderedTasks: StageTaskItem[][]) => {
            handleTaskReorder('loading-stage-tasks', reorderedTasks);
          },
          onTaskGroupModification: () => {},
        },
      },
    ],
    [handleAddTaskFromToolbox, handleTaskReorder]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  setNodesRef.current = setNodes;
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Simulate top-level API loading — after 3 seconds, items become available
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'loading-stage-empty'
            ? {
                ...node,
                data: {
                  ...node.data,
                  loadingTaskIds: new Set(),
                  taskOptions: loadedTaskOptionsWithChildren,
                },
              }
            : node
        )
      );
    }, 3000);
    return () => clearTimeout(timeout);
  }, [setNodes]);

  // Simulate per-task loading — after 5 seconds, task finishes loading and 3-dot becomes enabled
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'loading-stage-tasks'
            ? {
                ...node,
                data: {
                  ...node.data,
                  loadingTaskIds: new Set(),
                  execution: {
                    stageStatus: { status: undefined },
                    taskStatus: {},
                  },
                },
              }
            : node
        )
      );
    }, 5000);
    return () => clearTimeout(timeout);
  }, [setNodes]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

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

export const AddTaskLoading: Story = {
  name: 'Add Task Loading State',
  parameters: {
    useCustomRender: true,
  },
  render: () => <AddTaskLoadingStory />,
};

export const AdhocTasks: Story = {
  name: 'Ad hoc Tasks',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'With onTaskPlay',
            tasks: [
              [
                {
                  id: '1',
                  label: 'Ad hoc - KYC Check',
                  icon: <VerificationIcon />,
                  isAdhoc: true,
                  hasEntryCondition: true,
                },
              ],
              [
                {
                  id: '2',
                  label: 'Ad hoc - Document Review',
                  icon: <DocumentIcon />,
                  isAdhoc: true,
                },
              ],
            ],
          },
          onTaskPlay: (taskId: string) => {
            return new Promise<void>((resolve) =>
              setTimeout(() => {
                resolve();
                console.log(`Play task: ${taskId}`);
              }, 5000)
            );
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
        },
      },
      {
        id: '1',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Without onTaskPlay and Menu',
            tasks: [
              [
                {
                  id: '1',
                  label: 'Ad hoc - Risk Assessment',
                  icon: <VerificationIcon />,
                  isAdhoc: true,
                },
              ],
              [
                {
                  id: '2',
                  label: 'Ad hoc - Compliance Review',
                  icon: <DocumentIcon />,
                  isAdhoc: true,
                },
              ],
              [
                {
                  id: '3',
                  label: 'Regular Task',
                  icon: <ProcessIcon />,
                  hasEntryCondition: true,
                },
              ],
            ],
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
          onTaskGroupModification: (type: string, groupIndex: number, taskIndex: number) => {
            console.log(
              `Task group modification: ${type}, group: ${groupIndex}, task: ${taskIndex}`
            );
          },
          onReplaceTaskFromToolbox: (task: unknown, groupIndex: number, taskIndex: number) => {
            console.log(`Replace task at group: ${groupIndex}, task: ${taskIndex}`, task);
          },
        },
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Mixed with Parallel',
            isReadOnly: true,
            tasks: [
              [
                {
                  id: '1',
                  label: 'Ad hoc - Verify Address',
                  icon: <VerificationIcon />,
                  isAdhoc: true,
                  hasEntryCondition: true,
                },
                {
                  id: '2',
                  label: 'Ad hoc - Verify Identity',
                  icon: <VerificationIcon />,
                  isAdhoc: true,
                  hasEntryCondition: true,
                },
              ],
              [
                {
                  id: '3',
                  label: 'Ad hoc - Bkgd Check',
                  icon: <VerificationIcon />,
                  isAdhoc: true,
                  hasEntryCondition: true,
                },
              ],
              [
                {
                  id: '4',
                  label: 'Ad hoc - Review Docs',
                  icon: <DocumentIcon />,
                  isAdhoc: true,
                },
              ],
              [
                {
                  id: '5',
                  label: 'Regular Processing',
                  icon: <ProcessIcon />,
                  hasEntryCondition: true,
                },
              ],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 3h 45m',
            },
            taskStatus: {
              '1': {
                status: 'Completed',
                label: 'Verify Address',
                duration: '1h 20m',
                retryDuration: '35m',
                badge: 'Reworked',
                badgeStatus: 'warning',
                retryCount: 2,
              },
              '2': {
                status: 'Failed',
                label: 'Verify Identity',
                duration: '45m',
                message: 'Identity verification failed - document expired',
                badge: 'Action needed',
                badgeStatus: 'error',
              },
              '3': {
                status: 'InProgress',
                label: 'Background Check',
              },
              '4': {
                status: 'InProgress',
                label: 'Review Docs',
                duration: '30m',
                retryDuration: '10m',
                badge: 'Reworked',
                badgeStatus: 'info',
                retryCount: 1,
              },
              '5': {
                status: 'InProgress',
                label: 'Regular Processing',
              },
            },
          },
          onTaskPlay: (taskId: string) => {
            return new Promise<void>((resolve) =>
              setTimeout(() => {
                resolve();
                console.log(`Play task: ${taskId}`);
              }, 5000)
            );
          },
        },
      },
    ],
  },
};

export const TasksBySection: Story = {
  name: 'Tasks by section',
  parameters: {
    nodes: [
      {
        id: '0',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'With sequential tasks',
            tasks: [
              [
                {
                  id: '1',
                  label: 'First task',
                  icon: <VerificationIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [
                {
                  id: '2',
                  label: 'Next task',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [
                {
                  id: '3',
                  label: 'Parallel task 1',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                  isPlaceholder: true,
                },
                {
                  id: '4',
                  label: 'Parallel task 2',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [
                {
                  id: '5',
                  label: 'Last task',
                  icon: <VerificationIcon />,
                  taskGroupType: 'sequential',
                },
              ],
            ],
          },
          onTaskPlay: (taskId: string) => {
            return new Promise<void>((resolve) =>
              setTimeout(() => {
                resolve();
                console.log(`Play task: ${taskId}`);
              }, 5000)
            );
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
        },
      },
      {
        id: '1',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'With adhoc tasks',
            tasks: [
              [
                {
                  id: '1',
                  label: 'Ad hoc - Risk Assessment',
                  icon: <VerificationIcon />,
                  taskGroupType: 'adhoc',
                  isPlaceholder: true,
                },
              ],
              [
                {
                  id: '2',
                  label: 'Ad hoc - Compliance Review',
                  icon: <DocumentIcon />,
                  taskGroupType: 'adhoc',
                },
              ],
              [
                {
                  id: '3',
                  label: 'Regular Task',
                  icon: <ProcessIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [
                {
                  id: '4',
                  label: 'Regular Task',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                },
              ],
            ],
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
          onTaskGroupModification: (type: string, groupIndex: number, taskIndex: number) => {
            console.log(
              `Task group modification: ${type}, group: ${groupIndex}, task: ${taskIndex}`
            );
          },
          onReplaceTaskFromToolbox: (task: unknown, groupIndex: number, taskIndex: number) => {
            console.log(`Replace task at group: ${groupIndex}, task: ${taskIndex}`, task);
          },
        },
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'With event-driven tasks',
            tasks: [
              [
                {
                  id: '1',
                  label: 'Waiting for specific condition',
                  icon: <VerificationIcon />,
                  taskGroupType: 'event-driven',
                  hasEntryCondition: true,
                  isPlaceholder: true,
                  isRequired: true,
                },
              ],
              [
                {
                  id: '2',
                  label: 'Regular Task',
                  icon: <ProcessIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [
                {
                  id: '3',
                  label: 'Wait for connector',
                  icon: <DocumentIcon />,
                  taskGroupType: 'event-driven',
                  hasEntryCondition: true,
                },
              ],
              [
                {
                  id: '4',
                  label: 'Regular Task',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                },
              ],
            ],
          },
          onTaskClick: (taskId: string) => {
            window.alert(`Task clicked: ${taskId}`);
          },
          onTaskGroupModification: (type: string, groupIndex: number, taskIndex: number) => {
            console.log(
              `Task group modification: ${type}, group: ${groupIndex}, task: ${taskIndex}`
            );
          },
          onReplaceTaskFromToolbox: (task: unknown, groupIndex: number, taskIndex: number) => {
            console.log(`Replace task at group: ${groupIndex}, task: ${taskIndex}`, task);
          },
        },
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 1104, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'All task sections',
            isReadOnly: true,
            tasks: [
              [
                {
                  id: '1',
                  label: 'Ad hoc - Verify Address',
                  icon: <VerificationIcon />,
                  taskGroupType: 'adhoc',
                  hasEntryCondition: true,
                  isPlaceholder: true,
                },
              ],
              [
                {
                  id: '2',
                  label: 'Wait for connector',
                  icon: <VerificationIcon />,
                  taskGroupType: 'event-driven',
                  hasEntryCondition: true,
                },
              ],
              [
                {
                  id: '4',
                  label: 'Task',
                  icon: <DocumentIcon />,
                  taskGroupType: 'sequential',
                },
              ],
              [{ id: '5', label: 'Regular Processing', icon: <ProcessIcon /> }],
            ],
          },
          execution: {
            stageStatus: {
              status: 'InProgress',
              label: 'In progress',
              slaText: 'SLA: 3h 45m',
            },
            taskStatus: {
              '1': {
                status: 'Completed',
                label: 'Verify Address',
                duration: '1h 20m',
                retryDuration: '35m',
                badge: 'Reworked',
                badgeStatus: 'warning',
                retryCount: 2,
              },
              '2': {
                status: 'Failed',
                label: 'Verify Identity',
                duration: '45m',
                message: 'Identity verification failed - document expired',
                badge: 'Action needed',
                badgeStatus: 'error',
              },
              '3': {
                status: 'InProgress',
                label: 'Background Check',
              },
              '4': {
                status: 'InProgress',
                label: 'Review Docs',
                duration: '30m',
                retryDuration: '10m',
                badge: 'Reworked',
                badgeStatus: 'info',
                retryCount: 1,
              },
              '5': {
                status: 'InProgress',
                label: 'Regular Processing',
              },
            },
          },
          onTaskPlay: (taskId: string) => {
            return new Promise<void>((resolve) =>
              setTimeout(() => {
                resolve();
                console.log(`Play task: ${taskId}`);
              }, 5000)
            );
          },
        },
      },
    ],
  },
};

export const WithRulesTags: Story = {
  name: 'With Rules & Tags',
  parameters: {
    nodes: [
      {
        id: '1',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Application',
            tasks: [
              [{ id: 't1', label: 'Verify applicant identity', icon: <VerificationIcon /> }],
              [{ id: 't2', label: 'Pull credit report', icon: <DocumentIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 1,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 3,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Pending with customer',
            tasks: [
              [{ id: 't3', label: 'Request documents', icon: <DocumentIcon /> }],
              [{ id: 't4', label: 'Send reminder or request', icon: <ProcessIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 2,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 1,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
              {
                type: StageHeaderChipType.ReturnToOrigin,
                tooltip: 'Return to origin conditions',
                onClick: () => window.alert('Open return to origin panel'),
              },
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Withdrawn',
            tasks: [[{ id: 't5', label: 'Process withdrawal', icon: <ProcessIcon /> }]],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 2,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 1,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      {
        id: '4',
        type: 'stage',
        position: { x: 1104, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Closing',
            tasks: [
              [{ id: 't6', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: 't7', label: 'eSign envelope', icon: <ProcessIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 1,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 3,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
              {
                type: StageHeaderChipType.Completion,
                tooltip: 'Stage completion',
                onClick: () => window.alert('Open stage completion panel'),
              },
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      {
        id: '5',
        type: 'stage',
        position: { x: 48, y: 400 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'No chips (comparison)',
            tasks: [
              [{ id: 't8', label: 'Verify applicant identity', icon: <VerificationIcon /> }],
              [{ id: 't9', label: 'Pull credit report', icon: <DocumentIcon /> }],
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      {
        id: '6',
        type: 'stage',
        position: { x: 400, y: 400 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'ReadOnly + completed + chips',
            isReadOnly: true,
            tasks: [
              [{ id: 't10', label: 'Verify applicant identity', icon: <VerificationIcon /> }],
              [{ id: 't11', label: 'Pull credit report', icon: <DocumentIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 1,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 3,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
              {
                type: StageHeaderChipType.Completion,
                tooltip: 'Stage completion',
                onClick: () => window.alert('Open stage completion panel'),
              },
            ],
          },
          execution: {
            stageStatus: { status: 'Completed', label: 'Completed', slaText: 'SLA: 4h' },
          },
        },
      },
      {
        id: '7',
        type: 'stage',
        position: { x: 752, y: 400 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'ReadOnly + in progress + chips',
            isReadOnly: true,
            tasks: [
              [{ id: 't12', label: 'Verify applicant identity', icon: <VerificationIcon /> }],
              [{ id: 't13', label: 'Pull credit report', icon: <DocumentIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 2,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 1,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
            ],
          },
          execution: {
            stageStatus: { status: 'InProgress', label: 'In progress', slaText: 'SLA: 2h' },
          },
        },
      },
    ],
  },
};

export const WithStatusBadges: Story = {
  name: 'With Status Badges (Optional / Ends Case)',
  parameters: {
    nodes: [
      // Optional stage — subtle "Optional" badge (clickable) alongside SLA + chips.
      {
        id: '1',
        type: 'stage',
        position: { x: 48, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Intake',
            tasks: [
              [{ id: 't1', label: 'Prepare closing docs', icon: <DocumentIcon /> }],
              [{ id: 't2', label: 'eSign envelope', icon: <ProcessIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 1,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Exit,
                count: 1,
                tooltip: 'Exit rules',
                onClick: () => window.alert('Open exit rules panel'),
              },
              {
                type: StageHeaderChipType.Optional,
                tooltip: 'Not required for case completion',
                onClick: () => window.alert('Open "Required for case completion" setting'),
              },
            ],
          },
          execution: { stageStatus: { slaText: 'SLA: 3 days' } },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      // Terminal stage — filled danger "Ends case" badge.
      {
        id: '2',
        type: 'stage',
        position: { x: 400, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Rejected',
            tasks: [
              [{ id: 't3', label: 'Summarize rejection', icon: <DocumentIcon /> }],
              [{ id: 't4', label: 'Send customer letter', icon: <ProcessIcon /> }],
            ],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 1,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.EndsCase,
                tooltip: 'Entering this stage ends the case',
                onClick: () => window.alert('Open terminal-stage setting'),
              },
            ],
          },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
      // Both badges + SLA + chips coexisting, plus consumer-supplied labels.
      {
        id: '3',
        type: 'stage',
        position: { x: 752, y: 96 },
        width: DEFAULT_STAGE_WIDTH,
        data: {
          stageDetails: {
            label: 'Optional + terminal',
            tasks: [[{ id: 't5', label: 'Final compliance audit', icon: <DocumentIcon /> }]],
            headerChips: [
              {
                type: StageHeaderChipType.Entry,
                count: 2,
                tooltip: 'Entry rules',
                onClick: () => window.alert('Open entry rules panel'),
              },
              {
                type: StageHeaderChipType.Completion,
                tooltip: 'Stage completion',
                onClick: () => window.alert('Open stage completion panel'),
              },
              {
                type: StageHeaderChipType.Optional,
                label: 'Optional',
                onClick: () => window.alert('Open "Required for case completion" setting'),
              },
              {
                type: StageHeaderChipType.EndsCase,
                label: 'Ends case',
                onClick: () => window.alert('Open terminal-stage setting'),
              },
            ],
          },
          execution: { stageStatus: { slaText: 'SLA: 1 day remaining', slaIcon: 'warning' } },
          onTaskClick: (taskId: string) => window.alert(`Task clicked: ${taskId}`),
          onTaskAdd: () => window.alert('Add task'),
        },
      },
    ],
  },
};
