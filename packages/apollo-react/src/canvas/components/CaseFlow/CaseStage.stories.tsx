import type { Meta, StoryObj } from '@storybook/react-vite';
import { type Edge, type Node, Panel } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { NodeRegistryProvider } from '../../core';
import { useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import {
  type CaseStageData,
  caseStageEdgeTypes,
  caseStageNodeTypes,
  StageActionLogProvider,
  stageEdge,
  stageNode,
  task,
  taskOption,
  triggerEdge,
  triggerNode,
} from '../../storybook-utils/case-flow';
import { BaseCanvas } from '../BaseCanvas';
import { StageHeaderChipType } from '../StageNode/StageNode.types';
import { TaskIcon, TaskItemTypeValues } from '../TaskIcon';
import type { ListItem } from '../Toolbox';
import { caseFlowManifest } from './case-flow.manifest';

const COLUMN_GAP = 400;
const ACTION_LOG_SIZE = 3;

const CaseStageCanvas = ({
  nodes,
  edges = [],
  fitWide = false,
}: {
  nodes: Node[];
  edges?: Edge[];
  /** Zooms out to show a grid wider than the default viewport. */
  fitWide?: boolean;
}) => {
  const { canvasProps } = useCanvasStory({
    initialNodes: nodes,
    initialEdges: edges,
    additionalNodeTypes: caseStageNodeTypes,
  });
  const edgeTypes = useMemo(
    () => ({ ...canvasProps.edgeTypes, ...caseStageEdgeTypes }),
    [canvasProps.edgeTypes]
  );
  const [actions, setActions] = useState<string[]>([]);
  const logAction = useCallback(
    (action: string) => setActions((prev) => [action, ...prev].slice(0, ACTION_LOG_SIZE)),
    []
  );

  return (
    <StageActionLogProvider value={logAction}>
      <BaseCanvas
        {...canvasProps}
        edgeTypes={edgeTypes}
        mode="design"
        {...(fitWide && { fitView: true, fitViewOptions: { padding: 0.1, maxZoom: 1 } })}
      >
        {actions.length > 0 && (
          <Panel position="bottom-left">
            <ol className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
              {actions.map((action, index) => (
                <li key={index} className={index === 0 ? 'text-foreground' : undefined}>
                  {action}
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </BaseCanvas>
    </StageActionLogProvider>
  );
};

// ============================================================================
// Case flow: a trigger feeding primary stages, with an exception stage beside them
// ============================================================================

const CASE_FLOW_NODES = [
  triggerNode(48, 136, 'Claim submitted'),
  stageNode('intake', 'Intake', 240, 96, {
    details: {
      tasks: [
        [task('collect', 'Collect claim documents', TaskItemTypeValues.User, { isRequired: true })],
        [
          task('verify-id', 'Verify identity', TaskItemTypeValues.ApiAutomation),
          task('verify-policy', 'Check policy coverage', TaskItemTypeValues.Automation),
        ],
      ],
      headerChips: [{ type: StageHeaderChipType.Exit, count: 1, tooltip: 'Exit rules' }],
    },
    execution: { stageStatus: { slaText: 'SLA: 1 day' }, taskStatus: {} },
  }),
  stageNode('assessment', 'Assessment', 240 + COLUMN_GAP, 96, {
    details: {
      tasks: [
        [task('assess', 'Assess damage', TaskItemTypeValues.Agent)],
        [task('approve', 'Approve payout', TaskItemTypeValues.User)],
      ],
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 1, tooltip: 'Entry rules' },
        { type: StageHeaderChipType.Exit, count: 2, tooltip: 'Exit rules' },
      ],
    },
    execution: { stageStatus: { slaText: 'SLA: 3 days' }, taskStatus: {} },
  }),
  stageNode('settlement', 'Settlement', 240 + COLUMN_GAP * 2, 96, {
    details: {
      tasks: [[task('pay', 'Issue payment', TaskItemTypeValues.Connector)]],
      headerChips: [{ type: StageHeaderChipType.EndsCase, label: 'Ends case' }],
    },
  }),
  stageNode('fraud-review', 'Fraud review', 240 + COLUMN_GAP, 420, {
    inputs: { stageType: 'secondary' },
    details: {
      tasks: [[task('investigate', 'Investigate claim', TaskItemTypeValues.User)]],
      headerChips: [
        {
          type: StageHeaderChipType.ReturnToOrigin,
          tooltip: 'Returns to the stage it was entered from',
        },
      ],
    },
  }),
];

const CASE_FLOW_EDGES = [
  triggerEdge('intake'),
  stageEdge('intake', 'assessment'),
  stageEdge('assessment', 'settlement'),
];

// ============================================================================
// Editing: every design-time stage interaction, wired to local state
// ============================================================================

const TASK_OPTIONS: ListItem<{ type: TaskItemTypeValues }>[] = [
  taskOption('opt-review', 'Manual review', TaskItemTypeValues.User),
  taskOption('opt-agent', 'Agent', TaskItemTypeValues.Agent),
  taskOption('opt-api', 'API workflow', TaskItemTypeValues.ApiAutomation),
  taskOption('opt-rpa', 'RPA workflow', TaskItemTypeValues.Automation),
  taskOption('opt-connector', 'Connector activity', TaskItemTypeValues.Connector),
  {
    ...taskOption('opt-integrations', 'Integrations', TaskItemTypeValues.Connector),
    // Loaded on drill-in, as a consumer fetching connectors would.
    children: () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              taskOption(
                'opt-salesforce',
                'Salesforce: Create record',
                TaskItemTypeValues.Connector
              ),
              taskOption('opt-outlook', 'Outlook: Send email', TaskItemTypeValues.Connector),
            ]),
          800
        )
      ),
  },
];

