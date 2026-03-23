/**
 * Converts TanStack AI messages (UIMessage or ModelMessage) into the
 * AgentHub normalized wire format.
 */
import type {
  TextPart,
  ToolCallPart,
  ToolResultPart,
  UIMessage,
} from "@tanstack/ai-client";
import type { AgentHubVendor } from "./types";

interface NormalizedMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null | { result: string; call_id: string };
  tool_calls?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }[];
}

function parseToolInput(
  input: unknown,
  argumentsJson: string,
): Record<string, unknown> {
  // Prefer pre-parsed input if it's a plain object
  if (input != null && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(argumentsJson);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* empty */
  }
  return {};
}

export function toNormalizedMessages(
  messages: UIMessage[],
  systemPrompt: string | undefined,
  vendor: AgentHubVendor,
): NormalizedMessage[] {
  const result: NormalizedMessage[] = [];
  const isAnthropic = vendor === "anthropic";

  if (systemPrompt) {
    result.push({ role: "system", content: systemPrompt });
  }

  for (const msg of messages) {
    const textParts = msg.parts.filter((p): p is TextPart => p.type === "text");
    const toolCallParts = msg.parts.filter(
      (p): p is ToolCallPart => p.type === "tool-call",
    );
    const toolResultParts = msg.parts.filter(
      (p): p is ToolResultPart => p.type === "tool-result",
    );

    const textContent = textParts.map((p) => p.content).join("");

    if (toolCallParts.length > 0) {
      const resultCallIds = new Set(toolResultParts.map((p) => p.toolCallId));

      const toolCalls = toolCallParts.map((tc) => {
        const args = parseToolInput(tc.input, tc.arguments);
        return { id: tc.id, name: tc.name, arguments: args };
      });

      result.push({
        role: "assistant",
        content: textContent || (isAnthropic ? "tool_call" : null),
        tool_calls: toolCalls,
      });

      for (const tr of toolResultParts) {
        result.push({
          role: "tool",
          content: { result: tr.content, call_id: tr.toolCallId },
        });
      }

      // For any tool calls that DON'T have a matching result, inject a
      // synthetic acknowledgment so the LLM knows they were handled.
      for (const tc of toolCallParts) {
        if (!resultCallIds.has(tc.id)) {
          result.push({
            role: "tool",
            content: {
              result:
                tc.output == null
                  ? "Displayed to user."
                  : JSON.stringify(tc.output),
              call_id: tc.id,
            },
          });
        }
      }
    } else if (toolResultParts.length > 0) {
      for (const tr of toolResultParts) {
        result.push({
          role: "tool",
          content: { result: tr.content, call_id: tr.toolCallId },
        });
      }
    } else if (textContent) {
      result.push({ role: msg.role, content: textContent });
    } else if (msg.role === "user") {
      // User messages should always have content; send empty as fallback
      result.push({ role: "user", content: "" });
    }
    // Skip empty assistant messages (no text, no tool calls, no tool results)
  }

  return result;
}
