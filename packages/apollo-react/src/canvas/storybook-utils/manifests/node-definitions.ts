import { NodeManifest } from "../../schema/node-definition";

export const allNodeManifests: NodeManifest[] = [
  // First Run Node
  {
    nodeType: 'uipath.first-run',
    version: '1.0.0',
    category: 'trigger',
    tags: ['trigger', 'start'],
    sortOrder: 0,
    display: {
      label: 'Add trigger',
      icon: 'plus',
      shape: 'circle',
    },
    handleConfiguration: [],
  },

  // Blank Node
  {
    nodeType: 'uipath.blank-node',
    version: '1.0.0',
    category: 'recommended',
    tags: ['blank', 'todo'],
    sortOrder: 2,
    display: {
      label: 'Blank',
      icon: 'construction',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        visible: true,
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
        visible: true,
      },
    ],
  },

  // Timer Activity (Delay)
  {
    nodeType: 'uipath.timer-activity',
    version: '1.0.0',
    category: 'control-flow',
    tags: ['control', 'flow', 'logic', 'if', 'switch', 'loop'],
    sortOrder: 20,
    display: {
      label: 'Delay',
      icon: 'timer',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
      },
    ],
  },

  // Timer Trigger (Schedule)
  {
    nodeType: 'uipath.timer-trigger',
    version: '1.0.0',
    category: 'trigger',
    tags: ['trigger', 'start', 'event'],
    sortOrder: 40,
    display: {
      label: 'Schedule trigger',
      icon: 'timer',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
      },
    ],
  },

  // Decision (Control Flow)
  {
    nodeType: 'uipath.control-flow.decision',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'if', 'loop', 'switch'],
    sortOrder: 1,
    display: {
      label: 'Decision',
      icon: 'uipath.decision',
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
              forbiddenSourceCategories: ['trigger'],
              validationMessage:
                'Control flow cannot be directly triggered or accept configuration nodes',
            },
          },
        ],
        visible: true,
      },
      {
        position: 'right',
        handles: [
          {
            id: 'true',
            type: 'source',
            handleType: 'output',
            label: 'True',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
              forbiddenTargets: [
                { nodeType: 'uipath.agent.resource.memory' },
                { nodeType: 'uipath.agent.resource.escalation' },
                { nodeType: 'uipath.agent.resource.context' },
                { nodeType: 'uipath.agent.resource.tool' },
              ],
            },
          },
          {
            id: 'false',
            type: 'source',
            handleType: 'output',
            label: 'False',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
              forbiddenTargets: [
                { nodeType: 'uipath.agent.resource.memory' },
                { nodeType: 'uipath.agent.resource.escalation' },
                { nodeType: 'uipath.agent.resource.context' },
                { nodeType: 'uipath.agent.resource.tool' },
              ],
            },
          },
        ],
        visible: true,
      },
    ],
  },

  // Switch (Control Flow)
  {
    nodeType: 'uipath.control-flow.switch',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'switch'],
    sortOrder: 2,
    display: {
      label: 'Switch',
      icon: 'uipath.switch',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
        visible: true,
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
        visible: true,
      },
    ],
  },

  // Manual Trigger
  {
    nodeType: 'uipath.manual-trigger',
    version: '1',
    category: 'trigger',
    tags: ['trigger', 'manual'],
    sortOrder: 1,
    display: {
      label: 'Manual trigger',
      icon: 'play',
      shape: 'circle',
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
              forbiddenTargets: [
                { nodeType: 'uipath.trigger.*' },
                { nodeType: 'uipath.agent-model' },
                { nodeType: 'uipath.agent-prompt' },
                { nodeType: 'uipath.agent-tool' },
              ],
              forbiddenTargetCategories: ['trigger'],
              minConnections: 1,
              validationMessage:
                'Trigger must connect to at least one workflow node (not configuration nodes)',
            },
          },
        ],
        visible: true,
      },
    ],
  },

  // For Each Loop
  {
    nodeType: 'uipath.control-flow.foreach',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'loop', 'iteration'],
    sortOrder: 3,
    display: {
      label: 'For Each',
      icon: 'repeat',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'success',
            label: 'Completed',
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'body',
            label: 'Body',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // While Loop
  {
    nodeType: 'uipath.control-flow.while',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'loop', 'while'],
    sortOrder: 4,
    display: {
      label: 'While',
      icon: 'repeat',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [
          { id: 'input', type: 'target', handleType: 'input' },
          { id: 'loopBack', type: 'target', handleType: 'input' },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'success',
            label: 'Completed',
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'body',
            label: 'Body',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // Try-Catch (Error Handling)
  {
    nodeType: 'uipath.control-flow.try-catch',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'error', 'exception'],
    sortOrder: 5,
    display: {
      label: 'Try-Catch',
      icon: 'shield-alert',
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
              maxConnections: 1,
              forbiddenSourceCategories: ['trigger'],
            },
          },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'try',
            label: 'Try',
            type: 'source',
            handleType: 'output',
            constraints: {
              minConnections: 1,
              forbiddenTargetCategories: ['trigger'],
              validationMessage: 'Try block must be connected',
            },
          },
          {
            id: 'catch',
            label: "Catch ({errorType || 'Any'})",
            type: 'source',
            handleType: 'output',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
            },
          },
          {
            id: 'finally',
            label: 'Finally',
            type: 'source',
            handleType: 'output',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
            },
          },
        ],
      },
    ],
  },

  // Parallel (Fork)
  {
    nodeType: 'uipath.control-flow.parallel',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'parallel', 'concurrent'],
    sortOrder: 6,
    display: {
      label: 'Parallel',
      icon: 'git-fork',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'branch1',
            label: "{parameters.branch1Label || 'Branch 1'}",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'branch2',
            label: "{parameters.branch2Label || 'Branch 2'}",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'branch3',
            label: "{parameters.branch3Label || 'Branch 3'}",
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // Terminate
  {
    nodeType: 'uipath.control-flow.terminate',
    version: '1',
    category: 'control-flow',
    tags: ['control-flow', 'end', 'stop'],
    sortOrder: 99,
    display: {
      label: 'Terminate',
      icon: 'octagon',
      shape: 'circle',
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
              maxConnections: 1,
              forbiddenSources: [{ nodeType: 'uipath.trigger.*' }],
              forbiddenSourceCategories: ['trigger'],
              validationMessage: 'Terminate cannot be directly connected to triggers',
            },
          },
        ],
      },
    ],
  },

  // Transform Data
  {
    nodeType: 'uipath.data.transform',
    version: '1',
    category: 'data-and-tools',
    tags: ['data', 'transformation'],
    sortOrder: 2,
    display: {
      label: 'Transform',
      icon: 'rotate-cw',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [{ id: 'output', type: 'source', handleType: 'output' }],
      },
    ],
  },

  // Agent Memory (Configuration Node)
  {
    nodeType: 'uipath.agent.resource.memory',
    version: '1',
    category: 'agent',
    tags: ['agentic', 'ai', 'memory'],
    sortOrder: 0,
    display: {
      label: 'Agent Memory',
      icon: 'database',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'top',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'artifact',
            constraints: {
              allowedSources: [{ nodeType: 'uipath.agent', handleId: 'memory' }],
              validationMessage: "Agent Memory can only connect to Agent node's memory input",
            },
          },
        ],
      },
    ],
  },

  // Agent Escalation (Configuration Node)
  {
    nodeType: 'uipath.agent.resource.escalation',
    version: '1',
    category: 'agent',
    tags: ['agentic', 'ai', 'escalation'],
    sortOrder: 0,
    display: {
      label: 'Agent Escalation',
      icon: 'person-standing',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'top',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'artifact',
            constraints: {
              allowedSources: [{ nodeType: 'uipath.agent', handleId: 'escalation' }],
              validationMessage:
                "Agent Escalation can only connect to Agent node's escalation input",
            },
          },
        ],
      },
    ],
  },

  // Agent Context (Configuration Node)
  {
    nodeType: 'uipath.agent.resource.context',
    version: '1',
    category: 'agent',
    tags: ['agentic', 'ai', 'context'],
    sortOrder: 0,
    display: {
      label: 'Context',
      icon: 'message-square',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'top',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'artifact',
            constraints: {
              allowedSources: [{ nodeType: 'uipath.agent', handleId: 'context' }],
              validationMessage: "Agent Context can only connect to Agent node's context input",
            },
          },
        ],
      },
    ],
  },

  // Agent Tools (Configuration Node)
  {
    nodeType: 'uipath.agent.resource.tool',
    version: '1',
    category: 'agent',
    tags: ['agentic', 'ai', 'tools', 'functions'],
    sortOrder: 0,
    display: {
      label: 'Agent Tools',
      icon: 'wrench',
      shape: 'circle',
    },
    handleConfiguration: [
      {
        position: 'top',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'artifact',
            constraints: {
              allowedSources: [{ nodeType: 'uipath.agent', handleId: 'tool' }],
              validationMessage: "Agent Tools can only connect to Agent node's tools input",
            },
          },
        ],
      },
    ],
  },

  // Agent
  {
    nodeType: 'uipath.agent',
    version: '1',
    category: 'agent',
    tags: ['agentic', 'ai', 'agent'],
    sortOrder: 1,
    display: {
      label: 'Agent',
      icon: 'uipath.agent',
      shape: 'rectangle',
      iconBackground: 'linear-gradient(135deg, #FFE0FF 4.81%, #CFD9FF 97.27%)',
    },
    handleConfiguration: [
      {
        position: 'top',
        handles: [
          {
            id: 'memory',
            type: 'source',
            handleType: 'artifact',
            label: 'Memory',
            constraints: {
              allowedTargets: [{ nodeType: 'uipath.agent.resource.memory' }],
              validationMessage: 'Only Agent Memory nodes can connect here',
            },
          },
          {
            id: 'escalation',
            type: 'source',
            handleType: 'artifact',
            label: 'Escalations',
            constraints: {
              allowedTargets: [{ nodeType: 'uipath.agent.resource.escalation' }],
              validationMessage: 'Only Agent Escalation nodes can connect here',
            },
          },
        ],
      },
      {
        position: 'bottom',
        handles: [
          {
            id: 'context',
            type: 'source',
            handleType: 'artifact',
            label: 'Context',
            constraints: {
              allowedTargets: [{ nodeType: 'uipath.agent.resource.context' }],
              maxConnections: 1,
              validationMessage: 'Only Agent Context nodes can connect here',
            },
          },
          {
            id: 'tools',
            type: 'source',
            handleType: 'artifact',
            label: 'Tools',
            constraints: {
              allowedTargets: [{ nodeType: 'uipath.agent.resource.tool' }],
              validationMessage: 'Only Agent Tools nodes can connect here',
            },
          },
        ],
      },
      {
        position: 'left',
        handles: [
          {
            id: 'input',
            type: 'target',
            handleType: 'input',
            constraints: {
              forbiddenSourceCategories: ['trigger'],
              validationMessage: 'Agents cannot be directly triggered',
            },
          },
        ],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'success',
            label: "{agentName || 'Agent'}",
            type: 'source',
            handleType: 'output',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
            },
          },
          {
            id: 'error',
            label: 'Error',
            type: 'source',
            handleType: 'output',
            constraints: {
              forbiddenTargetCategories: ['trigger'],
            },
          },
        ],
      },
    ],
  },

  // Code Interpreter
  {
    nodeType: 'uipath.script',
    version: '1',
    category: 'data-and-tools',
    tags: ['code', 'javascript', 'python'],
    sortOrder: 3,
    display: {
      label: 'Script',
      icon: 'code',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'success',
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'error',
            label: 'Error',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // Approval Task
  {
    nodeType: 'uipath.human-task.approval',
    version: '1',
    category: 'human-task',
    tags: ['human-task', 'approval', 'review'],
    sortOrder: 1,
    display: {
      label: 'Approval',
      icon: 'uipath.human-task',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'approved',
            label: "{parameters.approveLabel || 'Approved'}",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'rejected',
            label: "{parameters.rejectLabel || 'Rejected'}",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'timeout',
            label: 'Timeout ({timeoutMinutes || 60}m)',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // Form Task
  {
    nodeType: 'uipath.human-task.form',
    version: '1',
    category: 'human-task',
    tags: ['human-task', 'form', 'input'],
    sortOrder: 2,
    display: {
      label: 'Form',
      icon: 'file-text',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'submitted',
            label: "Submitted ({formName || 'Form'})",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'cancelled',
            label: 'Cancelled',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // Call Workflow (Sub-workflow)
  {
    nodeType: 'uipath.workflow.call',
    version: '1',
    category: 'rpa-workflow',
    tags: ['rpa', 'workflow', 'subprocess'],
    sortOrder: 1,
    display: {
      label: 'Call Workflow',
      icon: 'uipath.rpa',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'success',
            label: "{workflowName || 'Workflow'}",
            type: 'source',
            handleType: 'output',
          },
          {
            id: 'error',
            label: 'Error',
            type: 'source',
            handleType: 'output',
          },
        ],
      },
    ],
  },

  // API Workflow Trigger
  {
    nodeType: 'uipath.api-workflow',
    version: '1',
    category: 'api-workflow',
    tags: ['api', 'workflow', 'endpoint'],
    sortOrder: 1,
    display: {
      label: 'API Workflow',
      icon: 'uipath.api',
      shape: 'square',
    },
    handleConfiguration: [
      {
        position: 'left',
        handles: [{ id: 'input', type: 'target', handleType: 'input' }],
      },
      {
        position: 'right',
        handles: [
          {
            id: 'output',
            type: 'source',
            handleType: 'output',
            label: "{method || 'POST'} /{path || 'endpoint'}",
          },
        ],
      },
    ],
  },
];
