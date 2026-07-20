/**
 * Case Management Flow Node Manifests
 *
 * Manifests for case-management node types.
 * See: https://uipath.atlassian.net/wiki/spaces/~5d0b4d163e70300bc9758674/pages/90446398009/Case+Unified+schema+onboarding
 *
 * Phase 1: trigger nodes.
 * Phase 2 (POC): stage (container/loop-based), tasks (sequential square, event and
 * adhoc circle markers), rule condition circles, and case complete / case exit
 * lifecycle circles. Every case rule is representable as a handle, a node, or an
 * edge:
 * - the stage's INNER handles carry the labeled lifecycle, Enter / Complete /
 *   Exit, mapping 1:1 onto the loop node's start / continue / break; the outer
 *   handles are unlabeled connection points
 * - stage-level rules live OUTSIDE the stage, on the transitions: entry rule
 *   circles sit before the stage's outer `enter` handle; complete / exit rule
 *   circles are fed by the stage's outer `complete` / `exit` handles and gate
 *   what happens next (the next stage, case complete, case exit). A rule circle
 *   on the edge between two stages IS the cross-stage dependency rule.
 * - inside the stage there are only tasks and task-level rule markers (event /
 *   adhoc); sequential task order is the edge chain from the inner Enter handle
 *   to the inner Complete (or Exit) handle
 * - case complete / case exit rules are big lifecycle circles fed by stage
 *   complete / exit handles (directly or through a rule circle)
 */

import type { CategoryManifest, NodeManifest } from '../../schema/node-definition';

/** Default diameter for the big lifecycle circles (trigger, case complete/exit). */
export const CASE_LIFECYCLE_NODE_SIZE = 96;
/**
 * Default diameter for the small rule / event / adhoc marker circles.
 * 64px is the smallest square BaseNode supports for a node with one handle per
 * side: its minimum-height rule reserves a 2-grid lane per left/right handle
 * plus 2 grid spaces of padding ((1 * 2 + 2) * 16px). Anything smaller gets its
 * height forced back up, which renders as an oval instead of a circle.
 */
