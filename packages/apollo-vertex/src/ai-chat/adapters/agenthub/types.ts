import type { AnyClientTool } from "@tanstack/ai";

export type AgentHubVendor = "openai" | "anthropic";

export interface AgentHubAdapterConfig {
  baseUrl: string;
  model: { vendor: AgentHubVendor; name: string };
  accessToken: string | (() => string | null);
  systemPrompt?: string | (() => string);
  maxTokens?: number;
  temperature?: number;
  tools?: ReadonlyArray<AnyClientTool>;
}
