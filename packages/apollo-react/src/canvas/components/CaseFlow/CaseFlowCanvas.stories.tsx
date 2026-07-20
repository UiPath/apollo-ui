import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { NodeRegistryProvider } from '../../core';
import { createNode, useCanvasStory, withCanvasProviders } from '../../storybook-utils';
import { BaseCanvas } from '../BaseCanvas';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import type { LoopNodeData } from '../LoopNode/LoopNode.types';
import { StageHeaderChipType } from '../StageNode/StageNode.types';
import { CASE_MARKER_NODE_SIZE, caseFlowManifest } from './case-flow.manifest';

/**
 * Case-flow canvas POC. Demonstrates the full case-management visual language
 * built from manifest-driven nodes:
 *
 * - Big circles: the case trigger (uipath.case.trigger) and the case complete /
 *   case exit lifecycle rules.
 * - Stages: loop container nodes. The outer left handle is stage enter (loop
 *   start), the outer right handles are stage complete (loop end) and stage exit
 *   (loop break). Rule chips and description text render in the stage header.
 * - Small circles OUTSIDE the stages: entry / complete / exit rule conditions.
 *   They sit on the transitions: entry rules feed the stage's enter handle;
 *   complete / exit rules are fed by the stage's complete / exit handles and
 *   gate the next stage or the case lifecycle. A rule circle on the edge
 *   between two stages is the cross-stage dependency rule.
 * - Small circles INSIDE the stages: task-level event (zap icon) and manual
 *   (play icon) markers that start event-based and adhoc tasks.
 * - Squares: tasks. The stage's INNER handles carry the labeled lifecycle,
 *   Enter / Complete / Exit (the loop node's start / continue / break). The
 *   sequential chain runs from inner Enter through the tasks into inner
 *   Complete; a task wired into inner Exit abandons the stage. The outer
 *   boundary handles are unlabeled connection points.
 */

const STAGE_TYPE = 'uipath.case.stage';
const TASK_TYPE = 'uipath.case.task';

function stageNode(
  id: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  data: LoopNodeData
): Node<LoopNodeData> {
  return {
    id,
    type: STAGE_TYPE,
    position,
    data: {
      nodeType: STAGE_TYPE,
      version: '1.0.0',
      ...data,
      display: { ...data.display, shape: 'container' as const },
    },
    style: { width: size.width, height: size.height },
  };
}

function childNode(
  id: string,
  type: string,
  parentId: string,
  position: { x: number; y: number },
  data: BaseNodeData
): Node<BaseNodeData> {
  const node = createNode({ id, type, position, data: { nodeType: type, ...data } });
  return {
    ...node,
    parentId,
    extent: 'parent' as const,
  };
}

/**
 * Small circle marker (rule condition, event, or manual). 64px square so
 * BaseNode's minimum-height rule keeps it a true circle (see
 * CASE_MARKER_NODE_SIZE). Rule circles are free-floating on the transitions;
 * event / adhoc markers are parented inside their stage.
 */
function markerNode(
  id: string,
  type: string,
  position: { x: number; y: number },
  data: BaseNodeData,
  parentId?: string
): Node<BaseNodeData> {
  const node = createNode({ id, type, position, data: { nodeType: type, ...data } });
  return {
    ...node,
    ...(parentId ? { parentId, extent: 'parent' as const } : {}),
    width: CASE_MARKER_NODE_SIZE,
    height: CASE_MARKER_NODE_SIZE,
  };
}

const edge = (
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): Edge => ({ id, source, sourceHandle, target, targetHandle });