const EDITING_NODES = [
  stageNode('editing', 'Underwriting', 48, 96, {
    editable: true,
    taskOptions: TASK_OPTIONS,
    details: {
      tasks: [
        [task('e1', 'Review application', TaskItemTypeValues.User)],
        [
          task('e2', 'Credit check', TaskItemTypeValues.ApiAutomation),
          task('e3', 'Background check', TaskItemTypeValues.Automation),
        ],
        [task('e4', 'Score risk', TaskItemTypeValues.Agent)],
        [task('e5', 'Notify applicant', TaskItemTypeValues.Connector)],
      ],
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 1, tooltip: 'Entry rules' },
        { type: StageHeaderChipType.Exit, count: 2, tooltip: 'Exit rules' },
      ],
    },
  }),
  stageNode('editing-secondary', 'Manual review', 48 + COLUMN_GAP, 96, {
    editable: true,
    taskOptions: TASK_OPTIONS,
    inputs: { stageType: 'secondary' },
    details: {
      tasks: [
        [task('m1', 'Escalate to underwriter', TaskItemTypeValues.User)],
        [task('m2', 'Request more documents', TaskItemTypeValues.Connector)],
      ],
    },
  }),
  stageNode('editing-no-parallel', 'Parallel options hidden', 48 + COLUMN_GAP * 2, 96, {
    editable: true,
    taskOptions: TASK_OPTIONS,
    hideParallelOptions: true,
    details: {
      tasks: [
        [task('n1', 'Send welcome pack', TaskItemTypeValues.Connector)],
        [task('n2', 'Schedule onboarding call', TaskItemTypeValues.User)],
      ],
    },
  }),
  stageNode('editing-empty', 'Empty stage', 48, 520, {
    editable: true,
    taskOptions: TASK_OPTIONS,
  }),
  stageNode('editing-host-add', 'Host adds tasks', 48 + COLUMN_GAP, 520, {
    editable: true,
    addTaskMode: 'host',
    taskOptions: TASK_OPTIONS,
    details: { tasks: [[task('h1', 'Collect documents', TaskItemTypeValues.User)]] },
  }),
  stageNode('editing-host-replace', 'Host opens replace', 48 + COLUMN_GAP * 2, 520, {
    editable: true,
    taskOptions: TASK_OPTIONS,
    replaceTaskToolboxTitle: 'Change task type',
    details: {
      tasks: [
        [task('r1', 'Draft contract', TaskItemTypeValues.Agent)],
        [task('r2', 'Add a task', TaskItemTypeValues.User, { isPlaceholder: true })],
      ],
    },
  }),
];

