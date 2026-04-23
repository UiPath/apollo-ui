import type { AnyClientTool, ModelMessage, StreamChunk } from "@tanstack/ai";
import type {
  ConnectConnectionAdapter,
  ToolCallPart,
  UIMessage,
} from "@tanstack/ai-client";
import { fetchAgentHubStream } from "./stream";
import type { AgentHubAdapterConfig } from "./types";

export type { AgentHubAdapterConfig, AgentHubVendor } from "./types";

function isUIMessages(
  messages: Array<UIMessage> | Array<ModelMessage>,
): messages is UIMessage[] {
  const first = messages[0];
  return first != null && "parts" in first;
}

function collectSkipFollowUpToolNames(
  tools: ReadonlyArray<AnyClientTool> | undefined,
): Set<string> {
  return new Set(
    (tools ?? [])
      .filter((t) => t.metadata?.skipFollowUp === true)
      .map((t) => t.name),
  );
}

function shouldSkipFollowUp(
  messages: UIMessage[],
  skipFollowUpToolNames: Set<string>,
): boolean {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant") return false;

  const toolCalls = last.parts.filter(
    (p): p is ToolCallPart => p.type === "tool-call",
  );
  return (
    toolCalls.length > 0 &&
    toolCalls.every(
      (tc) => tc.output != null && skipFollowUpToolNames.has(tc.name),
    )
  );
}

async function* emptyStream(): AsyncIterable<StreamChunk> {
  await Promise.resolve();
  const runId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  yield { type: "RUN_STARTED", runId, timestamp: Date.now() };
  yield {
    type: "TEXT_MESSAGE_START",
    messageId,
    role: "assistant",
    timestamp: Date.now(),
  };
  yield { type: "TEXT_MESSAGE_END", messageId, timestamp: Date.now() };
  yield {
    type: "RUN_FINISHED",
    runId,
    timestamp: Date.now(),
    finishReason: "stop",
  };
}

export function createAgentHubConnection(
  config: AgentHubAdapterConfig,
): ConnectConnectionAdapter {
  const skipFollowUpToolNames = collectSkipFollowUpToolNames(config.tools);

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

      if (shouldSkipFollowUp(messages, skipFollowUpToolNames)) {
        return emptyStream();
      }

      return fetchAgentHubStream(config, messages, abortSignal);
    },
  };
}
