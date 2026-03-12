import type { ChatMessage } from "./ai-chat-message-types";
import type { LLMProvider } from "./ai-chat-provider";
import type { Tools } from "./ai-chat-tool-types";

export type {
  AssistantMessage,
  ChatMessage,
  ContentPart,
  TextPart,
  ToolCallPart,
  ToolMessage,
  ToolResultPart,
  UserMessage,
} from "./ai-chat-message-types";

export type {
  OpenAIChatProvider,
  OpenAIChatProviderConfig,
} from "./ai-chat-openai-provider";
export type { LLMProvider } from "./ai-chat-provider";

export type {
  ChoiceOption,
  DisplayTool,
  ExecuteTool,
  MaybePromise,
  Tool,
  ToolResult,
  ToolResultChoices,
  Tools,
} from "./ai-chat-tool-types";

export interface UseAiChatOptions {
  provider: LLMProvider;
  tools?: Tools | (() => Tools);
  maxToolIterations?: number;
  /** Session storage key for persisting messages. Omit to use in-memory only. */
  storageKey?: string;
  onError?: (error: Error) => void;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  tools: Tools | undefined;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  appendMessages: (msgs: ChatMessage[]) => void;
}