// ============================================================================
// Stage variants: what each manifest input and content shape renders as
// ============================================================================

const VARIANT_NODES = [
  stageNode('empty', 'Primary, no tasks', 48, 96, {
    details: { tasks: [], defaultContent: 'Drop a task here to start this stage' },
  }),
  stageNode('sequential', 'Primary, sequential tasks, with icon', 48 + COLUMN_GAP, 96, {
    details: {
      icon: <TaskIcon type={TaskItemTypeValues.CaseManagement} size="sm" />,
      tasks: [
        [task('s1', 'Review application', TaskItemTypeValues.User)],
        [task('s2', 'Score risk', TaskItemTypeValues.Agent)],
        [task('s3', 'Notify applicant', TaskItemTypeValues.Connector)],
      ],
    },
  }),
  stageNode('parallel', 'Primary, parallel tasks', 48 + COLUMN_GAP * 2, 96, {
    details: {
      tasks: [
        [
          task('p1', 'Credit check', TaskItemTypeValues.ApiAutomation),
          task('p2', 'Background check', TaskItemTypeValues.Automation),
          task('p3', 'Reference call', TaskItemTypeValues.User),
        ],
      ],
    },
  }),
  stageNode('secondary', 'Secondary (exception)', 48, 420, {
    inputs: { stageType: 'secondary' },
    details: { tasks: [[task('x1', 'Handle exception', TaskItemTypeValues.User)]] },
  }),
  stageNode('rules', 'Rules and SLA', 48 + COLUMN_GAP, 420, {
    details: {
      tasks: [[task('r1', 'Prepare closing docs', TaskItemTypeValues.User)]],
      sla: '2d',
      escalation: '1d',
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 1, tooltip: 'Entry rules' },
        { type: StageHeaderChipType.Exit, count: 1, tooltip: 'Exit rules' },
        { type: StageHeaderChipType.Optional, tooltip: 'Not required for case completion' },
      ],
    },
    execution: { stageStatus: { slaText: 'SLA: 2 days' }, taskStatus: {} },
  }),
  stageNode('read-only', 'Read-only', 48 + COLUMN_GAP * 2, 420, {
    details: {
      isReadOnly: true,
      tasks: [[task('ro1', 'Archive case', TaskItemTypeValues.Automation)]],
      headerChips: [{ type: StageHeaderChipType.EndsCase, label: 'Ends case' }],
    },
  }),
];

// ============================================================================
// Task types: every kind of task row a stage renders
// ============================================================================

const TASK_TYPE_NODES = [
  stageNode('sequential', 'Sequential and parallel', 48, 96, {
    details: {
      tasks: [
        [task('tt1', 'Review application', TaskItemTypeValues.User, { isRequired: true })],
        [
          task('tt2', 'Credit check', TaskItemTypeValues.ApiAutomation),
          task('tt3', 'Background check', TaskItemTypeValues.Automation),
        ],
        [task('tt4', 'Score risk', TaskItemTypeValues.Agent)],
      ],
    },
  }),
  stageNode('event-driven', 'Event-driven', 48 + COLUMN_GAP, 96, {
    details: {
      tasks: [
        [
          task('te1', 'Wait for signed contract', TaskItemTypeValues.Connector, {
            taskGroupType: 'event-driven',
            hasEntryCondition: true,
          }),
        ],
        [task('te2', 'File contract', TaskItemTypeValues.Automation)],
        [
          task('te3', 'Wait for a condition', TaskItemTypeValues.Timer, {
            taskGroupType: 'event-driven',
            hasEntryCondition: true,
            isPlaceholder: true,
          }),
        ],
      ],
    },
  }),
  stageNode('adhoc', 'Ad hoc', 48 + COLUMN_GAP * 2, 96, {
    details: {
      tasks: [
        [task('ta1', 'Manual review', TaskItemTypeValues.User, { isAdhoc: true })],
        [
          task('ta2', 'Escalate to legal', TaskItemTypeValues.CaseManagement, {
            isAdhoc: true,
            hasEntryCondition: true,
          }),
        ],
        [
          task('ta3', 'Add a task', TaskItemTypeValues.User, {
            taskGroupType: 'adhoc',
            isPlaceholder: true,
          }),
        ],
      ],
    },
  }),
  stageNode('states', 'Mocked and selected', 48 + COLUMN_GAP * 3, 96, {
    details: {
      selectedTaskId: 'ts2',
      tasks: [
        [task('ts1', 'Call pricing service', TaskItemTypeValues.ApiAutomation, { isMocked: true })],
        [task('ts2', 'Approve quote', TaskItemTypeValues.User)],
        [task('ts3', 'Send quote', TaskItemTypeValues.Connector)],
      ],
    },
  }),
];

