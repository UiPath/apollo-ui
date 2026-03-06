export type ChatRole = "user" | "assistant" | "system" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface MessagePart {
  content: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  value?: string;
  recommended?: boolean;
}

export interface ToolResultChoices {
  type: "choices";
  prompt: string;
  options: ChoiceOption[];
}

export interface NavigationTab {
  tab: string;
  label: string;
}

export interface ToolResultNavigation {
  type: "navigation";
  tabs: NavigationTab[];
}

export type ToolResult = ToolResultChoices | ToolResultNavigation;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  parts?: MessagePart[];
  timestamp: number;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  hidden?: boolean;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface LLMMessage {
  role: string;
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: LLMMessage[];
  max_tokens: number;
  temperature: number;
  tools?: ToolDefinition[];
  tool_choice?: "auto" | "none" | "required";
}

export interface AiChatConfig {
  baseUrl: string;
  model: string;
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string | (() => string);
  tools?: ToolDefinition[] | (() => ToolDefinition[]);
  toolChoice?: "auto" | "none" | "required";
  fallbackResponse?: string;
  maxToolIterations?: number;
}

export interface StorageConfig {
  messagesKey: string;
  type: "session" | "local" | "none";
}

export interface UseAiChatOptions {
  config: AiChatConfig;
  accessToken: string | (() => string | null);
  storage?: StorageConfig;
  onToolCall?: (
    toolCall: ToolCall,
    args: Record<string, unknown>,
  ) => Promise<unknown> | unknown;
  onError?: (error: Error) => void;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (
    content: string,
    files?: File[],
    options?: { hidden?: boolean },
  ) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  addSystemMessage: (content: string) => void;
  appendMessages: (msgs: ChatMessage[]) => void;
}
