import { z } from "zod";
import type {
  AssistantMessage,
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "./ai-chat-message-types";
import type { Tools } from "./ai-chat-tool-types";

interface LLMMessage {
  role: string;
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
}

interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

export function resolveConfig<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function getAccessToken(
  token: string | (() => string | null),
): string | null {
  return typeof token === "function" ? token() : token;
}

export function buildToolDefinitions(tools: Tools): ToolDefinition[] {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.inputSchema),
    },
  }));
}

function extractTextContent(content: AssistantMessage["content"]): string {
  return content
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function extractToolCallParts(
  content: AssistantMessage["content"],
): ToolCallPart[] {
  return content.filter((p): p is ToolCallPart => p.type === "tool-call");
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
    if (!msg) continue;

    if (msg.role === "tool") {
      for (const part of msg.content) {
        apiMessages.push({
          role: "tool",
          content:
            typeof part.result === "string"
              ? part.result
              : JSON.stringify(part.result),
          tool_call_id: part.toolCallId,
        });
      }
      continue;
    }

    if (msg.role === "user") {
      apiMessages.push({
        role: "user",
        content: msg.content.map((p) => p.text).join(""),
      });
      continue;
    }

    const textContent = extractTextContent(msg.content);
    const toolCallParts = extractToolCallParts(msg.content);

    if (toolCallParts.length > 0) {
      const toolCallIds = new Set(toolCallParts.map((tc) => tc.toolCallId));
      const hasMatchingToolResults = messages
        .slice(i + 1)
        .some(
          (m) =>
            m.role === "tool" &&
            m.content.some((p) => toolCallIds.has(p.toolCallId)),
        );

      if (!hasMatchingToolResults) {
        // Display-tool calls: the loop stopped without sending results back to
        // the LLM. Include the assistant message with synthetic acknowledgments
        // so the LLM knows these tools were already shown and doesn't re-issue
        // them on the next turn.
        apiMessages.push({
          role: "assistant",
          content: textContent || null,
          tool_calls: toolCallParts.map((tc) => ({
            id: tc.toolCallId,
            type: "function",
            function: { name: tc.toolName, arguments: JSON.stringify(tc.args) },
          })),
        });
        for (const tc of toolCallParts) {
          apiMessages.push({
            role: "tool",
            content: "Displayed to user.",
            tool_call_id: tc.toolCallId,
          });
        }
        continue;
      }

      apiMessages.push({
        role: "assistant",
        content: textContent || null,
        tool_calls: toolCallParts.map((tc) => ({
          id: tc.toolCallId,
          type: "function",
          function: { name: tc.toolName, arguments: JSON.stringify(tc.args) },
        })),
      });
    } else {
      apiMessages.push({ role: "assistant", content: textContent });
    }
  }

  return apiMessages;
}

export async function executeToolCall(
  tools: Tools,
  tc: ToolCallPart,
): Promise<unknown> {
  const handler = tools[tc.toolName];
  if (!handler || !("execute" in handler)) {
    return { error: `Unknown tool: ${tc.toolName}` };
  }
  try {
    return await handler.execute(tc.args);
  } catch (err) {
    return { error: String(err) };
  }
}
