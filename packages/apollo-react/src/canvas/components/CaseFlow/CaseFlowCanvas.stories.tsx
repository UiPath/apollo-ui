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
 * - Small circles: entry / complete / exit rule conditions plus event and manual
 *   (adhoc) task markers. They connect into the stage's inner handles, so every
 *   rule is a node, a handle, or an edge.
 * - Squares: tasks. Edges from the stage's inner "On enter" handle and between
 *   tasks are sequential run rules.
 * - Cross-stage edges (stage complete into another stage's entry rule) express
 *   rules that depend on other stages.
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
  data: BaseNodeData,
  size?: number
): Node<BaseNodeData> {
  const node = createNode({ id, type, position, data: { nodeType: type, ...data } });
  return {
    ...node,
    parentId,
    extent: 'parent' as const,
    ...(size ? { width: size, height: size } : {}),
  };
}

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
      position: { x: 32, y: 336 },
      data: {
        nodeType: 'uipath.case.trigger',
        version: '1.0.0',
        display: { label: 'Claim received', icon: 'zap' },
        inputs: { serviceType: 'Intsvc.EventTrigger' },
      },
    }),

    // Stage 1: Intake. Header shows description text and rule chips via node data.
    stageNode(
      'stage-intake',
      { x: 240, y: 128 },
      { width: 608, height: 448 },
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
    markerNode(
      'intake-entry-rule',
      'uipath.case.rule.entry',
      { x: 64, y: 320 },
      { display: { label: 'Case entered' }, inputs: { rule: 'case-entered' } },
      'stage-intake'
    ),
    childNode(
      'task-collect',
      TASK_TYPE,
      'stage-intake',
      { x: 144, y: 112 },
      { display: { label: 'Collect documents', icon: 'clipboard-list' } }
    ),
    childNode(
      'task-verify',
      TASK_TYPE,
      'stage-intake',
      { x: 336, y: 112 },
      { display: { label: 'Verify coverage', icon: 'shield-check' } }
    ),
    markerNode(
      'intake-complete-rule',
      'uipath.case.rule.complete',
      { x: 480, y: 320 },
      {
        display: { label: 'Required tasks completed' },
        inputs: { rule: 'required-tasks-completed' },
      },
      'stage-intake'
    ),

    // Stage 2: Assessment. Event and manual task markers, exit rule, cross-stage entry rule.
    stageNode(
      'stage-assessment',
      { x: 960, y: 128 },
      { width: 640, height: 448 },
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
    markerNode(
      'assessment-entry-rule',
      'uipath.case.rule.entry',
      { x: 64, y: 320 },
      {
        display: { label: 'Intake completed' },
        inputs: { rule: 'selected-stage-completed', selectedStageId: 'stage-intake' },
      },
      'stage-assessment'
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
      { x: 336, y: 320 },
      { display: { label: 'Fraud signal' }, inputs: { eventType: 'connector' } },
      'stage-assessment'
    ),
    childNode(
      'task-adjuster',
      TASK_TYPE,
      'stage-assessment',
      { x: 432, y: 272 },
      { display: { label: 'Adjuster review', icon: 'user-search' } }
    ),
    // Adhoc task: small circle with the play icon feeding the task.
    markerNode(
      'assessment-adhoc',
      'uipath.case.task.adhoc',
      { x: 336, y: 128 },
      { display: { label: 'Manual' } },
      'stage-assessment'
    ),
    childNode(
      'task-escalate',
      TASK_TYPE,
      'stage-assessment',
      { x: 432, y: 80 },
      { display: { label: 'Escalate to expert', icon: 'user-plus' } }
    ),
    markerNode(
      'assessment-exit-rule',
      'uipath.case.rule.exit',
      { x: 528, y: 384 },
      {
        display: { label: 'Claim withdrawn' },
        inputs: { rule: 'wait-for-connector' },
      },
      'stage-assessment'
    ),

    // Case lifecycle rules: big circles like the trigger.
    createNode({
      id: 'case-complete',
      type: 'uipath.case.complete',
      position: { x: 1728, y: 240 },
      data: {
        nodeType: 'uipath.case.complete',
        version: '1.0.0',
        display: { label: 'Case complete' },
      },
    }),
    createNode({
      id: 'case-exit',
      type: 'uipath.case.exit',
      position: { x: 1728, y: 448 },
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
    // Trigger starts the first stage (stage enter = loop start handle).
    edge('e-trigger-intake', 'trigger', 'output', 'stage-intake', 'enter'),

    // Entry rule circle feeds the stage's inner entry-rules handle.
    edge('e-intake-entry', 'intake-entry-rule', 'output', 'stage-intake', 'entryRules'),

    // Sequential task chain: inner On enter handle -> task -> task.
    edge('e-intake-onenter', 'stage-intake', 'onEnter', 'task-collect', 'input'),
    edge('e-collect-verify', 'task-collect', 'output', 'task-verify', 'input'),

    // Stage complete rule: tasks feed the rule circle, the circle feeds completeRules.
    edge('e-verify-complete-rule', 'task-verify', 'output', 'intake-complete-rule', 'input'),
    edge('e-intake-complete', 'intake-complete-rule', 'output', 'stage-intake', 'completeRules'),

    // Stage-to-stage transition: intake complete (loop end) enters assessment.
    edge('e-intake-assessment', 'stage-intake', 'complete', 'stage-assessment', 'enter'),

    // Cross-stage dependency rule: assessment's entry rule depends on intake completing.
    edge('e-intake-dep', 'stage-intake', 'complete', 'assessment-entry-rule', 'input'),
    edge('e-assessment-entry', 'assessment-entry-rule', 'output', 'stage-assessment', 'entryRules'),

    // Assessment tasks: sequential, event-based, and adhoc.
    edge('e-assessment-onenter', 'stage-assessment', 'onEnter', 'task-review', 'input'),
    edge('e-event-adjuster', 'assessment-event', 'output', 'task-adjuster', 'input'),
    edge('e-adhoc-escalate', 'assessment-adhoc', 'output', 'task-escalate', 'input'),

    // Stage exit rule (loop break handle).
    edge('e-assessment-exit', 'assessment-exit-rule', 'output', 'stage-assessment', 'exitRules'),

    // Case lifecycle: complete/exit circles fed by stage complete/exit handles.
    edge('e-case-complete', 'stage-assessment', 'complete', 'case-complete', 'input'),
    edge('e-case-exit-1', 'stage-intake', 'exit', 'case-exit', 'input'),
    edge('e-case-exit-2', 'stage-assessment', 'exit', 'case-exit', 'input'),
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
