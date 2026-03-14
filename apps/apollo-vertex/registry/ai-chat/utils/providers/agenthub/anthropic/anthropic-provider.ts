import { getAccessToken } from "../../../ai-chat-api";
import type {
  AssistantMessage,
  ChatMessage,
} from "../../../ai-chat-message-types";
import type { LLMProvider } from "../../../ai-chat-provider";
import type { Tools } from "../../../ai-chat-tool-types";
import { buildBaseMessages } from "../utils/agenthub-messages";
import { readAIStream } from "../utils/agenthub-stream";
import {
  buildAnthropicToolDefinitions,
  toAnthropicMessages,
} from "./anthropic-messages";

/**
 * Provider for Anthropic models via the UiPath AgentHub normalized LLM endpoint.
 *
 * Sends the `X-UiPath-LlmGateway-NormalizedApi-ModelName` header and uses
 * Anthropic-native message and tool formats. The AgentHub gateway translates
 * these to the Anthropic API and returns OpenAI-compatible SSE.
 *
 * For OpenAI models via AgentHub, use OpenAIProvider instead.
 */
export interface AnthropicProviderConfig {
  /**
   * Full AgentHub normalized endpoint URL, e.g.
   * `https://cloud.uipath.com/{org}/{tenant}/agenthub_/llm/api/chat/completions`
   */
  baseUrl: string;
  /** Model name sent as `X-UiPath-LlmGateway-NormalizedApi-ModelName`, e.g. `anthropic.claude-sonnet-4-5-20250929-v1:0` */
  modelName: string;
  accessToken: string | (() => string | null);
  systemPrompt?: string | (() => string);
  toolChoice?: "auto" | "none" | "required";
  maxTokens?: number;
  temperature?: number;
}

export class AnthropicProvider implements LLMProvider {
  constructor(private readonly config: AnthropicProviderConfig) {}

  private buildRequestBody(
    messages: ChatMessage[],
    tools: Tools | undefined,
  ): Record<string, unknown> {
    const baseMessages = buildBaseMessages(messages, this.config.systemPrompt);

    const body: Record<string, unknown> = {
      model: this.config.modelName,
      messages: toAnthropicMessages(baseMessages),
      max_tokens: this.config.maxTokens ?? 2048,
      temperature: this.config.temperature ?? 0.7,
      stream: true,
    };

    if (tools && Object.keys(tools).length > 0) {
      body["tools"] = buildAnthropicToolDefinitions(tools);
      body["tool_choice"] = { type: this.config.toolChoice ?? "auto" };
    }

    return body;
  }

  async *chat(
    messages: ChatMessage[],
    tools: Tools | undefined,
    signal: AbortSignal,
  ): AsyncGenerator<AssistantMessage> {
    const token = getAccessToken(this.config.accessToken);
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(this.config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-UiPath-LlmGateway-NormalizedApi-ModelName": this.config.modelName,
      },
      body: JSON.stringify(this.buildRequestBody(messages, tools)),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat request failed: ${response.status} ${errorText}`);
    }

    if (!response.body) throw new Error("No response body");

    yield* readAIStream(response.body);
  }
}
