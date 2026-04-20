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
  /** ID of the latest assistant message — its actions stay always-visible while older messages reveal on hover/focus */
  latestAssistantMessageId: string | null;
  /** Callback when the user gives thumbs up/down on an assistant message. */
  onFeedback?: (messageId: string, type: MessageFeedbackType) => void;
  /** Callback to regenerate the last assistant response. When provided, the "Try again" button appears in assistant message actions. */
  onRegenerate?: () => void;
  /** Callback when the user saves an edited user message. Receives the message ID and new content. */
  onEditMessage?: (messageId: string, content: string) => void;
  /** Callback when the user selects text in an assistant message and clicks "Ask AI assistant". */
  onQuoteSelect?: (text: string) => void;
}