// ============================================================================
// Chips and rules: every header chip, and the entry, exit and completion rule sections
// ============================================================================

const RULES_ROW_Y = 520;

const CHIPS_AND_RULES_NODES = [
  stageNode('chips', 'Every rule chip', 48, 96, {
    details: {
      tasks: [[task('c1', 'Review claim', TaskItemTypeValues.User)]],
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 2, tooltip: 'Entry rules' },
        { type: StageHeaderChipType.Exit, count: 3, tooltip: 'Exit rules' },
        { type: StageHeaderChipType.Completion, count: 1, tooltip: 'Completion rules' },
        {
          type: StageHeaderChipType.ReturnToOrigin,
          tooltip: 'Returns to the stage it was entered from',
        },
      ],
    },
  }),
  stageNode('pills', 'Status pills', 48 + COLUMN_GAP, 96, {
    details: {
      tasks: [[task('c2', 'Close claim', TaskItemTypeValues.Automation)]],
      headerChips: [
        { type: StageHeaderChipType.Optional, tooltip: 'Not required for case completion' },
        { type: StageHeaderChipType.EndsCase, variant: 'solid', label: 'Ends case' },
      ],
    },
  }),
  // A stage shows one chip per type, so each Ends case variant gets its own stage.
  stageNode('pill-outline', 'Ends case, outline', 48 + COLUMN_GAP * 2, 96, {
    details: {
      tasks: [[task('c3', 'Archive case', TaskItemTypeValues.Automation)]],
      headerChips: [{ type: StageHeaderChipType.EndsCase, variant: 'outline', label: 'Ends case' }],
    },
  }),
  stageNode('pill-success', 'Ends case, success', 48 + COLUMN_GAP * 2, RULES_ROW_Y, {
    details: {
      tasks: [[task('c5', 'Send closure letter', TaskItemTypeValues.Connector)]],
      headerChips: [
        { type: StageHeaderChipType.EndsCase, variant: 'success', label: 'Completed case' },
      ],
    },
  }),
  stageNode('rules', 'Rule sections', 48, RULES_ROW_Y, {
    details: {
      tasks: [[task('c4', 'Prepare closing docs', TaskItemTypeValues.User)]],
      headerChips: [
        { type: StageHeaderChipType.Entry, count: 2, tooltip: 'Entry rules' },
        { type: StageHeaderChipType.Exit, count: 1, tooltip: 'Exit rules' },
      ],
      entryRules: [
        { id: 'r1', label: 'Case entered' },
        { id: 'r2', label: 'Re-enter stage' },
      ],
      exitRules: [{ id: 'r3', label: 'Return to origin' }],
      completionRules: [
        { id: 'r4', label: 'Required tasks completed' },
        { id: 'r5', label: 'Manually complete stage' },
      ],
    },
  }),
  stageNode('collapsible', 'Collapsible sections', 48 + COLUMN_GAP, RULES_ROW_Y, {
    collapsibleSections: {
      tasks: true,
      entryRules: false,
      exitRules: false,
      completionRules: true,
    },
    details: {
      tasks: [
        [task('c5', 'Summarize rejection', TaskItemTypeValues.Agent)],
        [task('c6', 'Send customer letter', TaskItemTypeValues.Connector)],
      ],
      entryRules: [{ id: 'r6', label: 'Case entered' }],
      exitRules: [{ id: 'r7', label: 'Claim rejected' }],
      completionRules: [{ id: 'r8', label: 'Letter sent' }],
    },
  }),
];

