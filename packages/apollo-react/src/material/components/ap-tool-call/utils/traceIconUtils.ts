import type { TSpan } from '../ApToolCall.types';
import { spanIconsMap } from '../assets/spanIcons';

const SPAN_FUNCTION_TYPES = [
  'function_call_sync',
  'function_call_async',
  'function_call_generator_sync',
  'function_call_generator_async',
] as const;

const SPAN_ICON_MAP = new Map<string, string>([
  ['TimeTrigger', 'time-trigger'],
  ['QueueTrigger', 'queue-trigger'],
  ['ApiTrigger', 'api-trigger'],
  ['processTool', 'process-tool'],
  ['agentTool', 'agent-tool'],
  ['agentRun', 'agent-run'],
  ['parser', 'parser-icon'],
  ['chain', 'link-icon'],
  ['AgentToolCall', 'agent-run'],
  ['licensing', 'lock-icon'],
  ['ProcessRun', 'process-run'],
  ['ElementRun', 'element-run'],
  ['eval', 'eval'],
  ['OpenTelemetry', 'settings-input-antenna-icon'],
  ['toolPreGovernance', 'pre-governance'],
  ['escalationTool', 'escalation-tool'],
  ['toolPostGovernance', 'post-governance'],
  ['contextGroundingTool', 'context-grounding-tool'],
  ['apiWorkflowRun', 'api-workflow-run'],
  ['MCP Server', 'mcp-server'],
  ['MCP response', 'mcp-response'],
  ['MCP request', 'mcp-request'],
  ['conversation', 'conversation-icon'],
  ['conversationExchange', 'conversation-exchange-icon'],
  ['conversationUserMessage', 'conversation-user-message-icon'],
  ['conversationAgentMessage', 'conversation-agent-message-icon'],
  ['conversationContentPart', 'conversation-content-part-icon'],
  ['conversationToolCall', 'conversation-tool-call-icon'],
  ['conversationCitation', 'conversation-citation-icon'],
  ['agentMemoryLookup', 'memory-space-icon'],
  ['applyDynamicFewShot', 'memory-space-icon'],
  ['agentMemoryStore', 'memory-space-icon'],
]);

const API_WORKFLOW_TASK_ICON_MAP = new Map<string, string>([
  ['HTTP', 'http-icon'],
  ['Script', 'script-icon'],
  ['Connector', 'connector-icon'],
  ['If', 'if-icon'],
  ['ForEach', 'for-each-icon'],
  ['TryCatch', 'try-catch-icon'],
  ['Response', 'response-icon'],
  ['DoWhile', 'do-while-icon'],
  ['Break', 'break-icon'],
  ['Assign', 'assign-icon'],
  ['Wait', 'wait-icon'],
  ['WorkflowStart', 'workflow-start-icon'],
]);

function getAttributes(span: TSpan): Record<string, any> {
  const attrs = span.attributes;
  if (typeof attrs === 'string') {
    try {
      return JSON.parse(attrs);
    } catch {
      return {};
    }
  }
  return (attrs as Record<string, any>) ?? {};
}

function isFunctionSpan(type: string): boolean {
  return (SPAN_FUNCTION_TYPES as readonly string[]).includes(type);
}

function getIconKey(span: TSpan): string {
  const spanType = span.type ?? '';

  const simpleKey = SPAN_ICON_MAP.get(spanType);
  if (simpleKey) {
    return simpleKey;
  }

  const attrs = getAttributes(span);

  switch (spanType) {
    case 'completion':
    case 'agentOutput':
      return (attrs.model as string | undefined)?.includes('gpt-') ? 'open-ai' : 'generic-ai';

    case 'toolCall':
      return attrs.toolType === 'Agent' ? 'agent-run' : 'process-tool';

    case 'apiWorkflowTaskRun':
      return API_WORKFLOW_TASK_ICON_MAP.get(attrs.taskType as string) ?? 'api-workflow-task-run';

    default:
      return isFunctionSpan(spanType) ? 'function-span' : 'default-trace-item';
  }
}

export function getSpanIconSvg(span: TSpan): string | null {
  return spanIconsMap.get(getIconKey(span)) ?? null;
}
