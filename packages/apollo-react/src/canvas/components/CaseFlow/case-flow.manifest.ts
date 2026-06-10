/**
 * Case Management Flow Node Manifests
 *
 * Phase 1 manifests for case-management node types.
 * See: https://uipath.atlassian.net/wiki/spaces/~5d0b4d163e70300bc9758674/pages/90446398009/Case+Unified+schema+onboarding
 *
 * Scope (this file): trigger nodes, stage nodes, and the generic task definition.
 * Condition and sticky-note manifests are intentionally out of scope (P2/P3).
 */

import type { CategoryManifest, NodeManifest } from '../../schema/node-definition';

// ============================================================================
// Categories
// ============================================================================

export const caseFlowCategories: CategoryManifest[] = [
  {
    id: 'case-management-trigger',
    name: 'Triggers',
    sortOrder: 0,
    color: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
    colorDark: 'linear-gradient(135deg, #E65100 0%, #EF6C00 100%)',
    icon: 'zap',
    tags: ['trigger', 'start', 'case', 'event'],
  },
  {
    id: 'case-stage',
    name: 'Stages',
    sortOrder: 1,
    color: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    colorDark: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
    icon: 'layers',
    tags: ['stage', 'phase', 'case'],
  },
  {
    id: 'case-task',
    name: 'Tasks',
    sortOrder: 2,
    color: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    colorDark: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    icon: 'list-todo',
    tags: ['task', 'work', 'case'],
  },
];

// ============================================================================
// Trigger Nodes
// ============================================================================

export const caseManagementTriggerManifest: NodeManifest = {
  nodeType: 'uipath.case.trigger',
  version: '1.0.0',
  description: 'Entry point for a case management workflow.',
  category: 'case-management-trigger',
  tags: ['trigger', 'start', 'case', 'event', 'timer'],
  sortOrder: 0,
  display: {
    label: 'Trigger',
    description: 'Starts a case instance and triggers a case entered event',
    icon: 'zap',
    shape: 'circle',
    shadow: false,
  },
  handleConfiguration: [
    {
      position: 'right',
      handles: [
        {
          id: 'output',
          type: 'source',
          handleType: 'output',
          showButton: true,
          constraints: {
            minConnections: 1,
            allowedTargetCategories: ['case-stage'],
            forbiddenTargetCategories: ['case-management-trigger', 'case-condition'],
          },
        },
      ],
    },
  ],
  inputDefinition: {
    serviceType: {
      type: 'string',
      enum: ['None', 'Intsvc.EventTrigger', 'timer'],
      nullable: true,
      default: 'None',
    },
    timerType: { type: 'string', nullable: true },
    timeCycle: { type: 'string' },
    context: { type: 'array', items: { type: 'object' } },
    bindings: { type: 'array', items: { type: 'object' } },
  },
  toolbarExtensions: {
    design: {
      actions: [
        {
          id: 'change-trigger-type',
          icon: 'square-mouse-pointer',
          label: 'Change trigger type',
        },
      ],
    },
  },
  suppressDefaultToolbarActions: {
    design: ['breakpoint'],
    debug: ['breakpoint'],
  },
};

// ============================================================================
// Stage Nodes
// ============================================================================

/**
 * Stage node — a phase in the case lifecycle containing tasks, SLA rules, and
 * entry/exit conditions. Secondary (exception) stages are the same node type
 * with `inputs.stageType: 'secondary'`, mirroring PO.Frontend's v21+ merge of
 * `case-management:ExceptionStage` into `case-management:Stage`.
 */
export const caseManagementStageManifest: NodeManifest = {
  nodeType: 'uipath.case.stage',
  version: '1.0.0',
  description: 'A phase in the case lifecycle containing tasks and SLA configuration.',
  category: 'case-stage',
  tags: ['stage', 'phase', 'case', 'subprocess'],
  sortOrder: 0,
  display: {
    label: 'Stage',
    description: 'A grouping of tasks within the case lifecycle',
    icon: 'layers',
    shape: 'rectangle',
  },
  handleConfiguration: [
    {
      position: 'left',
      handles: [
        {
          id: 'input',
          type: 'target',
          handleType: 'input',
          isDefaultForType: true,
          constraints: {
            allowedSourceCategories: ['case-management-trigger', 'case-stage'],
          },
        },
      ],
    },
    {
      position: 'right',
      handles: [
        {
          id: 'next',
          type: 'source',
          handleType: 'output',
          label: 'Next',
          showButton: true,
          isDefaultForType: true,
          constraints: {
            allowedTargetCategories: ['case-stage'],
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
      ],
    },
    {
      position: 'bottom',
      handles: [
        {
          id: 'reentry',
          type: 'source',
          handleType: 'output',
          label: 'Re-entry',
          showButton: false,
          constraints: {
            allowedTargetCategories: ['case-stage'],
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
      ],
    },
  ],
  model: { bpmnElement: 'bpmn:SubProcess' },
  inputDefinition: {
    stageType: {
      type: 'string',
      enum: ['primary', 'secondary'],
      default: 'primary',
      description: 'Secondary stages handle exception flows; the distinction is visual and rules-driven.',
    },
    instanceIdPrefix: { type: 'string' },
    tasks: {
      type: 'array',
      items: { type: 'array', items: { type: 'object' } },
      description: 'Two-dimensional task grid. Outer groups run in parallel; inner items run sequentially.',
    },
    slaRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
          count: { type: 'number' },
          unit: { type: 'string', enum: ['min', 'h', 'd', 'w', 'm'] },
          escalationRule: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    entryConditions: {
      type: 'array',
      items: { type: 'object' },
      description: 'Conditions for entering this stage. Rule[][] disjunctive-normal-form format.',
    },
    exitConditions: {
      type: 'array',
      items: { type: 'object' },
      description: 'Conditions and behavior for exiting this stage.',
    },
  },
  defaultProperties: {
    inputs: { stageType: 'primary', tasks: [] },
  },
};

// ============================================================================
// Task Definition
// ============================================================================

/**
 * Generic case task definition (P1 of the unified-schema onboarding: a single
 * manifest for all task types; per-type manifests are P2). Task instances stay
 * embedded in their stage's `inputs.tasks` 2D array — they are not canvas
 * nodes yet, so the manifest declares no handles.
 */
export const caseManagementTaskManifest: NodeManifest = {
  nodeType: 'uipath.case.task',
  version: '1.0.0',
  description: 'A unit of work inside a case stage (process, action, agent, timer, connector, …).',
  category: 'case-task',
  tags: ['task', 'work', 'case'],
  sortOrder: 0,
  display: {
    label: 'Task',
    description: 'A unit of work executed within a stage',
    icon: 'list-todo',
    shape: 'square',
  },
  handleConfiguration: [],
  inputDefinition: {
    type: {
      type: 'string',
      description: 'Task discriminator — process, action, agent, external-agent, rpa, api-workflow, …',
    },
    displayName: { type: 'string' },
    shouldRunOnlyOnce: { type: 'boolean' },
    entryConditions: {
      type: 'array',
      items: { type: 'object' },
      description: 'Conditions for starting this task. Rule[][] disjunctive-normal-form format.',
    },
  },
  defaultProperties: {
    inputs: { entryConditions: [] },
  },
};

// ============================================================================
// Combined Manifest
// ============================================================================

export const caseFlowManifest = {
  version: '1.0.0',
  categories: caseFlowCategories,
  nodes: [caseManagementTriggerManifest, caseManagementStageManifest, caseManagementTaskManifest],
};