// ============================================================================
// Execution: the same stages with run state from a debug or instance view
// ============================================================================

const EXECUTION_NODES = [
  stageNode('done', 'Intake', 48, 96, {
    details: {
      isReadOnly: true,
      tasks: [
        [task('e1', 'Collect claim documents', TaskItemTypeValues.User)],
        [task('e2', 'Verify identity', TaskItemTypeValues.ApiAutomation)],
      ],
    },
    execution: {
      stageStatus: { status: 'Completed', durationMs: 2 * 60 * 60 * 1000, slaText: 'SLA: 1 day' },
      taskStatus: {
        e1: { status: 'Completed', durationMs: 45 * 60 * 1000 },
        e2: {
          status: 'Completed',
          durationMs: 75 * 60 * 1000,
          retryCount: 1,
          retryDuration: '10m',
        },
      },
    },
  }),
  stageNode('running', 'Assessment', 48 + COLUMN_GAP, 96, {
    details: {
      isReadOnly: true,
      sla: '3d',
      slaBreached: true,
      tasks: [
        [task('e3', 'Assess damage', TaskItemTypeValues.Agent)],
        [task('e4', 'Approve payout', TaskItemTypeValues.User)],
        // Every task adornment at once, to check the row still fits.
        [
          task('e8', 'Verify payout bank details', TaskItemTypeValues.ApiAutomation, {
            isRequired: true,
            isMocked: true,
            hasEntryCondition: true,
          }),
        ],
        [task('e7', 'Request site inspection', TaskItemTypeValues.User, { isAdhoc: true })],
      ],
    },
    execution: {
      stageStatus: {
        status: 'InProgress',
        durationMs: 4 * 24 * 60 * 60 * 1000,
        slaText: 'SLA breached',
        slaIcon: 'error',
      },
      taskStatus: {
        e3: { status: 'Completed', durationMs: 20 * 60 * 1000 },
        e4: { status: 'InProgress', durationMs: 3 * 24 * 60 * 60 * 1000 },
        e8: {
          status: 'InProgress',
          durationMs: 26 * 60 * 60 * 1000 + 3 * 60 * 1000 + 7 * 1000,
          durationTooltip: 'Waiting on the bank, retries in 10 minutes',
          retryCount: 2,
          retryDuration: '25m',
          breakpoint: true,
        },
      },
    },
  }),
  stageNode('failed', 'Settlement', 48 + COLUMN_GAP * 2, 96, {
    details: {
      isReadOnly: true,
      tasks: [[task('e5', 'Issue payment', TaskItemTypeValues.Connector)]],
    },
    execution: {
      stageStatus: { status: 'Failed', durationMs: 35 * 60 * 1000, durationLabel: 'Ran for' },
      taskStatus: { e5: { status: 'Failed', message: 'Payment gateway rejected the request' } },
    },
  }),
  stageNode('skipped', 'Fraud review', 48 + COLUMN_GAP, 560, {
    inputs: { stageType: 'secondary' },
    details: {
      isReadOnly: true,
      tasks: [[task('e6', 'Investigate claim', TaskItemTypeValues.User)]],
    },
    execution: {
      stageStatus: { status: 'NotExecuted' },
      taskStatus: { e6: { status: 'NotExecuted' } },
    },
  }),
].map((node) => ({ ...node, data: { ...node.data, debuggable: true } }));

const EXECUTION_EDGES = [stageEdge('done', 'running'), stageEdge('running', 'failed')];

