import { z } from "zod";
import type { Tools } from "../../../ai-chat-tool-types";
import type { BaseMessage } from "../utils/agenthub-messages";

type AnthropicToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};
type AnthropicContent = string | null | { result: string; call_id: string };

/**
 * Normalized message format expected by the UiPath AgentHub Anthropic endpoint.
 * Tool results use `{ result, call_id }` and tool calls flatten the `function` wrapper.
 */
export interface AnthropicMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: AnthropicContent;
  tool_calls?: AnthropicToolCall[];
}

/**
 * Converts BaseMessages (OpenAI-like intermediate format) to the Anthropic
 * normalized wire format expected by the AgentHub LLM Gateway.
 */
export function toAnthropicMessages(
  messages: BaseMessage[],
): AnthropicMessage[] {
  return messages.map((msg) => {
    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        content: { result: msg.content ?? "", call_id: msg.tool_call_id ?? "" },
      };
    }
    if (msg.tool_calls) {
      return {
        role: msg.role,
        content: msg.content,
        tool_calls: msg.tool_calls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: (() => {
            try {
              return JSON.parse(tc.function.arguments || "{}") as Record<
                string,
                unknown
              >;
            } catch {
              return {};
            }
          })(),
        })),
      };
    }
    return { role: msg.role, content: msg.content };
  });
}

/**
 * Builds Anthropic-native tool definitions for the AgentHub normalized endpoint.
 * Uses `type: "custom"` with `input_schema` instead of OpenAI's `function` wrapper.
 */
export function buildAnthropicToolDefinitions(tools: Tools) {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "custom" as const,
    name,
    description: tool.description,
    input_schema: z.toJSONSchema(tool.inputSchema),
  }));
}
