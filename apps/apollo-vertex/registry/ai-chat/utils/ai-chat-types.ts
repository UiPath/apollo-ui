import type { ChatMessage } from "./ai-chat-message-types";
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
  ChoiceOption,
  DisplayTool,
  ExecuteTool,
  MaybePromise,
  Tool,
  ToolResult,
  ToolResultChoices,
  Tools,
} from "./ai-chat-tool-types";

export interface ChatConnection {
  baseUrl: string;
  model: string;
  apiVersion?: string;
  accessToken: string | (() => string | null);
}

export interface StorageConfig {
  messagesKey: string;
  type: "session" | "local" | "none";
}

export interface UseAiChatOptions {
  connection: ChatConnection;
  systemPrompt?: string | (() => string);
  tools?: Tools | (() => Tools);
  toolChoice?: "auto" | "none" | "required";
  maxTokens?: number;
  temperature?: number;
  maxToolIterations?: number;
  fallbackResponse?: string;
  storage?: StorageConfig;
  onError?: (error: Error) => void;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  appendMessages: (msgs: ChatMessage[]) => void;
}