export const CASE_MARKER_NODE_SIZE = 64;

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
    icon: 'layout-panel-top',
    tags: ['case', 'stage'],
  },
  {
    id: 'case-task',
    name: 'Tasks',
    sortOrder: 2,
    color: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    colorDark: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    icon: 'clipboard-list',
    tags: ['case', 'task'],
  },
  {
    id: 'case-condition',
    name: 'Rules',
    sortOrder: 3,
    color: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
    colorDark: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%)',
    icon: 'git-branch',
    tags: ['case', 'rule', 'condition'],
  },
  {
    id: 'case-lifecycle',
    name: 'Case lifecycle',
    sortOrder: 4,
    color: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
    colorDark: 'linear-gradient(135deg, #B71C1C 0%, #C62828 100%)',
    icon: 'flag',
    tags: ['case', 'complete', 'exit'],
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
            // Triggers start stages, either directly or through an entry rule circle.
            allowedTargetCategories: ['case-stage', 'case-condition'],
            forbiddenTargetCategories: ['case-management-trigger'],
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
// Stage
// ============================================================================

/**
 * Case stage rendered by the loop container node (LoopNode).
 *
 * INNER handles carry the labeled stage lifecycle, mapping 1:1 onto the loop
 * node's start / continue / break:
 * - `onEnter` (label "Enter", loop start): starts the sequential task chain
 * - `onComplete` (label "Complete", loop continue): tasks that finish the stage
 * - `onExit` (label "Exit", loop break): tasks that abandon the stage
 *
 * OUTER handles are unlabeled plain connection points (like a regular loop
 * container): `enter` receives the trigger / previous stage / entry rules;
 * `complete` and `exit` feed rule circles, downstream stages, and the case
 * lifecycle circles.
 */
export const caseStageManifest: NodeManifest = {
  nodeType: 'uipath.case.stage',
  version: '1.0.0',
  description: 'A stage groups the tasks and rules of one phase of a case.',
  category: 'case-stage',
  tags: ['case', 'stage', 'container'],
  sortOrder: 0,
  display: {
    label: 'Stage',
    description: 'A phase of the case with tasks and entry, complete and exit rules',
    icon: 'layout-panel-top',
    shape: 'container',
  },
  handleConfiguration: [
    {
      position: 'left',
      handles: [
        {
          // Unlabeled on purpose: the outer boundary reads like a regular loop
          // container. The stage lifecycle labels live on the INNER handles.
          id: 'enter',
          type: 'target',
          handleType: 'input',
          constraints: {
            allowedSourceCategories: ['case-management-trigger', 'case-stage', 'case-condition'],
            validationMessage:
              'Stages are entered from the case trigger, other stages, or an entry rule',
          },
        },
      ],
    },
    {
      position: 'right',
      handles: [
        {
          id: 'complete',
          type: 'source',
          handleType: 'output',
          showButton: true,
          constraints: {
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
        {
          id: 'exit',
          type: 'source',
          handleType: 'output',
          showButton: true,
          constraints: {
            forbiddenTargetCategories: ['case-management-trigger'],
          },
        },
      ],
    },
    {
      position: 'left',
      boundary: 'inner',
      handles: [
        {
          id: 'onEnter',
          label: 'Enter',
          type: 'source',
          handleType: 'output',
          constraints: {
            allowedTargetCategories: ['case-task'],
            validationMessage: 'Enter starts the sequential task chain of this stage',
          },
        },
      ],
    },
    {
      position: 'right',
      boundary: 'inner',
      handles: [
        {
          id: 'onComplete',
          label: 'Complete',
          type: 'target',
          handleType: 'input',
          constraints: {
            allowedSourceCategories: ['case-task'],
            validationMessage: 'Tasks that finish the stage connect to Complete',
          },
        },
        {
          id: 'onExit',
          label: 'Exit',
          type: 'target',
          handleType: 'input',
          constraints: {
            allowedSourceCategories: ['case-task'],
            validationMessage: 'Tasks that abandon the stage connect to Exit',
          },
        },
      ],
    },
  ],
  inputDefinition: {
    stageType: { type: 'string', enum: ['primary', 'secondary'], default: 'primary' },
    isRequired: { type: 'boolean', default: true },
    description: { type: 'string' },
  },
  form: {
    id: 'case-stage-properties',
    title: 'Stage configuration',
    sections: [
      {
        id: 'general',
        title: 'General',
        defaultExpanded: true,
        fields: [
          { name: 'display.label', type: 'text', label: 'Name' },
          { name: 'display.description', type: 'textarea', label: 'Description', rows: 3 },
          {
            name: 'inputs.stageType',
            type: 'select',
            label: 'Stage type',
            options: [
              { label: 'Primary', value: 'primary' },
              { label: 'Secondary (exception)', value: 'secondary' },
            ],
          },
          { name: 'inputs.isRequired', type: 'switch', label: 'Required to complete the case' },
        ],
      },
    ],
  },
};

// ============================================================================
// Tasks
// ============================================================================

/** Square task node. An incoming edge from the stage onEnter handle or a previous task is a sequential run rule. */
export const caseTaskManifest: NodeManifest = {
  nodeType: 'uipath.case.task',
  version: '1.0.0',
  description: 'A unit of work inside a stage (process, action, agent, ...).',
  category: 'case-task',
  tags: ['case', 'task', 'work'],
  sortOrder: 0,
  display: {
    label: 'Task',
    description: 'A unit of work performed inside a stage',
    icon: 'clipboard-list',
    shape: 'square',
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
            allowedSourceCategories: ['case-stage', 'case-task', 'case-condition'],
            validationMessage:
              'Tasks run sequentially from the stage or a previous task, or from an event/adhoc marker',
          },
        },
      ],
    },
    {
      position: 'right',
      handles: [{ id: 'output', type: 'source', handleType: 'output', showButton: true }],
    },
  ],
  inputDefinition: {
    taskType: {
      type: 'string',
      enum: ['process', 'action', 'agent', 'api-workflow', 'rpa', 'function'],
      default: 'process',
    },
    isRequired: { type: 'boolean', default: true },
    runsOnlyOnce: { type: 'boolean', default: false },
  },
  form: {
    id: 'case-task-properties',
    title: 'Task configuration',
    sections: [
      {
        id: 'general',
        title: 'General',
        defaultExpanded: true,
        fields: [
          { name: 'display.label', type: 'text', label: 'Name' },
          {
            name: 'inputs.taskType',
            type: 'select',
            label: 'Task type',
            options: [
              { label: 'Process', value: 'process' },
              { label: 'Action (human task)', value: 'action' },
              { label: 'Agent', value: 'agent' },
              { label: 'API workflow', value: 'api-workflow' },
              { label: 'RPA workflow', value: 'rpa' },
              { label: 'Function', value: 'function' },
            ],
          },
        ],
      },
      {
        id: 'run-conditions',
        title: 'Run conditions',
        collapsible: true,
        defaultExpanded: true,
        fields: [
          { name: 'inputs.isRequired', type: 'switch', label: 'Required' },
          { name: 'inputs.runsOnlyOnce', type: 'switch', label: 'Runs only once' },
        ],
      },
    ],
  },
};

