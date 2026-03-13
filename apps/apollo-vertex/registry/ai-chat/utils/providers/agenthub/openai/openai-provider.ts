import { getAccessToken } from "../../../ai-chat-api";
import type {
  AssistantMessage,
  ChatMessage,
} from "../../../ai-chat-message-types";
import type { LLMProvider } from "../../../ai-chat-provider";
import type { Tools } from "../../../ai-chat-tool-types";
import { buildBaseMessages } from "../utils/agenthub-messages";
import { readAIStream } from "../utils/agenthub-stream";
import { buildOpenAIToolDefinitions } from "./openai-messages";

/**
 * Provider for OpenAI models via the UiPath AgentHub OpenAI-compatible endpoint.
 * Uses standard OpenAI request format (tool definitions, message structure).
 *
 * For Anthropic models via AgentHub, use AnthropicProvider instead.
 */
export interface OpenAIProviderConfig {
  /** AgentHub base URL, e.g. `https://cloud.uipath.com/{org}/{tenant}/agenthub_/llm/api` */
  baseUrl: string;
  model: string;
  /** Azure OpenAI API version, e.g. `2024-08-01-preview` */
  apiVersion?: string;
  accessToken: string | (() => string | null);
  systemPrompt?: string | (() => string);
  toolChoice?: "auto" | "none" | "required";
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIProvider implements LLMProvider {
  constructor(private readonly config: OpenAIProviderConfig) {}

  private buildUrl(): string {
    const apiVersion = this.config.apiVersion
      ? `?api-version=${this.config.apiVersion}`
      : "";
    return `${this.config.baseUrl}/chat/completions${apiVersion}`;
  }

  private buildRequestBody(
    messages: ChatMessage[],
    tools: Tools | undefined,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: buildBaseMessages(messages, this.config.systemPrompt),
      max_tokens: this.config.maxTokens ?? 2048,
      temperature: this.config.temperature ?? 0.7,
      stream: true,
    };

    if (tools && Object.keys(tools).length > 0) {
      body["tools"] = buildOpenAIToolDefinitions(tools);
      body["tool_choice"] = this.config.toolChoice ?? "auto";
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

    const response = await fetch(this.buildUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
