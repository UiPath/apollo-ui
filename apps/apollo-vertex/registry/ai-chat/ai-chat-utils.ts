import type {
  ChatMessage,
  ToolCall,
  ToolResultChoices,
  ToolResultNavigation,
} from "@/lib/ai-chat-types";

export type GroupedItem =
  | { kind: "message"; message: ChatMessage }
  | { kind: "tool-group"; id: string; toolCalls: ToolCall[] };

type PendingTools = { toolCalls: ToolCall[]; groupId: string };

function safeJsonParse(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function isValidChoices(parsed: unknown): parsed is ToolResultChoices {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    parsed.type === "choices" &&
    "options" in parsed &&
    Array.isArray(parsed.options)
  );
}

export function extractMessageContent(message: ChatMessage): string {
  return message.parts?.map((p) => p.content).join("") ?? message.content;
}

function parseToolResultForChoices(
  message: ChatMessage,
): ToolResultChoices | null {
  if (message.role !== "tool") return null;

  const content = extractMessageContent(message);
  const parsed = safeJsonParse(content);

  return parsed && isValidChoices(parsed) ? parsed : null;
}

function hasUserResponseAfter(
  messages: ChatMessage[],
  afterIndex: number,
): boolean {
  return messages.slice(afterIndex + 1).some((m) => m.role === "user");
}

export function findLatestChoices(
  messages: ChatMessage[],
): ToolResultChoices | null {
  const result = messages
    .map((message, index) => ({ message, index }))
    .toReversed()
    .filter(({ message }) => message?.role === "tool")
    .map(({ message, index }) => ({
      choices: parseToolResultForChoices(message),
      index,
    }))
    .find(
      ({ choices, index }) =>
        choices !== null && !hasUserResponseAfter(messages, index),
    );

  return result?.choices ?? null;
}

function isToolOnlyMessage(message: ChatMessage): boolean {
  const content = extractMessageContent(message);
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  return message.role === "assistant" && !content && hasToolCalls;
}

function flushPendingTools(
  items: GroupedItem[],
  pending: PendingTools,
): GroupedItem[] {
  if (pending.toolCalls.length === 0) return items;

  return [
    ...items,
    {
      kind: "tool-group",
      id: pending.groupId,
      toolCalls: pending.toolCalls,
    },
  ];
}

function isValidNavigation(parsed: unknown): parsed is ToolResultNavigation {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    "type" in parsed &&
    (parsed as Record<string, unknown>)["type"] === "navigation" &&
    "tabs" in parsed &&
    Array.isArray((parsed as Record<string, unknown>)["tabs"])
  );
}

function parseToolResultForNavigation(
  message: ChatMessage,
): ToolResultNavigation | null {
  if (message.role !== "tool") return null;

  const content = extractMessageContent(message);
  const parsed = safeJsonParse(content);

  return parsed && isValidNavigation(parsed) ? parsed : null;
}

export function findLatestNavigation(
  messages: ChatMessage[],
): ToolResultNavigation | null {
  const result = messages
    .map((message, index) => ({ message, index }))
    .toReversed()
    .filter(({ message }) => message?.role === "tool")
    .map(({ message, index }) => ({
      navigation: parseToolResultForNavigation(message),
      index,
    }))
    .find(
      ({ navigation, index }) =>
        navigation !== null && !hasUserResponseAfter(messages, index),
    );

  return result?.navigation ?? null;
}

export function groupMessages(
  messages: ChatMessage[],
  enableToolGrouping: boolean,
): GroupedItem[] {
  if (!enableToolGrouping) {
    return messages
      .filter((m) => !m.hidden && m.role !== "tool")
      .map((message) => ({ kind: "message" as const, message }));
  }

  const visible = messages.filter(
    (m) => !m.hidden && (m.role === "user" || m.role === "assistant"),
  );

  const { items, pending } = visible.reduce<{
    items: GroupedItem[];
    pending: PendingTools;
  }>(
    (acc, msg) => {
      if (isToolOnlyMessage(msg)) {
        return {
          items: acc.items,
          pending: {
            toolCalls: [...acc.pending.toolCalls, ...(msg.toolCalls ?? [])],
            groupId: acc.pending.groupId || msg.id,
          },
        };
      }

      const newItems = flushPendingTools(acc.items, acc.pending);
      return {
        items: [...newItems, { kind: "message", message: msg }],
        pending: { toolCalls: [], groupId: "" },
      };
    },
    { items: [], pending: { toolCalls: [], groupId: "" } },
  );

  return flushPendingTools(items, pending);
}