/** Small circle marker: an event-based task entry (wait-for-connector / conditional entry). */
export const caseEventMarkerManifest: NodeManifest = {
  nodeType: 'uipath.case.task.event',
  version: '1.0.0',
  description: 'Event rule that starts an event-based task.',
  category: 'case-condition',
  tags: ['case', 'task', 'event', 'rule'],
  sortOrder: 1,
  display: {
    label: 'Event',
    description: 'Starts the connected task when the event arrives',
    icon: 'zap',
    shape: 'circle',
    shadow: false,
  },
  handleConfiguration: [
    {
      position: 'left',
      handles: [
        {
          id: 'input',
          type: 'target',
          handleType: 'input',
          visible: false,
          constraints: { allowedSourceCategories: ['case-stage', 'case-management-trigger'] },
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
            allowedTargetCategories: ['case-task'],
            validationMessage: 'Event markers start tasks',
          },
        },
      ],
    },
  ],
  inputDefinition: {
    eventType: { type: 'string', enum: ['connector', 'timer', 'condition'], default: 'connector' },
    conditionExpression: { type: 'string' },
  },
  form: {
    id: 'case-event-marker-properties',
    title: 'Event rule',
    sections: [
      {
        id: 'general',
        title: 'General',
        defaultExpanded: true,
        fields: [
          {
            name: 'inputs.eventType',
            type: 'select',
            label: 'Event type',
            options: [
              { label: 'Connector event', value: 'connector' },
              { label: 'Timer', value: 'timer' },
              { label: 'Condition', value: 'condition' },
            ],
          },
          {
            name: 'inputs.conditionExpression',
            type: 'textarea',
            label: 'Condition expression',
            rows: 2,
          },
        ],
      },
    ],
  },
};

/** Small circle marker: an adhoc (manually triggered) task entry. */
export const caseAdhocMarkerManifest: NodeManifest = {
  nodeType: 'uipath.case.task.adhoc',
  version: '1.0.0',
  description: 'Manual (adhoc) rule that lets a user start the connected task on demand.',
  category: 'case-condition',
  tags: ['case', 'task', 'adhoc', 'manual', 'rule'],
  sortOrder: 2,
  display: {
    label: 'Manual',
    description: 'The connected task is started manually by a user',
    icon: 'play',
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
            allowedTargetCategories: ['case-task'],
            validationMessage: 'Manual markers start tasks',
          },
        },
      ],
    },
  ],
  form: {
    id: 'case-adhoc-marker-properties',
    title: 'Manual rule',
    sections: [
      {
        id: 'general',
        title: 'General',
        defaultExpanded: true,
        fields: [{ name: 'display.label', type: 'text', label: 'Name' }],
      },
    ],
  },
};

// ============================================================================
// Rule condition circles
// ============================================================================

const RULE_TYPE_OPTIONS = [
  { label: 'Case entered', value: 'case-entered' },
  { label: 'Selected stage completed', value: 'selected-stage-completed' },
  { label: 'Selected stage exited', value: 'selected-stage-exited' },
  { label: 'Selected tasks completed', value: 'selected-tasks-completed' },
  { label: 'Required tasks completed', value: 'required-tasks-completed' },
  { label: 'Wait for connector event', value: 'wait-for-connector' },
  { label: 'Adhoc (manual)', value: 'adhoc' },
];

/**
 * Rule circles live on the transitions outside the stage:
 * - entry rules sit BEFORE the stage: upstream (trigger / another stage's
 *   complete or exit handle) -> entry rule -> stage `enter`.
 * - complete / exit rules sit AFTER the stage: stage `complete` / `exit` ->
 *   rule -> downstream (next stage's enter or entry rule, case complete/exit).
 * A rule circle on the edge between two stages is exactly a cross-stage
 * dependency rule.
 */
function createRuleConditionManifest(options: {
  nodeType: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  attachment: 'entry' | 'complete' | 'exit';
}): NodeManifest {
  const inputConstraints =
    options.attachment === 'entry'
      ? {
          allowedSourceCategories: ['case-management-trigger', 'case-stage'],
          validationMessage: 'Entry rules are fed by the case trigger or by other stages',
        }
      : {
          allowedSources: [{ nodeType: 'uipath.case.stage', handleId: options.attachment }],
          validationMessage: `This rule is fed by a stage's ${options.attachment} handle`,
        };
  const outputConstraints =
    options.attachment === 'entry'
      ? {
          allowedTargets: [{ nodeType: 'uipath.case.stage', handleId: 'enter' }],
          validationMessage: "Entry rules connect to a stage's enter handle",
        }
      : {
          forbiddenTargetCategories: ['case-management-trigger', 'case-task'],
          validationMessage:
            'Complete and exit rules gate the transition to the next stage or the case lifecycle',
        };

  return {
    nodeType: options.nodeType,
    version: '1.0.0',
    description: options.description,
    category: 'case-condition',
    tags: ['case', 'rule', 'condition'],
    sortOrder: options.sortOrder,
    display: {
      label: options.label,
      description: options.description,
      icon: options.icon,
      shape: 'circle',
      shadow: false,
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
            constraints: inputConstraints,
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
            constraints: outputConstraints,
          },
        ],
      },
    ],
    inputDefinition: {
      rule: { type: 'string', enum: RULE_TYPE_OPTIONS.map((o) => o.value) },
      conditionExpression: { type: 'string' },
      selectedStageId: { type: 'string' },
    },
    form: {
      id: `${options.nodeType.replaceAll('.', '-')}-properties`,
      title: `${options.label} configuration`,
      sections: [
        {
          id: 'general',
          title: 'General',
          defaultExpanded: true,
          fields: [
            { name: 'display.label', type: 'text', label: 'Name' },
            { name: 'inputs.rule', type: 'select', label: 'Rule type', options: RULE_TYPE_OPTIONS },
            {
              name: 'inputs.conditionExpression',
              type: 'textarea',
              label: 'Condition expression',
              rows: 2,
            },
          ],
        },
      ],
    },
  };
}

