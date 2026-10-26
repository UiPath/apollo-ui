/**
 * Shared helpers for the CaseFlow stories: manifest-shaped trigger and stage nodes, and the
 * StageNode mapping a consumer canvas uses to render them.
 */
import type { Edge, EdgeTypes, Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import {
  caseManagementStageManifest,
  caseManagementTriggerManifest,
} from '../components/CaseFlow/case-flow.manifest';
import { StageEdge } from '../components/StageNode/StageEdge';
import { StageNode } from '../components/StageNode/StageNode';
import type { StageNodeBaseProps, StageTaskItem } from '../components/StageNode/StageNode.types';
import { TaskIcon, type TaskItemTypeValues } from '../components/TaskIcon';
import { areNodePropsEqualIgnoringPosition } from '../utils/nodePropsEqual';
import { createNode } from './mocks/nodes';

export const TRIGGER_NODE_TYPE = caseManagementTriggerManifest.nodeType;
export const STAGE_NODE_TYPE = caseManagementStageManifest.nodeType;

// Stage width used by the Maestro (PO.Frontend) case-management canvas.
export const STAGE_WIDTH = 336;

/**
 * A stage node as a consumer stores it: the manifest-declared fields (`display.label`,
 * `inputs.stageType`) plus the content the consumer renders (tasks, rules, SLA, run state).
 */
export interface CaseStageData {
  display?: { label?: string };
  inputs?: { stageType?: 'primary' | 'secondary' };
  details?: Omit<StageNodeBaseProps['stageDetails'], 'label' | 'isException'>;
  execution?: StageNodeBaseProps['execution'];
}

// Maps a manifest-shaped stage onto StageNode, as a consumer canvas does.
const CaseStageNode = memo(({ id, selected, dragging, width, data }: NodeProps) => {
  const { display, inputs, details, execution } = data as CaseStageData;
  return (
    <StageNode
      id={id}
      selected={selected}
      dragging={dragging}
      width={width}
      execution={execution}
      stageDetails={{
        tasks: [],
        ...details,
        label: display?.label ?? caseManagementStageManifest.display.label,
        isException: inputs?.stageType === 'secondary',
      }}
    />
  );
}, areNodePropsEqualIgnoringPosition);

export const caseStageNodeTypes = { [STAGE_NODE_TYPE]: CaseStageNode };

export const caseStageEdgeTypes: EdgeTypes = { stage: StageEdge };

export const task = (
  id: string,
  label: string,
  type: TaskItemTypeValues,
  extra: Partial<StageTaskItem> = {}
): StageTaskItem => ({
  id,
  label,
  icon: <TaskIcon type={type} size="sm" />,
  ...extra,
});

export const triggerNode = (x: number, y: number, label = 'Trigger', id = 'trigger') =>
  createNode({
    id,
    type: TRIGGER_NODE_TYPE,
    position: { x, y },
    data: {
      nodeType: TRIGGER_NODE_TYPE,
      version: caseManagementTriggerManifest.version,
      display: { label },
    },
  });

export const stageNode = (
  id: string,
  label: string,
  x: number,
  y: number,
  data: Omit<CaseStageData, 'display'> = {}
): Node => ({
  ...createNode({
    id,
    type: STAGE_NODE_TYPE,
    position: { x, y },
    data: {
      nodeType: STAGE_NODE_TYPE,
      version: caseManagementStageManifest.version,
      display: { label },
      inputs: { stageType: 'primary' },
      ...data,
    },
  }),
  width: STAGE_WIDTH,
});

export const stageEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  type: 'stage',
  source,
  sourceHandle: `${source}____source____right`,
  target,
  targetHandle: `${target}____target____left`,
});

export const triggerEdge = (target: string, source = 'trigger'): Edge => ({
  id: `${source}-${target}`,
  source,
  sourceHandle: 'output',
  target,
  targetHandle: `${target}____target____left`,
});
