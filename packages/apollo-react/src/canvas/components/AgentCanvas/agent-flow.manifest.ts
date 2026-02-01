/**
 * Agent Flow Node Manifests
 *
 * Basic manifests for agent and resource nodes.
 * Runtime behavior (dynamic handles, toolbars, adornments) is handled via BaseNodeData.
 */

import type {
  CategoryManifest,
  NodeManifest,
  WorkflowManifest,
} from '../../schema/node-definition';

// ============================================================================
// Categories
// ============================================================================

export const agentFlowCategories: CategoryManifest[] = [
  {
    id: 'agent',
    name: 'Agents',
    sortOrder: 1,
    color: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    colorDark: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
    icon: 'smart_toy',
    tags: ['agent', 'ai', 'automation'],
  },
  {
    id: 'resource',
    name: 'Resources',
    sortOrder: 2,
    color: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    colorDark: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
    icon: 'folder',
    tags: ['resource', 'data', 'context'],
  },
];

// ============================================================================
// Agent Nodes
// ============================================================================

export const conversationalAgentManifest: NodeManifest = {
  nodeType: 'uipath.agent.conversational',
  version: '1.0.0',
  category: 'agent',
  tags: ['agent', 'conversational', 'ai'],
  sortOrder: 1,
  display: {
    label: 'Conversational Agent',
    description: 'An agent that can engage in conversations',
    icon: 'chat',
    shape: 'rectangle',
  },
  handleConfiguration: [
    // Note: Actual handle visibility and configuration is controlled at runtime via data.handleConfigurations
    // These serve as the base configuration that can be overridden
    {
      position: 'top',
      handles: [
        {
          id: 'memorySpace',
          type: 'source',
          handleType: 'artifact',
          label: 'Memory',
          showButton: false,
        },
        {
          id: 'escalation',
          type: 'source',
          handleType: 'artifact',
          label: 'Escalation',
          showButton: false,
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
          showButton: false,
        },
        {
          id: 'tool',
          type: 'source',
          handleType: 'artifact',
          label: 'Tools',
          showButton: false,
        },
      ],
    },
  ],
};

export const autonomousAgentManifest: NodeManifest = {
  nodeType: 'uipath.agent.autonomous',
  version: '1.0.0',
  category: 'agent',
  tags: ['agent', 'autonomous', 'ai'],
  sortOrder: 2,
  display: {
    label: 'Autonomous Agent',
    description: 'An agent that can work independently',
    icon: 'precision_manufacturing',
    shape: 'rectangle',
  },
  handleConfiguration: [
    // Same base structure as conversational
    {
      position: 'top',
      handles: [
        {
          id: 'memorySpace',
          type: 'source',
          handleType: 'artifact',
          label: 'Memory',
          showButton: false,
        },
        {
          id: 'escalation',
          type: 'source',
          handleType: 'artifact',
          label: 'Escalation',
          showButton: false,
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
          showButton: false,
        },
        {
          id: 'tool',
          type: 'source',
          handleType: 'artifact',
          label: 'Tools',
          showButton: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Resource Nodes
// ============================================================================

export const contextResourceManifest: NodeManifest = {
  nodeType: 'uipath.resource.context',
  version: '1.0.0',
  category: 'resource',
  tags: ['resource', 'context', 'data'],
  sortOrder: 1,
  display: {
    label: 'Context',
    description: 'Context information for agents',
    icon: 'description',
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
        },
      ],
    },
  ],
};

export const toolResourceManifest: NodeManifest = {
  nodeType: 'uipath.resource.tool',
  version: '1.0.0',
  category: 'resource',
  tags: ['resource', 'tool', 'function'],
  sortOrder: 2,
  display: {
    label: 'Tool',
    description: 'A tool or function for agents to use',
    icon: 'build',
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
        },
      ],
    },
  ],
};

export const mcpResourceManifest: NodeManifest = {
  nodeType: 'uipath.resource.mcp',
  version: '1.0.0',
  category: 'resource',
  tags: ['resource', 'mcp', 'protocol'],
  sortOrder: 3,
  display: {
    label: 'MCP Resource',
    description: 'Model Context Protocol resource',
    icon: 'hub',
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
        },
      ],
    },
  ],
};

export const escalationResourceManifest: NodeManifest = {
  nodeType: 'uipath.resource.escalation',
  version: '1.0.0',
  category: 'resource',
  tags: ['resource', 'escalation', 'human'],
  sortOrder: 4,
  display: {
    label: 'Escalation',
    description: 'Escalation point for human intervention',
    icon: 'person',
    shape: 'circle',
  },
  handleConfiguration: [
    {
      position: 'bottom',
      handles: [
        {
          id: 'input',
          type: 'target',
          handleType: 'artifact',
        },
      ],
    },
  ],
};

export const memoryResourceManifest: NodeManifest = {
  nodeType: 'uipath.resource.memory',
  version: '1.0.0',
  category: 'resource',
  tags: ['resource', 'memory', 'storage'],
  sortOrder: 5,
  display: {
    label: 'Memory Space',
    description: 'Memory storage for agent state',
    icon: 'memory',
    shape: 'circle',
  },
  handleConfiguration: [
    {
      position: 'bottom',
      handles: [
        {
          id: 'input',
          type: 'target',
          handleType: 'artifact',
        },
      ],
    },
  ],
};

// ============================================================================
// Combined Manifest
// ============================================================================

export const agentFlowManifest: WorkflowManifest = {
  version: '1.0.0',
  categories: agentFlowCategories,
  nodes: [
    conversationalAgentManifest,
    autonomousAgentManifest,
    contextResourceManifest,
    toolResourceManifest,
    mcpResourceManifest,
    escalationResourceManifest,
    memoryResourceManifest,
  ],
};
