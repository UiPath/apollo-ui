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
 * - Stages: loop container nodes. The INNER handles carry the labeled,
 *   always-visible lifecycle: Enter (left, starts the task chain), Complete
 *   (right), and Exit (bottom). They map onto the loop node's start / continue /
 *   break. The outer boundary handles are unlabeled connection points.
 * - Stage-level rules are the transitions themselves: the edge into a stage is
 *   its entry rule, the edges leaving its complete / exit handles are its
 *   complete / exit rules. Rule sets are summarized by the header chips and
 *   configured in the edge / stage properties, not drawn as dedicated nodes.
 *   The one exception: event-based complete / exit rules are event circles
 *   inside the stage wired into the inner Complete / Exit handles.
 * - Small circles INSIDE the stages: event (zap icon) and manual (play icon)
 *   markers that start event-based and adhoc tasks, plus event circles acting
 *   as stage complete / exit rules.
 * - Squares: tasks. The sequential chain runs from inner Enter through the
 *   tasks into inner Complete; a task wired into inner Exit abandons the stage.
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
 * Small circle task marker (event or manual), parented inside its stage. 64px
 * square so BaseNode's minimum-height rule keeps it a true circle (see
 * CASE_MARKER_NODE_SIZE).
 */
function markerNode(
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

    // Stage 1: Intake. Header chips summarize the entry / complete rule sets.
    stageNode(
      'stage-intake',
      { x: 240, y: 160 },
      { width: 560, height: 352 },
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

    // Stage 2: Assessment. Event and manual task markers stay inside the stage.
    stageNode(
      'stage-assessment',
      { x: 928, y: 96 },
      { width: 640, height: 512 },
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
      'stage-assessment',
      { x: 128, y: 288 },
      { display: { label: 'Fraud signal' }, inputs: { eventType: 'connector' } }
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
      'stage-assessment',
      { x: 464, y: 288 },
      { display: { label: 'Manual' } }
    ),
    childNode(
      'task-escalate',
      TASK_TYPE,
      'stage-assessment',
      { x: 528, y: 112 },
      { display: { label: 'Escalate to expert', icon: 'user-plus' } }
    ),
    // Event-based EXIT rule: an event circle inside the stage wired into the
    // inner Exit handle. When the claim is withdrawn, the stage exits.
    markerNode(
      'assessment-withdrawn-event',
      'uipath.case.task.event',
      'stage-assessment',
      { x: 304, y: 416 },
      { display: { label: 'Claim withdrawn' }, inputs: { eventType: 'connector' } }
    ),

    // Case lifecycle rules: big circles like the trigger, fed by stage handles.
    createNode({
      id: 'case-complete',
      type: 'uipath.case.complete',
      position: { x: 1712, y: 208 },
      data: {
        nodeType: 'uipath.case.complete',
        version: '1.0.0',
        display: { label: 'Case complete' },
      },
    }),
    createNode({
      id: 'case-exit',
      type: 'uipath.case.exit',
      position: { x: 1712, y: 480 },
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
    // Entry rule: the edge into the stage IS the rule (configured on the edge).
    edge('e-trigger-intake', 'trigger', 'output', 'stage-intake', 'enter'),

    // Sequential task chain: inner Enter -> task -> task -> inner Complete.
    edge('e-intake-onenter', 'stage-intake', 'onEnter', 'task-collect', 'input'),
    edge('e-collect-verify', 'task-collect', 'output', 'task-verify', 'input'),
    edge('e-verify-oncomplete', 'task-verify', 'output', 'stage-intake', 'onComplete'),

    // Stage-to-stage transition: the complete edge carries the complete rule.
    edge('e-intake-assessment', 'stage-intake', 'complete', 'stage-assessment', 'enter'),

    // Assessment tasks: sequential, event-based, and adhoc.
    edge('e-assessment-onenter', 'stage-assessment', 'onEnter', 'task-review', 'input'),
    edge('e-review-oncomplete', 'task-review', 'output', 'stage-assessment', 'onComplete'),
    edge('e-event-adjuster', 'assessment-event', 'output', 'task-adjuster', 'input'),
    edge('e-adhoc-escalate', 'assessment-adhoc', 'output', 'task-escalate', 'input'),
    // Escalating abandons the stage: the task lands on the inner Exit (loop break) handle.
    edge('e-escalate-onexit', 'task-escalate', 'output', 'stage-assessment', 'onExit'),
    // Event-based exit rule: the event circle feeds the same inner Exit handle.
    edge(
      'e-withdrawn-onexit',
      'assessment-withdrawn-event',
      'output',
      'stage-assessment',
      'onExit'
    ),

    // Case lifecycle: complete/exit circles fed by stage complete/exit handles.
    edge('e-case-complete', 'stage-assessment', 'complete', 'case-complete', 'input'),
    edge('e-case-exit-intake', 'stage-intake', 'exit', 'case-exit', 'input'),
    edge('e-case-exit-assessment', 'stage-assessment', 'exit', 'case-exit', 'input'),
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
