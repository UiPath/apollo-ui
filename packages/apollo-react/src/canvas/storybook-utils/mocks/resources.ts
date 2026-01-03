import {
  type AgentFlowContextResource,
  type AgentFlowEscalationResource,
  type AgentFlowMcpResource,
  type AgentFlowMemorySpaceResource,
  type AgentFlowResource,
  type AgentFlowToolResource,
  ProjectType,
} from '../../types';

/**
 * Generates a unique resource ID.
 */
export const generateResourceId = (): string =>
  `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Sample context data for stories.
 */
export const sampleContexts = [
  { name: 'User Profile', description: 'Information about the current user' },
  { name: 'Session Context', description: 'Current session information' },
  { name: 'Organization Settings', description: 'Organization configuration' },
  { name: 'Environment Variables', description: 'System environment settings' },
] as const;

/**
 * Sample tool data for stories.
 */
export const sampleTools = [
  { name: 'Send Email', description: 'Email Service', projectType: ProjectType.Internal },
  { name: 'Query Database', description: 'Database', projectType: ProjectType.Internal },
  { name: 'Call API', description: 'REST API', projectType: ProjectType.Api },
  { name: 'Process Document', description: 'Document AI', projectType: ProjectType.Internal },
  { name: 'Run Automation', description: 'Automation', projectType: ProjectType.Internal },
] as const;

/**
 * Sample escalation data for stories.
 */
export const sampleEscalations = [
  { name: 'Manager Approval', description: 'Escalate to manager' },
  { name: 'Amount Exceeded', description: 'Transaction limit exceeded' },
  { name: 'Security Alert', description: 'Suspicious activity detected' },
  { name: 'Manual Review', description: 'Requires human review' },
] as const;

/**
 * Sample MCP server data for stories.
 */
export const sampleMcpServers = [
  { name: 'File parser', description: 'Parse files in the workspace' },
  {
    name: 'Budget Assistant RPC',
    description: 'Using RPC to connect to a budget assistant server API',
  },
] as const;

/**
 * Creates a resource generator with encapsulated state.
 * Each call to the returned generator produces the next resource in sequence.
 *
 * @example
 * ```tsx
 * const generators = createResourceGenerators();
 * const context1 = generators.context(); // "User Profile"
 * const context2 = generators.context(); // "Session Context"
 * const tool1 = generators.tool(); // "Send Email"
 * ```
 */
export function createResourceGenerators() {
  let contextIndex = 0;
  let toolIndex = 0;
  let escalationIndex = 0;
  let mcpIndex = 0;

  return {
    /**
     * Creates a sample context resource.
     */
    context: (overrides?: Partial<AgentFlowContextResource>): AgentFlowContextResource => {
      const sample = sampleContexts[contextIndex % sampleContexts.length]!;
      contextIndex++;
      return {
        id: generateResourceId(),
        type: 'context',
        name: sample.name,
        description: sample.description,
        hasBreakpoint: false,
        hasGuardrails: false,
        ...overrides,
      };
    },

    /**
     * Creates a sample tool resource.
     */
    tool: (overrides?: Partial<AgentFlowToolResource>): AgentFlowToolResource => {
      const sample = sampleTools[toolIndex % sampleTools.length]!;
      toolIndex++;
      return {
        id: generateResourceId(),
        type: 'tool',
        name: sample.name,
        description: sample.description,
        iconUrl: '',
        projectType: sample.projectType,
        hasBreakpoint: false,
        hasGuardrails: false,
        ...overrides,
      };
    },

    /**
     * Creates a sample escalation resource.
     */
    escalation: (overrides?: Partial<AgentFlowEscalationResource>): AgentFlowEscalationResource => {
      const sample = sampleEscalations[escalationIndex % sampleEscalations.length]!;
      escalationIndex++;
      return {
        id: generateResourceId(),
        type: 'escalation',
        name: sample.name,
        description: sample.description,
        hasBreakpoint: false,
        hasGuardrails: false,
        ...overrides,
      };
    },

    /**
     * Creates a sample MCP server resource.
     */
    mcp: (overrides?: Partial<AgentFlowMcpResource>): AgentFlowMcpResource => {
      const sample = sampleMcpServers[mcpIndex % sampleMcpServers.length]!;
      mcpIndex++;
      return {
        id: generateResourceId(),
        type: 'mcp',
        name: sample.name,
        description: sample.description,
        slug: '',
        folderPath: '',
        availableTools: [],
        hasBreakpoint: false,
        hasGuardrails: false,
        ...overrides,
      };
    },

    /**
     * Creates a sample memory space resource.
     */
    memorySpace: (
      overrides?: Partial<AgentFlowMemorySpaceResource>
    ): AgentFlowMemorySpaceResource => {
      return {
        id: generateResourceId(),
        type: 'memorySpace',
        name: 'Agent Memory Space',
        description: 'Memory space for the agent',
        hasBreakpoint: false,
        hasGuardrails: false,
        ...overrides,
      };
    },

    /**
     * Resets all counters to start from the beginning.
     */
    reset: () => {
      contextIndex = 0;
      toolIndex = 0;
      escalationIndex = 0;
      mcpIndex = 0;
    },
  };
}

/**
 * Pre-built sample resources for quick story setup.
 */
export const defaultSampleResources: AgentFlowResource[] = [
  {
    id: 'tool-slack',
    type: 'tool',
    name: 'Send message',
    description: 'Slack',
    iconUrl: '',
    hasBreakpoint: false,
    isCurrentBreakpoint: false,
    hasGuardrails: false,
  },
  {
    id: 'tool-email',
    type: 'tool',
    name: 'Send Email',
    description: 'Email Service',
    iconUrl: '',
    hasBreakpoint: false,
    hasGuardrails: false,
    projectType: ProjectType.Internal,
  },
  {
    id: 'context-user',
    type: 'context',
    name: 'User Profile',
    description: 'Information about the current user',
    hasBreakpoint: false,
    hasGuardrails: false,
  },
  {
    id: 'escalation-manager',
    type: 'escalation',
    name: 'Manager Approval',
    description: 'Escalate to manager',
    hasBreakpoint: false,
    hasGuardrails: false,
  },
];

/**
 * Creates a set of sample resources with various states for testing.
 */
export function createSampleResourceSet(): AgentFlowResource[] {
  const generators = createResourceGenerators();

  return [
    generators.tool(),
    generators.tool({ hasBreakpoint: true }),
    generators.tool({ hasGuardrails: true }),
    generators.context(),
    generators.context({ isDisabled: true }),
    generators.escalation(),
    generators.mcp(),
    generators.memorySpace(),
  ];
}
