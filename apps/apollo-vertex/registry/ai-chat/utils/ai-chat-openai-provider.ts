import { z } from "zod";
import { getAccessToken, resolveConfig } from "./ai-chat-api";
import type {
  AssistantMessage,
  ChatMessage,
  TextPart,
  ToolCallPart,
} from "./ai-chat-message-types";
import type { LLMProvider } from "./ai-chat-provider";
import type { Tools } from "./ai-chat-tool-types";

export interface OpenAIChatProviderConfig {
  baseUrl: string;
  model: string;
  apiVersion?: string;
  accessToken: string | (() => string | null);
  systemPrompt?: string | (() => string);
  toolChoice?: "auto" | "none" | "required";
  maxTokens?: number;
  temperature?: number;
  fallbackResponse?: string;
}

export class OpenAIChatProvider implements LLMProvider {
  constructor(private readonly config: OpenAIChatProviderConfig) {}

  async chat(
    messages: ChatMessage[],
    tools: Tools | undefined,
    signal: AbortSignal,
  ): Promise<AssistantMessage> {
    const token = getAccessToken(this.config.accessToken);
    if (!token) throw new Error("Not authenticated");

    const requestBody: Record<string, unknown> = {
      model: this.config.model,
      messages: buildOpenAIMessages(messages, this.config.systemPrompt),
      max_tokens: this.config.maxTokens ?? 2048,
      temperature: this.config.temperature ?? 0.7,
    };

    if (tools && Object.keys(tools).length > 0) {
      requestBody["tools"] = buildToolDefinitions(tools);
      requestBody["tool_choice"] = this.config.toolChoice ?? "auto";
    }

    const apiVersion = this.config.apiVersion
      ? `?api-version=${this.config.apiVersion}`
      : "";
    const url = `${this.config.baseUrl}/chat/completions${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message as RawAssistantMessage | undefined;
    if (!raw) throw new Error("No response from assistant");

    return parseOpenAIMessage(raw, this.config.fallbackResponse);
  }
}

// --- OpenAI message format helpers ---
// Exported so other OpenAI-compatible providers (Azure, Ollama, etc.) can reuse them.

interface OpenAIMessage {
  role: string;
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

interface RawAssistantMessage {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>;
}

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

function buildToolDefinitions(tools: Tools) {
  return Object.entries(tools).map(([name, tool]) => ({
    type: "function" as const,
    function: {
      name,
      description: tool.description,
      parameters: z.toJSONSchema(tool.inputSchema),
    },
  }));
}

function parseOpenAIMessage(
  raw: RawAssistantMessage,
  fallbackResponse?: string,
): AssistantMessage {
  if (!raw.tool_calls?.length) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: [
        { type: "text", text: raw.content || (fallbackResponse ?? "") },
      ],
      timestamp: Date.now(),
    };
  }

  const toolCallParts: ToolCallPart[] = raw.tool_calls.map((tc) => {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
    } catch {
      args = {};
    }
    return {
      type: "tool-call",
      toolCallId: tc.id,
      toolName: tc.function.name,
      args,
    };
  });

  const content: Array<TextPart | ToolCallPart> = [];
  if (raw.content) content.push({ type: "text", text: raw.content });
  content.push(...toolCallParts);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    timestamp: Date.now(),
  };
}
