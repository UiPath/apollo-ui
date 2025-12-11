// FIXME: dumped from apollo-design-system, reorganize

export interface IAgentRunAttributes {
  systemPrompt: string;
  userPrompt: string;
  inputSchema: any;
  input: any;
}

export interface IGoalExtractionAttributes {
  callId: string;
  result: string;
}

export interface IPlanCreationResult {
  reasoning: string;
  text: string;
  possibleTools: string[];
}

export interface IPlanCreationAttributes {
  callId: string;
  result: IPlanCreationResult[];
}

export interface IPlanUpdateTasks {
  reasoning: string;
  text: string;
  possibleTools: string[];
}

export interface IPlanUpdateAttributes {
  callId: string;
  newTasks: IPlanUpdateTasks[];
  newObservations: string[];
}

export type TToolType = 'processTool' | 'agentTool' | 'AgentToolCall' | 'integrationTool' | 'contextGrounding';

export interface IToolAttributes {
  callId: string;
  arguments: any;
  jobDetailsUri: string;
  result: any;
  toolType: TToolType;
}

export interface IIntegrationToolAttributes {
  callId: string;
  arguments: any;
  result: any;
}

export interface IContextGroundingQuery {
  query: string;
  threshold: number;
  numberOfResults: number;
}

export interface IContextGroundingAttributes {
  callId?: string;
  arguments?: any;
  query: IContextGroundingQuery;
  result: any;
}

export const ToolChoiceValue = {
  Undefined: 0,
  Auto: 1,
  Required: 2,
  Tool: 3,
} as const;

export type ToolChoiceType = typeof ToolChoiceValue[keyof typeof ToolChoiceValue];

export interface IModelSettings {
  topP?: number;
  n?: number;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeoutSeconds?: number;
  maxTokens?: number;
  toolChoice?: ToolChoiceType;
  enforcedToolName?: string;
  parallelToolCalls?: boolean;
}

export interface ICompletionAttributes {
  settings: IModelSettings;
  extra?: {
      // TODO: most likely this should be Record instead of Map
      // eslint-disable-next-line @typescript-eslint/naming-convention
      invocation_params?: (Map<string, any> | Record<string, unknown>) & { tools?: any[] };
  };
  response: {
      message: {
          toolCalls: Array<{
              id: string;
              name: string;
              // TODO: most likely this should be Record instead of Map
              arguments: Map<string, any> | Record<string, unknown>;
          }>;
          content: string | null;
      };
  };
  usage: {
      completionTokens: number;
      promptTokens: number;
      totalTokens: number;
  };
  toolCalls: ICompletionToolCall[];
  output: string | null;
}

export interface IScore {
  value: any;
  type: any;
  justification?: string;
  evaluatorId: string;
}

export interface ICompletionToolCall {
  id: string;
  name: string;
  // TODO: most likely this should be Record instead of Map
  arguments: Map<string, any> | Record<string, unknown>;
}

export interface IEvalResult {
  output: any;
  evaluatorScores: string;
  scores: IScore[];
  score: IScore;
}

export interface IEvalAttributes {
  input: any;
  assertionType: string;
  assertionProperties: any;
  result: IEvalResult;
  error?: any;
}

export interface IEscalationAttributes {
  callId: string;
  toolCallName: string;
  arguments: any;
  result: any;
}

export interface IEscalationChannelAttributes {
  callId: string;
  toolCallName: string;
  channelType: string;
  taskId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILicensingAttributes {}

export interface IElementRunSpanAttributes {
  status: string;
  elementId: string;
  incomingFlowId?: string;
  agentTraceLink?: string;
}

export interface IIncidentSpanAttributes {
  comment: string;
  errorCode: string;
  errorMessage: string;
  errorDetails: string;
  folderKey: string;
}

export interface IProcessRunSpanAttributes {
  status: string;
}

export interface IInstanceOperationAttributes {
  operationType: 'Pause' | 'Resume' | 'Cancel' | 'Retry' | 'UpdateVariables' | 'MigrateInstance';
  comment: string;
  userId: string;
}

export interface ISourceReference {
  source: string;
  reference: string;
}

export interface IAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  provider: number;
}

