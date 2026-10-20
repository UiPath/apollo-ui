import type { ModelMessage, StreamChunk } from "@tanstack/ai";
import type { ConnectConnectionAdapter, UIMessage } from "@tanstack/ai-client";
import { extractLatestUserText } from "./messages";
import { SessionManager } from "./session";
import { bridgeExchange } from "./stream";
import type { ConversationalAgentAdapterConfig } from "./types";

export type { ConversationalAgentAdapterConfig } from "./types";

function isUIMessages(
  messages: Array<UIMessage> | Array<ModelMessage>,
): messages is UIMessage[] {
  const first = messages[0];
  return first != null && "parts" in first;
}

async function* connectAndStream(
  sessionManager: SessionManager,
  text: string,
  abortSignal?: AbortSignal,
): AsyncIterable<StreamChunk> {
  const session = await sessionManager.ensureSession();
  yield* bridgeExchange(session, text, abortSignal);
}

export function createConversationalAgentConnection(
  config: ConversationalAgentAdapterConfig,
): ConnectConnectionAdapter & { dispose: () => void } {
  const sessionManager = new SessionManager(config);

  return {
    connect(messages, _data, abortSignal) {
      if (!isUIMessages(messages)) {
        throw new Error(
          "ConversationalAgent adapter requires UIMessages, received ModelMessages",
        );
      }

      const text = extractLatestUserText(messages);
      return connectAndStream(sessionManager, text, abortSignal);
    },

    dispose() {
      sessionManager.dispose();
    },
  };
}
