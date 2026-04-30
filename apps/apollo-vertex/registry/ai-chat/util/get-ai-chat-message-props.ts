import type { ChatClientState, UIMessage } from "@tanstack/ai-client";
import type { AiChatMessageBoundProps, MessageFeedbackType } from "../types";

interface GetAiChatMessagePropsOptions {
  messages: UIMessage[];
  status: ChatClientState;
  onFeedback?: (messageId: string, type: MessageFeedbackType) => void;
  /** Resolves the current feedback for a message — used to render thumbs-up/down in a pressed state. */
  getFeedback?: (messageId: string) => MessageFeedbackType | null | undefined;
  onRegenerate?: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

function isVisibleAssistant(m: UIMessage): boolean {
  if (m.role !== "assistant") return false;
  return m.parts.some(
    (p) =>
      (p.type === "tool-call" && p.output != null) ||
      (p.type === "text" && p.content),
  );
}

export function getAiChatMessageProps({
  messages,
  status,
  onFeedback,
  getFeedback,
  onRegenerate,
  onEditMessage,
}: GetAiChatMessagePropsOptions): (
  message: UIMessage,
) => AiChatMessageBoundProps {
  const lastMessageId = messages.at(-1)?.id ?? null;
  const latestVisibleAssistantId =
    messages.findLast((m) => isVisibleAssistant(m))?.id ?? null;
  const isInFlight = status === "submitted" || status === "streaming";

  return (message: UIMessage) => {
    const isLatestVisibleAssistant =
      message.role === "assistant" && message.id === latestVisibleAssistantId;

    return {
      message,
      isStreaming:
        isInFlight &&
        message.role === "assistant" &&
        message.id === lastMessageId,
      showActionsAlwaysVisible: !isInFlight && isLatestVisibleAssistant,
      ...(getFeedback ? { feedback: getFeedback(message.id) ?? null } : {}),
      ...(onFeedback
        ? {
            onFeedback: (type: MessageFeedbackType) =>
              onFeedback(message.id, type),
          }
        : {}),
      ...(onRegenerate ? { onRegenerate } : {}),
      ...(onEditMessage && !isInFlight
        ? {
            onEditMessage: (content: string) =>
              onEditMessage(message.id, content),
          }
        : {}),
    };
  };
}