export interface IAttachmentAttributes {
  attachments: IAttachment[];
}

type AsConstExtractor<TAsConstEnum> = TAsConstEnum [keyof TAsConstEnum];

type MakeNullable<T> = {
  [K in keyof T]: T[K] | null;
};

export const SpanType = {
  'AgentRun': 'agentRun',
  'EvalSetRun': 'evalSetRun',
  'Eval': 'eval',
  'Completion': 'completion',
  'ToolCall': 'toolCall',
  'ToolPreGovernance': 'toolPreGovernance',
  'ToolPostGovernance': 'toolPostGovernance',
  'GovernanceEscalation': 'governanceEscalation',
  'ProcessTool': 'processTool',
  'AgentTool': 'agentTool',
  'ApiWorkflowTool': 'apiWorkflowTool',
  'IntegrationTool': 'integrationTool',
  'ContextGroundingTool': 'contextGroundingTool',
  'EscalationTool': 'escalationTool',
  'MockTool': 'mockTool',
  'OutputCorrection': 'outputCorrection',

  'licensing': 'licensing',

  // Trigger types
  'TimeTrigger': 'TimeTrigger',
  'QueueTrigger': 'QueueTrigger',
  'ApiTrigger': 'ApiTrigger',

  // Additional types
  'agentOutput': 'agentOutput',
  'parser': 'parser',
  'chain': 'chain',
  'AgentToolCall': 'AgentToolCall',
  'OpenTelemetry': 'OpenTelemetry',
  'apiWorkflowTaskRun': 'apiWorkflowTaskRun',
  'apiWorkflowRun': 'apiWorkflowRun',
  'MCPServer': 'MCP Server',
  'MCPResponse': 'MCP response',
  'MCPRequest': 'MCP request',

  // PO types
  'ProcessRun': 'ProcessRun',
  'ElementRun': 'ElementRun',
  'InstanceOperation': 'InstanceOperation',
  'Incident': 'Incident',

  // Memory types
  'AgentMemoryLookup': 'agentMemoryLookup',
  'AgentMemoryStore': 'agentMemoryStore',

  // Governance types
  'PreGovernance': 'preGovernance',
  'AgentPreGuardrails': 'agentPreGuardrails',
  'ApplyDynamicFewShot': 'applyDynamicFewShot',

  // Conversation types
  'Conversation': 'conversation',
  'ConversationExchange': 'conversationExchange',
  'ConversationUserMessage': 'conversationUserMessage',
  'ConversationAgentMessage': 'conversationAgentMessage',
  'ConversationContentPart': 'conversationContentPart',
  'ConversationCitation': 'conversationCitation',
} as const;

// FIXME: integrate inside SpanType, currently no info about this kind of span
export const SPAN_FUNCTION_TYPES = [
  'function_call_sync',
  'function_call_async',
  'function_call_generator_sync',
  'function_call_generator_async',
] as const;

export type TSpanType = AsConstExtractor<typeof SpanType>;

export type ISpanBase<TType extends keyof SpanAttributesMap = TSpanType> = {
  id: string;
  traceId: string;
  parentId: string | null;
  name: string;
  startTime: Date;
  endTime: Date;
  status: string;
  jobKey?: string;
  folderKey?: string;
  processKey?: string;
  type: TType;
  attachments?: IAttachment[];
  // Originally, this was defined as `Map<string, any>`, but that doesn't match
  // the actual mapper function. Must double-check if this is used anywhere that
  // requires it to be a Map.
  rawData?: Record<string, any>;
  tags?: string;
  permissionStatus?: SpanPermissionStatusEnum;
  referenceId?: string;
  createdAt?: string;
  updatedAt?: string;
  organizationId?: string;
  tenantId?: string;
  expiryTimeUtc?: string;
  source?: number;
} & ({
  error: object;
  attributes: MakeNullable<SpanAttributesMap[TType]>;
} | {
  error?: null;
  attributes: SpanAttributesMap[TType] & { agentId?: string };
});

