"use client";

import type { TextPart, UIMessage } from "@tanstack/ai-client";
import { motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { useTypewriter } from "../hooks/use-typewriter";
import type { MessageFeedbackType } from "../types";
import { AiChatMarkdown } from "./ai-chat-markdown";
import { AiChatMessageActions } from "./ai-chat-message-actions";
import { useAiChat } from "./ai-chat-provider";

// Quick, subtle entrance — fade + 8px slide up. Quartic ease-out for a soft settle.
const ENTRANCE_INITIAL = { opacity: 0, y: 8 };
const ENTRANCE_ANIMATE = { opacity: 1, y: 0 };
const ENTRANCE_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

interface AiChatMessageProps {
  message: UIMessage;
  children?: ReactNode;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
  /** Callbacks for message actions */
  onFeedback?: (type: MessageFeedbackType) => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

function getDisplayText(message: UIMessage): string {
  return message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.content)
    .join("");
}

export function AiChatMessage({
  message,
  children,
  isStreaming: isStreamingProp,
  onFeedback,
  onRegenerate,
  onEdit,
}: AiChatMessageProps) {
  const config = useAiChat();
  const isUser = message.role === "user";
  const displayContent = getDisplayText(message);

  // Streaming state — explicit prop wins, otherwise derive from chat-level isLoading
  // and the latest assistant message ID. The latest assistant message is the one
  // currently being generated when isLoading is true.
  const isStreaming =
    isStreamingProp ??
    (config.isLoading &&
      !isUser &&
      config.latestAssistantMessageId === message.id);

  // Throttle assistant text reveal to a comfortable reading pace.
  // For user messages, cps=0 disables the typewriter so the full text appears instantly.
  const { displayedText, isAnimating } = useTypewriter(displayContent, {
    cps: isUser ? 0 : config.typewriterCps,
    isStreaming,
  });

  // Latest assistant message keeps its actions always-visible; older messages
  // hover-reveal. The chat parent computes the latest ID via context.
  const isLatestAssistant =
    !isUser && config.latestAssistantMessageId === message.id;

  // Push typewriter state up to the chat parent when this is the latest
  // assistant message. The chat uses this to gate suggestion buttons until
  // the response is fully revealed (typewriter has finished draining).
  const setIsLatestResponseAnimating = config.setIsLatestResponseAnimating;
  useEffect(() => {
    if (!isLatestAssistant) return;
    setIsLatestResponseAnimating(isAnimating);
    return () => setIsLatestResponseAnimating(false);
  }, [isLatestAssistant, isAnimating, setIsLatestResponseAnimating]);

  // Message actions (copy/thumbs/regenerate) only appear once the response is
  // fully visible — both the LLM stream has finished AND the typewriter has
  // drained any buffered characters. Prevents actions from popping in mid-reveal.
  const isResponseFullyRevealed = !isStreaming && !isAnimating;

  if (!isUser && !displayContent && !children) {
    return null;
  }

  if (isUser) {
    return (
      <motion.div
        className="flex w-full justify-end"
        initial={ENTRANCE_INITIAL}
        animate={ENTRANCE_ANIMATE}
        transition={ENTRANCE_TRANSITION}
      >
        <div className="group/message flex flex-col items-end gap-1 max-w-[80%]">
          <div className="px-4 py-2 text-sm leading-6 rounded-2xl rounded-br-md bg-ai-chat-bubble-user text-ai-chat-bubble-user-foreground">
            {displayContent && (
              <p className="whitespace-pre-wrap">{displayContent}</p>
            )}
          </div>
          {config.showMessageActions && (
            <AiChatMessageActions
              content={displayContent}
              messageRole="user"
              showCopy={config.showCopyButton}
              onEdit={onEdit}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Hide message-level actions when this message belongs to a turn currently
  // presenting interactive choices — copy/feedback/regenerate aren't meaningful
  // on a "pick an option" prompt. The chat parent computes which messages are
  // part of the active choices turn (the prompt text and the tool call may live
  // on separate sibling messages) and shares the set via context.
  const isInActiveChoicesTurn = config.activeChoicesMessageIds.has(message.id);

  return (
    <motion.div
      className="flex w-full justify-start"
      initial={ENTRANCE_INITIAL}
      animate={ENTRANCE_ANIMATE}
      transition={ENTRANCE_TRANSITION}
    >
      <div className="group/message flex flex-col gap-3 max-w-[85%]">
        {displayContent && <AiChatMarkdown>{displayedText}</AiChatMarkdown>}
        {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
        {config.showMessageActions &&
          !isInActiveChoicesTurn &&
          isResponseFullyRevealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <AiChatMessageActions
                content={displayContent}
                messageRole="assistant"
                isLatest={isLatestAssistant}
                showCopy={config.showCopyButton}
                onFeedback={onFeedback}
                onRegenerate={onRegenerate}
              />
            </motion.div>
          )}
      </div>
    </motion.div>
  );
}
