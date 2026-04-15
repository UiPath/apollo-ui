export type { MessageAttachment, MessageSource } from "./components/ai-chat-message";
export type { ChoiceOption, ToolResultChoices } from "./utils/ai-chat-utils";

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
  /** IDs of assistant messages that belong to an active "pick a choice" turn — actions on these are suppressed */
  activeChoicesMessageIds: Set<string>;
  /** ID of the latest assistant message — its actions stay always-visible while older messages reveal on hover/focus */
  latestAssistantMessageId: string | null;
  /** Characters per second for the typewriter reveal effect on assistant messages. Set to 0 to disable. */
  typewriterCps: number;
  /** True while the latest assistant message's typewriter is still revealing characters. Used to gate suggestion buttons until the response is fully visible. */
  isLatestResponseAnimating: boolean;
  /** Setter for `isLatestResponseAnimating` — called by the latest assistant message component as its typewriter state changes. */
  setIsLatestResponseAnimating: (animating: boolean) => void;
  /** Callback when the user gives thumbs up/down on an assistant message. */
  onFeedback?: (messageId: string, type: MessageFeedbackType) => void;
  /** Callback to regenerate the last assistant response. When provided, the "Try again" button appears in assistant message actions. */
  onRegenerate?: () => void;
  /** Callback when the user saves an edited user message. Receives the message ID and new content. */
  onEditMessage?: (messageId: string, content: string) => void;
  /** Callback when the user selects text in an assistant message and clicks "Ask Autopilot". */
  onQuoteSelect?: (text: string) => void;
}
