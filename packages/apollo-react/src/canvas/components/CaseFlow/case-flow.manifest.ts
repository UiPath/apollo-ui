/**
 * Case Management Flow Node Manifests
 *
 * Phase 1 manifests for case-management node types.
 * See: https://uipath.atlassian.net/wiki/spaces/~5d0b4d163e70300bc9758674/pages/90446398009/Case+Unified+schema+onboarding
 *
 * Scope (this file): trigger and stage nodes.
 * Exception stage, task, condition, and edge manifests are intentionally out of scope.
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

export const caseManagementStageManifest: NodeManifest = {
  nodeType: 'uipath.case.stage',
  version: '1.0.0',
  description: 'A phase of a case that groups the tasks run while the case is in it.',
  category: 'case-stage',
  tags: ['stage', 'case', 'phase'],
  sortOrder: 0,
  display: {
    label: 'Stage',
    description: 'Groups the tasks a case runs while it is in this phase',
    icon: 'square-plus',
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
          id: 'output',
          type: 'source',
          handleType: 'output',
          showButton: true,
          constraints: {
            allowedTargetCategories: ['case-stage'],
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
      ],
    },
  ],
  inputDefinition: {
    stageType: {
      type: 'string',
      enum: ['primary', 'secondary'],
      default: 'primary',
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
