import { resolveConfig } from "../../../ai-chat-api";
import type {
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "../../../ai-chat-message-types";

/**
 * Intermediate message format shared by all AgentHub providers.
 * Matches the OpenAI message shape — each provider transforms this into
 * its own wire format (OpenAI-native or Anthropic-normalized).
 */
export interface BaseMessage {
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
 * Converts internal ChatMessage[] to the shared BaseMessage format.
 * Handles system prompts, user messages, assistant messages (with or without
 * tool calls), and tool result messages — including display-tool acknowledgment
 * so the LLM doesn't re-issue tools that were already shown to the user.
 */
export function buildBaseMessages(
  messages: ChatMessage[],
  systemPrompt?: string | (() => string),
): BaseMessage[] {
  const result: BaseMessage[] = [];

  if (systemPrompt) {
    result.push({ role: "system", content: resolveConfig(systemPrompt) });
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    if (msg.role === "tool") {
      for (const part of msg.content) {
        result.push({
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
      result.push({
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
        result.push({
          role: "assistant",
          content: textContent || null,
          tool_calls: toolCallParts.map((tc) => ({
            id: tc.toolCallId,
            type: "function" as const,
            function: { name: tc.toolName, arguments: JSON.stringify(tc.args) },
          })),
        });
        for (const tc of toolCallParts) {
          result.push({
            role: "tool",
            content: "Displayed to user.",
            tool_call_id: tc.toolCallId,
          });
        }
        continue;
      }

      result.push({
        role: "assistant",
        content: textContent || null,
        tool_calls: toolCallParts.map((tc) => ({
          id: tc.toolCallId,
          type: "function" as const,
          function: { name: tc.toolName, arguments: JSON.stringify(tc.args) },
        })),
      });
    } else {
      result.push({ role: "assistant", content: textContent });
    }
  }

  return result;
}
