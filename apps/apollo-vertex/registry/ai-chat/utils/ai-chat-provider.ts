import type { AssistantMessage, ChatMessage } from "./ai-chat-message-types";
import type { Tools } from "./ai-chat-tool-types";

export interface LLMProvider {
  chat(
    messages: ChatMessage[],
    tools: Tools | undefined,
    signal: AbortSignal,
  ): AsyncGenerator<AssistantMessage>;
}
