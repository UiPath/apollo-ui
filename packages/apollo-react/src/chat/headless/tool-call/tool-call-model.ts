/**
 * Renderer-agnostic reading of an agent tool call message (`meta` of an
 * `AGENTS_TOOL_CALL_RENDERER` message), shared by the Material `ApToolCall` and the Wind renderer.
 */

/** One span of an agent trace. */
export interface ToolCallSpanData {
  id?: string;
  name?: string;
  type?: string;
  status?: 'unset' | 'ok' | 'error';
  startTime?: string;
  endTime?: string;
  attributes?: Record<string, unknown> | string;
}

export interface ToolCallSpanNode<T = ToolCallSpanData> {
  key: string;
  name: string;
  data: T;
  children?: ToolCallSpanNode<T>[];
}

export type ToolCallDisplayMode = 'FullTrace' | 'InputsAndOutputs' | 'ToolNameOnly';

/** The tool call fields a message carries in `meta`. */
export interface ToolCallInfo {
  span?: ToolCallSpanNode;
  toolName?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  isError?: boolean;
  startTime?: string;
  endTime?: string;
  displayMode?: ToolCallDisplayMode;
}

/** `null` when nothing says how the call went; Material then shows no status icon. */
export type ToolCallState = 'loading' | 'error' | 'success' | null;

export interface ToolCallTaskUrl {
  taskUrl: string;
  status: string | null;
}

/** A span's attributes, parsed when they arrive as a JSON string. */
export function getSpanAttributes(data: ToolCallSpanData): Record<string, unknown> {
  let attrs = data.attributes;
  if (typeof attrs === 'string') {
    try {
      attrs = JSON.parse(attrs);
    } catch {
      return {};
    }
  }
  return (attrs || {}) as Record<string, unknown>;
}

/** Children shown as trace items: model calls and agent output are left out. */
export function getVisibleTraceChildren(node: ToolCallSpanNode): ToolCallSpanNode[] {
  return (node.children ?? []).filter(
    (child) => child.data.type !== 'llmCall' && child.data.type !== 'agentOutput'
  );
}

// Depth-first over every descendant, each span id once.
function forEachDescendant(span: ToolCallSpanNode, visit: (child: ToolCallSpanNode) => boolean) {
  const visited = new Set<string>();
  const stack = [...(span.children || [])];

  while (stack.length > 0) {
    const child = stack.pop();
    if (!child?.data?.id || visited.has(child.data.id)) {
      continue;
    }
    visited.add(child.data.id);
    if (visit(child)) {
      return;
    }
    if (child.children?.length) {
      stack.push(...child.children);
    }
  }
}

/** Escalation task links on the span and its descendants, with each span's status. */
export function getTaskUrls(span: ToolCallSpanNode | undefined): ToolCallTaskUrl[] {
  if (!span) {
    return [];
  }

  const urls: ToolCallTaskUrl[] = [];
  const collect = (node: ToolCallSpanNode) => {
    const taskUrl = getSpanAttributes(node.data).taskUrl;
    if (typeof taskUrl === 'string' && taskUrl) {
      urls.push({ taskUrl, status: node.data.status || null });
    }
  };

  collect(span);
  forEachDescendant(span, (child) => {
    collect(child);
    return false;
  });
  return urls;
}

export function hasChildSpanWithError(span: ToolCallSpanNode | undefined): boolean {
  if (!span) {
    return false;
  }

  let found = false;
  forEachDescendant(span, (child) => {
    found = child.data.status === 'error';
    return found;
  });
  return found;
}

/** How the call went: from input and output when given, else from the span tree. */
export function getToolCallState({ input, output, isError, span }: ToolCallInfo): ToolCallState {
  if (input && !output && isError === undefined) {
    return 'loading';
  }
  if (input && (output || isError !== undefined)) {
    return isError ? 'error' : 'success';
  }
  if (span) {
    if (span.data.status === 'unset') {
      return 'loading';
    }
    if (span.data.status === 'error' || hasChildSpanWithError(span)) {
      return 'error';
    }
    if (span.data.status === 'ok') {
      return 'success';
    }
  }
  return null;
}

/** The tool's name as people read it: underscores as spaces, without the span's prefix. */
export function getToolCallName({ toolName, span }: ToolCallInfo): string {
  return (
    toolName?.replace(/_/g, ' ') ||
    span?.name?.replace('Tool call - ', '').replace(/_/g, ' ') ||
    'tool'
  );
}

/** Elapsed seconds, from the message times or else the span's; 0 when either is missing. */
export function getToolCallDurationSeconds({ startTime, endTime, span }: ToolCallInfo): number {
  const end = endTime || span?.data?.endTime;
  const start = startTime || span?.data?.startTime;
  return end && start ? (new Date(end).getTime() - new Date(start).getTime()) / 1000 : 0;
}

/** The section values, as Material picks them: message fields first, then span attributes. */
export function getToolCallValues({ input, output, isError, span }: ToolCallInfo) {
  const attributes = span ? getSpanAttributes(span.data) : {};
  return {
    input: input || attributes.arguments || undefined,
    error: (isError && output) || attributes.error || undefined,
    // Shown for a successful output or a result attribute, but Material then shows `output` first.
    output: (!isError && output) || attributes.result ? output || attributes.result : undefined,
  } as {
    input?: Record<string, unknown> | string;
    error?: Record<string, unknown> | string;
    output?: Record<string, unknown> | string;
  };
}
