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
    // argumentsJson may be incomplete during streaming — fall through to empty default
  }
  return {};
}

function toToolResultMessage(part: ToolResultPart): NormalizedMessage {
  return {
    role: "tool",
    content: { result: part.content, call_id: part.toolCallId },
  };
}

function normalizeToolCallMessage(
  textContent: string,
  toolCallParts: ToolCallPart[],
  toolResultParts: ToolResultPart[],
  isAnthropic: boolean,
): NormalizedMessage[] {
  const resultCallIds = new Set(toolResultParts.map((p) => p.toolCallId));

  const toolCalls = toolCallParts.map((tc) => ({
    id: tc.id,
    name: tc.name,
    arguments: parseToolInput(tc.input, tc.arguments),
  }));

  const assistantMessage: NormalizedMessage = {
    role: "assistant",
    content: textContent || (isAnthropic ? "tool_call" : null),
    tool_calls: toolCalls,
  };

  const matchedResults = toolResultParts.map((p) => toToolResultMessage(p));

  // For any tool calls that DON'T have a matching result, inject a
  // synthetic acknowledgment so the LLM knows they were handled.
  const syntheticResults: NormalizedMessage[] = toolCallParts
    .filter((tc) => !resultCallIds.has(tc.id))
    .map((tc) => ({
      role: "tool" as const,
      content: {
        result:
          tc.output == null ? "Displayed to user." : JSON.stringify(tc.output),
        call_id: tc.id,
      },
    }));

  return [assistantMessage, ...matchedResults, ...syntheticResults];
}

function normalizeMessage(
  msg: UIMessage,
  isAnthropic: boolean,
): NormalizedMessage[] {
  const textParts = msg.parts.filter((p): p is TextPart => p.type === "text");
  const toolCallParts = msg.parts.filter(
    (p): p is ToolCallPart => p.type === "tool-call",
  );
  const toolResultParts = msg.parts.filter(
    (p): p is ToolResultPart => p.type === "tool-result",
  );

  const textContent = textParts.map((p) => p.content).join("");

  if (toolCallParts.length > 0) {
    return normalizeToolCallMessage(
      textContent,
      toolCallParts,
      toolResultParts,
      isAnthropic,
    );
  }

  if (toolResultParts.length > 0) {
    return toolResultParts.map((p) => toToolResultMessage(p));
  }

  if (textContent) {
    return [{ role: msg.role, content: textContent }];
  }

  // User messages should always have content; send empty as fallback.
  // Skip empty assistant messages (no text, no tool calls, no tool results).
  if (msg.role === "user") {
    return [{ role: "user", content: "" }];
  }

  return [];
}

export function toNormalizedMessages(
  messages: UIMessage[],
  systemPrompt: string | undefined,
  vendor: AgentHubVendor,
): NormalizedMessage[] {
  const isAnthropic = vendor === "anthropic";

  const system: NormalizedMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }]
    : [];

  return [
    ...system,
    ...messages.flatMap((msg) => normalizeMessage(msg, isAnthropic)),
  ];
}
