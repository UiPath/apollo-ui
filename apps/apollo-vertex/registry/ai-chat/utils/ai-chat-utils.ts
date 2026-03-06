import type {
  AssistantMessage,
  ChatMessage,
  ToolCallPart,
} from "./ai-chat-message-types";
import type { ToolResultChoices } from "./ai-chat-tool-types";

export type GroupedItem =
  | { kind: "message"; message: ChatMessage }
  | { kind: "tool-group"; id: string; toolCalls: ToolCallPart[] };

type PendingTools = { toolCalls: ToolCallPart[]; groupId: string };

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

function hasUserResponseAfter(
  messages: ChatMessage[],
  afterIndex: number,
): boolean {
  return messages.slice(afterIndex + 1).some((m) => m.role === "user");
}

export function findLatestChoices(
  messages: ChatMessage[],
): ToolResultChoices | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role !== "tool") continue;
    if (hasUserResponseAfter(messages, i)) continue;

    for (const part of msg.content) {
      if (part.type === "tool-result" && isValidChoices(part.result)) {
        return part.result;
      }
    }
  }
  return null;
}

function extractToolCallParts(
  content: AssistantMessage["content"],
): ToolCallPart[] {
  return content.filter((p): p is ToolCallPart => p.type === "tool-call");
}

function isToolOnlyMessage(message: ChatMessage): boolean {
  if (message.role !== "assistant") return false;
  return (
    message.content.length > 0 &&
    message.content.every((p) => p.type === "tool-call")
  );
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

export function groupMessages(
  messages: ChatMessage[],
  enableToolGrouping: boolean,
): GroupedItem[] {
  if (!enableToolGrouping) {
    return messages
      .filter((m) => m.role !== "tool")
      .map((message) => ({ kind: "message" as const, message }));
  }

  const visible = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  const { items, pending } = visible.reduce<{
    items: GroupedItem[];
    pending: PendingTools;
  }>(
    (acc, msg) => {
      if (isToolOnlyMessage(msg)) {
        const newToolCalls =
          msg.role === "assistant" ? extractToolCallParts(msg.content) : [];
        return {
          items: acc.items,
          pending: {
            toolCalls: [...acc.pending.toolCalls, ...newToolCalls],
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
