import type { ModelMessage, StreamChunk, UIMessage } from "@tanstack/ai";
import { fetchAgentHubStream } from "./stream";
import type { AgentHubAdapterConfig } from "./types";

export type { AgentHubAdapterConfig, AgentHubVendor } from "./types";

function isUIMessages(
  messages: Array<UIMessage> | Array<ModelMessage>,
): messages is UIMessage[] {
  const first = messages[0];
  return first != null && "parts" in first;
}

export function createAgentHubStreamFactory(
  config: AgentHubAdapterConfig,
  signal?: AbortSignal,
) {
  return (
    messages: Array<UIMessage> | Array<ModelMessage>,
  ): AsyncIterable<StreamChunk> => {
    if (messages.length === 0) {
      return fetchAgentHubStream(config, [], signal);
    }
    if (!isUIMessages(messages)) {
      throw new Error(
        "AgentHub adapter requires UIMessages, received ModelMessages",
      );
    }
    return fetchAgentHubStream(config, messages, signal);
  };
}
