import type { UIMessage } from "@tanstack/ai-client";

export type MessageFeedbackType = "positive" | "negative";

export interface AiChatMessageBoundProps {
  message: UIMessage;
  isStreaming: boolean;
  showActionsAlwaysVisible: boolean;
  feedback?: MessageFeedbackType | null;
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEditMessage?: (content: string) => void;
}
