import { z } from "zod";
import { resolveConfig } from "../../ai-chat-api";
import type {
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "../../ai-chat-message-types";
import type { Tools } from "../../ai-chat-tool-types";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

/**
 * Converts internal ChatMessage[] to the OpenAI API message format.
 */
export function buildOpenAIMessages(
  messages: ChatMessage[],
  systemPrompt?: string | (() => string),
): OpenAIMessage[] {
  const apiMessages: OpenAIMessage[] = [];

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
              : (JSON.stringify(part.result) ?? ""),
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

    const textContent = msg.content
      .filter((p): p is TextPart => p.type === "text")
      .map((p) => p.text)
      .join("");
    const toolCallParts = msg.content.filter(
      (p): p is ToolCallPart => p.type === "tool-call",
    );

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
        // the LLM. Include synthetic acknowledgments so the LLM knows these
        // tools were already shown and doesn't re-issue them on the next turn.
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

export function buildToolDefinitions(tools: Tools) {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.inputSchema),
    },
  }));
}
