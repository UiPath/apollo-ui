/**
 * Case Management Flow Node Manifests
 *
 * Phase 1 manifests for case-management node types.
 * See: https://uipath.atlassian.net/wiki/spaces/~5d0b4d163e70300bc9758674/pages/90446398009/Case+Unified+schema+onboarding
 *
 * Scope (this file): trigger and stage nodes. Exception stages are regular stages
 * with `stageType: 'secondary'` instance data (the two node types were combined),
 * so they share the stage manifest. Task, condition, and edge manifests are
 * intentionally out of scope.
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
    icon: 'square-plus',
    tags: ['stage', 'case'],
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
 * Stage node manifest per the unified-schema onboarding doc, adjusted per review:
 * `display.shape` is `'container'` (the doc's `'group'` is not a valid `NodeShape`),
 * the doc's top condition handles are omitted (conditions have no manifest or visual
 * display yet), and category ids follow the ones landed here
 * (`case-management-trigger`), not the doc's `case-trigger` shorthand.
 */
export const caseManagementStageManifest: NodeManifest = {
  nodeType: 'uipath.case.stage',
  version: '1.0.0',
  description: 'A stage in the case lifecycle containing tasks and SLA configuration.',
  category: 'case-stage',
  tags: ['stage', 'case'],
  sortOrder: 0,
  display: {
    label: 'Stage',
    description: 'A grouping of tasks',
    icon: 'square-plus',
    shape: 'container',
    shadow: false,
  },
  handleConfiguration: [
    // LEFT: target from the trigger or previous stages
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
    // RIGHT: source to the next stage, with the standard add button
    {
      position: 'right',
      handles: [
        {
          id: 'next',
          type: 'source',
          handleType: 'output',
          showButton: true,
          isDefaultForType: true,
          constraints: {
            allowedTargetCategories: ['case-stage'],
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
      ],
    },
    // BOTTOM: re-entry output back to earlier stages
    {
      position: 'bottom',
      handles: [
        {
          id: 'reentry',
          type: 'source',
          handleType: 'output',
          showButton: false,
          constraints: {
            allowedTargetCategories: ['case-stage'],
          },
        },
      ],
    },
  ],
  // Mirrors the current stage node's data model (PO.Frontend
  // CaseManagementJsonStageNodeDataSchema): tasks, entry/exit rules, SLA rules,
  // and the secondary (exception) stage marker. Loosely typed like the trigger's
  // context/bindings; the consumer's zod schemas remain the source of truth.
  inputDefinition: {
    name: { type: 'string', description: 'Stage display name' },
    tasks: {
      type: 'array',
      items: { type: 'array', items: { type: 'object' } },
      description:
        'Task groups: the outer array is execution order, tasks within an inner array run in parallel.',
    },
    entryConditions: {
      type: 'array',
      items: { type: 'object' },
      description: 'Stage entry rules.',
    },
    exitConditions: {
      type: 'array',
      items: { type: 'object' },
      description: 'Stage exit rules.',
    },
    slaRules: {
      type: 'array',
      items: { type: 'object' },
      description: 'SLA rules with escalations; the last entry is the default rule.',
    },
    stageType: {
      type: 'string',
      enum: ['primary', 'secondary'],
      nullable: true,
      description: 'Set to "secondary" for exception stages (the combined node type).',
    },
  },
};

// ============================================================================
// Combined Manifest
// ============================================================================

export const caseFlowManifest = {
  version: '1.0.0',
  categories: caseFlowCategories,
  nodes: [caseManagementTriggerManifest, caseManagementStageManifest],
};