// ============================================================================
// Execution statuses: every stage and task status, with SLA, breakpoint and duration details
// ============================================================================

type StageStatusExample = {
  status: NonNullable<NonNullable<CaseStageData['execution']>['stageStatus']['status']>;
  label: string;
  stageStatus?: Partial<NonNullable<CaseStageData['execution']>['stageStatus']>;
  taskStatus?: Partial<NonNullable<CaseStageData['execution']>['taskStatus'][string]>;
  details?: Partial<NonNullable<CaseStageData['details']>>;
};

const STAGE_STATUS_EXAMPLES: StageStatusExample[] = [
  { status: 'NotExecuted', label: 'Not executed' },
  {
    status: 'InProgress',
    label: 'In progress',
    taskStatus: {
      durationMs: 30 * 60 * 1000,
      durationTooltip: 'Waiting on the timer, 15m remaining',
    },
  },
  { status: 'Completed', label: 'Completed', stageStatus: { durationMs: 90 * 60 * 1000 } },
  { status: 'Failed', label: 'Failed', taskStatus: { message: 'The robot stopped responding' } },
  {
    status: 'Warning',
    label: 'Warning',
    stageStatus: { slaText: 'SLA at risk', slaIcon: 'warning' },
    details: { sla: '1d', escalation: '4h', escalationsTriggered: true },
  },
  { status: 'Paused', label: 'Paused at a breakpoint', taskStatus: { breakpoint: true } },
  { status: 'Cancelled', label: 'Cancelled' },
  { status: 'UserCancelled', label: 'Cancelled by a user' },
  { status: 'Terminated', label: 'Terminated' },
  { status: 'EarlyExit', label: 'Exited early' },
];

const STATUS_COLUMNS = 5;
const STATUS_ROW_GAP = 280;

const EXECUTION_STATUS_NODES = STAGE_STATUS_EXAMPLES.map(
  ({ status, label, stageStatus, taskStatus, details }, index) =>
    stageNode(
      `status-${status}`,
      label,
      48 + COLUMN_GAP * (index % STATUS_COLUMNS),
      96 + STATUS_ROW_GAP * Math.floor(index / STATUS_COLUMNS),
      {
        details: {
          isReadOnly: true,
          tasks: [[task(`task-${status}`, 'Process claim', TaskItemTypeValues.Automation)]],
          ...details,
        },
        execution: {
          stageStatus: { status, ...stageStatus },
          taskStatus: { [`task-${status}`]: { status, ...taskStatus } },
        },
      }
    )
);

const meta = {
  title: 'Components/CaseFlow/Stage',
  component: BaseCanvas,
  decorators: [
    // Listed first so it wraps innermost and shadows the registry withCanvasProviders installs.
    (Story) => (
      <NodeRegistryProvider manifest={caseFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
    withCanvasProviders(),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Case Flow',
  render: () => <CaseStageCanvas nodes={CASE_FLOW_NODES} edges={CASE_FLOW_EDGES} />,
};

export const Editing: Story = {
  name: 'Editing',
  render: () => <CaseStageCanvas nodes={EDITING_NODES} />,
};

export const StageVariants: Story = {
  name: 'Stage Variants',
  render: () => <CaseStageCanvas nodes={VARIANT_NODES} />,
};

export const TaskTypes: Story = {
  name: 'Task Types',
  render: () => <CaseStageCanvas nodes={TASK_TYPE_NODES} fitWide />,
};

export const ChipsAndRules: Story = {
  name: 'Chips and Rules',
  render: () => <CaseStageCanvas nodes={CHIPS_AND_RULES_NODES} />,
};

export const Execution: Story = {
  name: 'Execution',
  render: () => <CaseStageCanvas nodes={EXECUTION_NODES} edges={EXECUTION_EDGES} />,
};

export const ExecutionStatuses: Story = {
  name: 'Execution Statuses',
  render: () => <CaseStageCanvas nodes={EXECUTION_STATUS_NODES} fitWide />,
};