function createCaseFlowNodes(): Node[] {
  return [
    // Case trigger: big circle, unchanged uipath.case.trigger node type.
    createNode({
      id: 'trigger',
      type: 'uipath.case.trigger',
      position: { x: 0, y: 320 },
      data: {
        nodeType: 'uipath.case.trigger',
        version: '1.0.0',
        display: { label: 'Claim received', icon: 'zap' },
        inputs: { serviceType: 'Intsvc.EventTrigger' },
      },
    }),

    // Entry rule: small circle on the transition into the stage.
    markerNode(
      'intake-entry-rule',
      'uipath.case.rule.entry',
      { x: 192, y: 336 },
      { display: { label: 'Case entered' }, inputs: { rule: 'case-entered' } }
    ),

    // Stage 1: Intake. Header shows description text and rule chips via node data.
    stageNode(
      'stage-intake',
      { x: 352, y: 160 },
      { width: 560, height: 320 },
      {
        display: {
          label: 'Intake',
          description: 'Collect the claim, supporting documents and verify policy coverage',
        },
        headerChips: [
          { type: StageHeaderChipType.Entry, count: 1 },
          { type: StageHeaderChipType.Completion, count: 1 },
        ],
      }
    ),
    childNode(
      'task-collect',
      TASK_TYPE,
      'stage-intake',
      { x: 144, y: 128 },
      { display: { label: 'Collect documents', icon: 'clipboard-list' } }
    ),
    childNode(
      'task-verify',
      TASK_TYPE,
      'stage-intake',
      { x: 336, y: 128 },
      { display: { label: 'Verify coverage', icon: 'shield-check' } }
    ),

    // Complete rule: gates the transition from Intake into Assessment.
    // This circle on the stage-to-stage edge is the cross-stage dependency rule.
    markerNode(
      'intake-complete-rule',
      'uipath.case.rule.complete',
      { x: 1008, y: 288 },
      {
        display: { label: 'Required tasks completed' },
        inputs: { rule: 'required-tasks-completed', selectedStageId: 'stage-intake' },
      }
    ),

    // Stage 2: Assessment. Event and manual task markers stay inside the stage.
    stageNode(
      'stage-assessment',
      { x: 1168, y: 96 },
      { width: 640, height: 480 },
      {
        display: {
          label: 'Assessment',
          description: 'Assess the claim, request adjuster review when fraud signals appear',
        },
        headerChips: [
          { type: StageHeaderChipType.Entry, count: 1 },
          { type: StageHeaderChipType.Exit, count: 1 },
          { type: StageHeaderChipType.Optional },
        ],
      }
    ),
    childNode(
      'task-review',
      TASK_TYPE,
      'stage-assessment',
      { x: 144, y: 112 },
      { display: { label: 'Review claim', icon: 'file-search' } }
    ),
    // Event-based task: small circle with the event icon feeding the task.
    markerNode(
      'assessment-event',
      'uipath.case.task.event',
      { x: 128, y: 288 },
      { display: { label: 'Fraud signal' }, inputs: { eventType: 'connector' } },
      'stage-assessment'
    ),
    childNode(
      'task-adjuster',
      TASK_TYPE,
      'stage-assessment',
      { x: 304, y: 272 },
      { display: { label: 'Adjuster review', icon: 'user-search' } }
    ),
    // Adhoc task: small circle with the play icon feeding the task.
    markerNode(
      'assessment-adhoc',
      'uipath.case.task.adhoc',
      { x: 464, y: 288 },
      { display: { label: 'Manual' } },
      'stage-assessment'
    ),
    childNode(
      'task-escalate',
      TASK_TYPE,
      'stage-assessment',
      { x: 528, y: 112 },
      { display: { label: 'Escalate to expert', icon: 'user-plus' } }
    ),

    // Exit rule: fed by the stage's exit handle, gates the path to case exit.
    markerNode(
      'assessment-exit-rule',
      'uipath.case.rule.exit',
      { x: 1904, y: 496 },
      {
        display: { label: 'Claim withdrawn' },
        inputs: { rule: 'wait-for-connector' },
      }
    ),

    // Case lifecycle rules: big circles like the trigger.
    createNode({
      id: 'case-complete',
      type: 'uipath.case.complete',
      position: { x: 2064, y: 208 },
      data: {
        nodeType: 'uipath.case.complete',
        version: '1.0.0',
        display: { label: 'Case complete' },
      },
    }),
    createNode({
      id: 'case-exit',
      type: 'uipath.case.exit',
      position: { x: 2064, y: 480 },
      data: {
        nodeType: 'uipath.case.exit',
        version: '1.0.0',
        display: { label: 'Case exit' },
      },
    }),
  ];
}

function createCaseFlowEdges(): Edge[] {
  return [
    // Trigger feeds the entry rule, the entry rule feeds stage enter (loop start).
    edge('e-trigger-entry-rule', 'trigger', 'output', 'intake-entry-rule', 'input'),
    edge('e-entry-rule-intake', 'intake-entry-rule', 'output', 'stage-intake', 'enter'),

    // Sequential task chain: inner On enter -> task -> task -> inner On complete.
    edge('e-intake-onenter', 'stage-intake', 'onEnter', 'task-collect', 'input'),
    edge('e-collect-verify', 'task-collect', 'output', 'task-verify', 'input'),
    edge('e-verify-oncomplete', 'task-verify', 'output', 'stage-intake', 'onComplete'),

    // Stage complete (loop end) feeds the complete rule, which gates the next stage.
    edge('e-intake-complete-rule', 'stage-intake', 'complete', 'intake-complete-rule', 'input'),
    edge(
      'e-complete-rule-assessment',
      'intake-complete-rule',
      'output',
      'stage-assessment',
      'enter'
    ),

    // Assessment tasks: sequential, event-based, and adhoc.
    edge('e-assessment-onenter', 'stage-assessment', 'onEnter', 'task-review', 'input'),
    edge('e-review-oncomplete', 'task-review', 'output', 'stage-assessment', 'onComplete'),
    edge('e-event-adjuster', 'assessment-event', 'output', 'task-adjuster', 'input'),
    edge('e-adhoc-escalate', 'assessment-adhoc', 'output', 'task-escalate', 'input'),
    // Escalating abandons the stage: the task lands on the inner Exit (loop break) handle.
    edge('e-escalate-onexit', 'task-escalate', 'output', 'stage-assessment', 'onExit'),

    // Stage exit (loop break) feeds the exit rule, which gates the case exit.
    edge('e-assessment-exit-rule', 'stage-assessment', 'exit', 'assessment-exit-rule', 'input'),
    edge('e-exit-rule-case-exit', 'assessment-exit-rule', 'output', 'case-exit', 'input'),

    // Case lifecycle: complete/exit circles fed by stage complete/exit handles.
    edge('e-case-complete', 'stage-assessment', 'complete', 'case-complete', 'input'),
    edge('e-case-exit-intake', 'stage-intake', 'exit', 'case-exit', 'input'),
  ];
}

const CaseFlowCanvasStory = () => {
  const initialNodes = useMemo(() => createCaseFlowNodes(), []);
  const initialEdges = useMemo(() => createCaseFlowEdges(), []);

  const { canvasProps } = useCanvasStory({ initialNodes, initialEdges });

  return <BaseCanvas {...canvasProps} mode="design" fitView />;
};

const meta = {
  title: 'Components/CaseFlow/CaseFlowCanvas',
  component: BaseCanvas,
  decorators: [withCanvasProviders()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BaseCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InsuranceClaim: Story = {
  decorators: [
    (Story) => (
      <NodeRegistryProvider manifest={caseFlowManifest}>
        <Story />
      </NodeRegistryProvider>
    ),
  ],
  render: () => <CaseFlowCanvasStory />,
};
