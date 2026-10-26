import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { NodeRegistryProvider } from '../../core';
import { useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import {
  caseStageEdgeTypes,
  caseStageNodeTypes,
  stageEdge,
  stageNode,
  task,
  triggerEdge,
  triggerNode,
} from '../../storybook-utils/case-flow';
import { BaseCanvas } from '../BaseCanvas';
import { StageHeaderChipType } from '../StageNode/StageNode.types';
import { TaskItemTypeValues } from '../TaskIcon';
import { caseFlowManifest } from './case-flow.manifest';

const COLUMN_GAP = 400;

const CaseStageCanvas = ({ nodes, edges = [] }: { nodes: Node[]; edges?: Edge[] }) => {
  const { canvasProps } = useCanvasStory({
    initialNodes: nodes,
    initialEdges: edges,
    additionalNodeTypes: caseStageNodeTypes,
  });
  const edgeTypes = useMemo(
    () => ({ ...canvasProps.edgeTypes, ...caseStageEdgeTypes }),
    [canvasProps.edgeTypes]
  );

  return <BaseCanvas {...canvasProps} edgeTypes={edgeTypes} mode="design" />;
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
// Stage variants: what each manifest input and content shape renders as
// ============================================================================

const VARIANT_NODES = [
  stageNode('empty', 'Primary, no tasks', 48, 96),
  stageNode('sequential', 'Primary, sequential tasks', 48 + COLUMN_GAP, 96, {
    details: {
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
      },
    },
  }),
  stageNode('failed', 'Settlement', 48 + COLUMN_GAP * 2, 96, {
    details: {
      isReadOnly: true,
      tasks: [[task('e5', 'Issue payment', TaskItemTypeValues.Connector)]],
    },
    execution: {
      stageStatus: { status: 'Failed' },
      taskStatus: { e5: { status: 'Failed', message: 'Payment gateway rejected the request' } },
    },
  }),
  stageNode('skipped', 'Fraud review', 48 + COLUMN_GAP, 420, {
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
];

const EXECUTION_EDGES = [stageEdge('done', 'running'), stageEdge('running', 'failed')];

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

export const StageVariants: Story = {
  name: 'Stage Variants',
  render: () => <CaseStageCanvas nodes={VARIANT_NODES} />,
};

export const Execution: Story = {
  name: 'Execution',
  render: () => <CaseStageCanvas nodes={EXECUTION_NODES} edges={EXECUTION_EDGES} />,
};