export const caseEntryRuleManifest = createRuleConditionManifest({
  nodeType: 'uipath.case.rule.entry',
  label: 'Entry rule',
  description: 'Controls when the stage is entered',
  icon: 'log-in',
  sortOrder: 3,
  attachment: 'entry',
});

export const caseCompleteRuleManifest = createRuleConditionManifest({
  nodeType: 'uipath.case.rule.complete',
  label: 'Complete rule',
  description: 'Controls when the stage is considered complete',
  icon: 'check-check',
  sortOrder: 4,
  attachment: 'complete',
});

export const caseExitRuleManifest = createRuleConditionManifest({
  nodeType: 'uipath.case.rule.exit',
  label: 'Exit rule',
  description: 'Controls when the stage is exited without completing',
  icon: 'log-out',
  sortOrder: 5,
  attachment: 'exit',
});

// ============================================================================
// Case lifecycle circles (complete / exit)
// ============================================================================

function createCaseLifecycleManifest(options: {
  nodeType: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  marksCaseComplete: boolean;
}): NodeManifest {
  return {
    nodeType: options.nodeType,
    version: '1.0.0',
    description: options.description,
    category: 'case-lifecycle',
    tags: ['case', 'lifecycle', options.marksCaseComplete ? 'complete' : 'exit'],
    sortOrder: options.sortOrder,
    display: {
      label: options.label,
      description: options.description,
      icon: options.icon,
      shape: 'circle',
      shadow: false,
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
              minConnections: 1,
              allowedSourceCategories: ['case-stage', 'case-condition'],
              validationMessage:
                'Case lifecycle rules depend on stage complete / exit handles or rule circles',
            },
          },
        ],
      },
    ],
    inputDefaults: { marksCaseComplete: options.marksCaseComplete },
    inputDefinition: {
      marksCaseComplete: { type: 'boolean', default: options.marksCaseComplete },
      conditionExpression: { type: 'string' },
    },
    form: {
      id: `${options.nodeType.replaceAll('.', '-')}-properties`,
      title: `${options.label} configuration`,
      sections: [
        {
          id: 'general',
          title: 'General',
          defaultExpanded: true,
          fields: [
            { name: 'display.label', type: 'text', label: 'Name' },
            {
              name: 'inputs.conditionExpression',
              type: 'textarea',
              label: 'Condition expression',
              rows: 2,
            },
          ],
        },
      ],
    },
    suppressDefaultToolbarActions: {
      design: ['breakpoint'],
      debug: ['breakpoint'],
    },
  };
}

export const caseCompleteManifest = createCaseLifecycleManifest({
  nodeType: 'uipath.case.complete',
  label: 'Case complete',
  description: 'The case completes when the connected rules are satisfied',
  icon: 'flag',
  sortOrder: 0,
  marksCaseComplete: true,
});

export const caseExitManifest = createCaseLifecycleManifest({
  nodeType: 'uipath.case.exit',
  label: 'Case exit',
  description: 'The case exits without completing when the connected rules are satisfied',
  icon: 'circle-slash',
  sortOrder: 1,
  marksCaseComplete: false,
});

// ============================================================================
// Combined Manifest
// ============================================================================

export const caseFlowManifest = {
  version: '1.0.0',
  categories: caseFlowCategories,
  nodes: [
    caseManagementTriggerManifest,
    caseStageManifest,
    caseTaskManifest,
    caseEventMarkerManifest,
    caseAdhocMarkerManifest,
    caseEntryRuleManifest,
    caseCompleteRuleManifest,
    caseExitRuleManifest,
    caseCompleteManifest,
    caseExitManifest,
  ],
};