// Can this be dropped?
interface SpanAttributesMap {
  [SpanType.AgentRun]: IAgentRunAttributes;
  [SpanType.ToolCall]: IToolAttributes;
  [SpanType.IntegrationTool]: IIntegrationToolAttributes;
  [SpanType.ContextGroundingTool]: IContextGroundingAttributes;
  [SpanType.Completion]: ICompletionAttributes;
  [SpanType.Eval]: IEvalAttributes;
  [SpanType.EscalationTool]: IEscalationAttributes;
  [SpanType.licensing]: ILicensingAttributes;

  [SpanType.EvalSetRun]: any;
  [SpanType.GovernanceEscalation]: any;
  [SpanType.ProcessTool]: any;
  [SpanType.AgentTool]: any;
  [SpanType.ApiWorkflowTool]: any;
  [SpanType.OutputCorrection]: any;
  [SpanType.MockTool]: any;
  [SpanType.ToolPostGovernance]: any;
  [SpanType.ToolPreGovernance]: any;

  [SpanType.TimeTrigger]: any;
  [SpanType.QueueTrigger]: any;
  [SpanType.ApiTrigger]: any;
  [SpanType.agentOutput]: any;
  [SpanType.parser]: any;
  [SpanType.chain]: any;
  [SpanType.AgentToolCall]: any;
  [SpanType.OpenTelemetry]: any;
  [SpanType.apiWorkflowTaskRun]: any;
  [SpanType.apiWorkflowRun]: any;
  [SpanType.MCPServer]: any;
  [SpanType.MCPResponse]: any;
  [SpanType.MCPRequest]: any;

  [SpanType.ElementRun]: IElementRunSpanAttributes;
  [SpanType.ProcessRun]: IProcessRunSpanAttributes;
  [SpanType.InstanceOperation]: IInstanceOperationAttributes;
  [SpanType.Incident]: IIncidentSpanAttributes;

  [SpanType.AgentMemoryLookup]: any;
  [SpanType.AgentMemoryStore]: any;
  [SpanType.PreGovernance]: any;
  [SpanType.AgentPreGuardrails]: any;
  [SpanType.ApplyDynamicFewShot]: any;
  [SpanType.Conversation]: any;
  [SpanType.ConversationExchange]: any;
  [SpanType.ConversationUserMessage]: any;
  [SpanType.ConversationAgentMessage]: any;
  [SpanType.ConversationContentPart]: any;
  [SpanType.ConversationCitation]: any;
}

type SpanList = {
  [K in TSpanType]: ISpanBase<K>;
}[TSpanType];

// The umbrella type for all span types
export type TSpan = SpanList extends (infer T extends ISpanBase) ? T : never;

export interface IRawSpan {
  Id: string;
  TraceId: string;
  ParentId?: string | null;
  Name: string;
  Error?: object;
  StartTime: string;
  EndTime: string;
  Attributes: string;
  Status: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  OrganizationId?: string;
  TenantId?: string;
  ExpiryTimeUtc?: string;
  FolderKey?: string;
  Source?: number;
  SpanType: string;
  ProcessKey?: string;
  JobKey?: string;
  ReferenceId?: string;
  Attachments?: IAttachment[];
  PermissionStatus?: number;
}

export interface IEvaluationSet {
  id: string;
  name: string;
  isDefault?: boolean;
  isDisabled?: boolean;
}

export interface IMemorySpace {
  id: string;
  name: string;
  description?: string | null;
  lastQueried?: string | null;
  memoriesCount?: number;
  folderKey: string;
  createdByUserId: string;
}

export type JobNavigationCallback = (jobKey: string, folderKey: string) => void;

export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
  RUNNING = 3,
  RESTRICTED = 4,
}

export enum SpanPermissionStatusEnum {
  ALLOW = 0,
  PARTIALBLOCK = 1,
  BLOCK = 2,
}

export enum TraceViewMode {
  TREE = 'tree',
  WATERFALL = 'waterfall',
}
