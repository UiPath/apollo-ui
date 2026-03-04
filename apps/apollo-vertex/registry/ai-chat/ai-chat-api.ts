import type { ChatMessage, LLMMessage, ToolCall } from "@/lib/ai-chat-types";

export function resolveConfig<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function getAccessToken(
  token: string | (() => string | null),
): string | null {
  return typeof token === "function" ? token() : token;
}

function extractContent(msg: ChatMessage): string {
  return msg.parts?.map((p) => p.content).join("") || msg.content;
}

export function buildApiMessages(
  messages: ChatMessage[],
  systemPrompt?: string | (() => string),
): LLMMessage[] {
  const apiMessages: LLMMessage[] = [];
  if (systemPrompt) {
    apiMessages.push({ role: "system", content: resolveConfig(systemPrompt) });
  }
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || msg.role === "system") continue;

    const content = extractContent(msg);

    if (msg.role === "tool") {
      if (msg.toolCallId) {
        apiMessages.push({
          role: "tool",
          content,
          tool_call_id: msg.toolCallId,
        });
      }
      continue;
    }

    const apiMsg: LLMMessage = { role: msg.role, content };

    if (msg.role === "assistant" && msg.toolCalls?.length) {
      // Only include tool_calls if there are matching tool result messages.
      // Orphaned tool-call messages (e.g. from an aborted loop) are skipped
      // entirely — sending them without results causes API errors.
      const toolCallIds = new Set(msg.toolCalls.map((tc) => tc.id));
      const hasMatchingToolResults = messages
        .slice(i + 1)
        .some(
          (m) =>
            m.role === "tool" &&
            m.toolCallId != null &&
            toolCallIds.has(m.toolCallId),
        );
      if (!hasMatchingToolResults) continue;
      apiMsg.tool_calls = msg.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      }));
      apiMsg.content = content || null;
    }

    apiMessages.push(apiMsg);
  }
  return apiMessages;
}

export async function executeToolCall(
  handler: (
    toolCall: ToolCall,
    args: Record<string, unknown>,
  ) => Promise<unknown> | unknown,
  tc: ToolCall,
): Promise<unknown> {
  try {
    const args = JSON.parse(tc.arguments) as Record<string, unknown>;
    return await handler(tc, args);
  } catch (toolError) {
    return { error: String(toolError) };
  }
}
