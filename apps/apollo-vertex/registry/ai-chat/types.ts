export type { ChoiceOption, ToolResultChoices } from "./utils/ai-chat-utils";

export type AiChatVariant = "default" | "compact" | "embedded";

export type MessageFeedbackType = "up" | "down";

export interface MessageAction {
  /** Unique key for the action */
  key: string;
  /** Label shown in tooltip */
  label: string;
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Called when the action is triggered */
  onClick: () => void;
  /** Only show for specific message roles */
  visibleFor?: "user" | "assistant";
}

export interface AiChatConfig {
  /** Layout variant — controls spacing, chrome, and borders */
  variant: AiChatVariant;
  /** Display name for the assistant */
  assistantName: string;
  /** Custom avatar for the assistant (ReactNode) */
  assistantAvatar?: React.ReactNode;
  /** Custom avatar for the user (ReactNode) */
  userAvatar?: React.ReactNode;
  /** Show relative timestamps on messages */
  showTimestamps: boolean;
  /** Show hover action toolbar on messages */
  showMessageActions: boolean;
  /** Show copy button on code blocks and messages */
  showCopyButton: boolean;
  /** Whether the chat is currently loading */
  isLoading: boolean;
}
