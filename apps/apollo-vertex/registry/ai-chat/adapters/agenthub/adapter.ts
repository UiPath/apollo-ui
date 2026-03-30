import type { ModelMessage } from "@tanstack/ai";
import type { ConnectConnectionAdapter, UIMessage } from "@tanstack/ai-client";
import { fetchAgentHubStream } from "./stream";
import type { AgentHubAdapterConfig } from "./types";

export type { AgentHubAdapterConfig, AgentHubVendor } from "./types";

function isUIMessages(
  messages: Array<UIMessage> | Array<ModelMessage>,
): messages is UIMessage[] {
  const first = messages[0];
  return first != null && "parts" in first;
}

export function createAgentHubConnection(
  config: AgentHubAdapterConfig,
): ConnectConnectionAdapter {
  return {
    connect(messages, _data, abortSignal) {
      if (messages.length === 0) {
        return fetchAgentHubStream(config, [], abortSignal);
      }
      if (!isUIMessages(messages)) {
        throw new Error(
          "AgentHub adapter requires UIMessages, received ModelMessages",
        );
      }
      return fetchAgentHubStream(config, messages, abortSignal);
    },
  };
}
