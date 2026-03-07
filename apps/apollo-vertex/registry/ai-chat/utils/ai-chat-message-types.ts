export interface TextPart {
  type: "text";
  text: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: unknown;
}

export type ContentPart = TextPart | ToolCallPart | ToolResultPart;

export interface UserMessage {
  role: "user";
  id: string;
  content: TextPart[];
  timestamp: number;
}

export interface AssistantMessage {
  role: "assistant";
  id: string;
  content: Array<TextPart | ToolCallPart>;
  timestamp: number;
}

export interface ToolMessage {
  role: "tool";
  id: string;
  content: ToolResultPart[];
  timestamp: number;
}

export type ChatMessage = UserMessage | AssistantMessage | ToolMessage;
