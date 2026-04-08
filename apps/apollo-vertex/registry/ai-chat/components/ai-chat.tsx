"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { AlertCircle, ArrowDown, RefreshCw, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStickyScroll } from "../hooks/use-sticky-scroll";
import type { AiChatVariant, ChoiceOption } from "../types";

const RETRY_LABEL = "Retry";

import { findLatestChoices } from "../utils/ai-chat-utils";
import { AiChatInput } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";
import { AiChatProvider } from "./ai-chat-provider";
import { AiChatSuggestions } from "./ai-chat-suggestions";

export interface AiChatProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onStop: () => void;
  onClearChat?: () => void;
  onChoiceSelect?: (option: ChoiceOption) => void;
  onRetry?: () => void;
  children?: ReactNode;
  assistantName?: string;
  assistantAvatar?: ReactNode;
  userAvatar?: ReactNode;
  title?: string;
  renderHeader?: ReactNode;
  emptyState?: ReactNode;
  placeholder?: string;
  showClearButton?: boolean;
  showTimestamps?: boolean;
  showMessageActions?: boolean;
  showCopyButton?: boolean;
  error?: Error | null;
  variant?: AiChatVariant;
  /** Controlled input value */
  value?: string;
  /** Controlled input onChange */
  onValueChange?: (value: string) => void;
}

export function AiChat({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  onClearChat,
  onChoiceSelect,
  onRetry,
  children,
  assistantName,
  assistantAvatar,
  userAvatar,
  title,
  renderHeader,
  emptyState,
  placeholder,
  showClearButton = true,
  showTimestamps = false,
  showMessageActions = true,
  showCopyButton = true,
  error,
  variant = "default",
  value: controlledValue,
  onValueChange,
}: AiChatProps) {
  const { t } = useTranslation();
  const [internalInput, setInternalInput] = useState("");
  const { scrollRef, contentRef, isStuck, scrollToBottom } = useStickyScroll();

  const isControlled = controlledValue != null;
  const input = isControlled ? controlledValue : internalInput;
  const setInput =
    isControlled && onValueChange ? onValueChange : setInternalInput;

  const displayName = assistantName ?? t("ai_assistant");
  const isCompact = variant === "compact";
  const isEmbedded = variant === "embedded";

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    scrollToBottom();
  };

  const latestChoices = findLatestChoices(messages);

  const lastMessage = messages.at(-1);
  const lastAssistantHasText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "text" && p.content);
  const showLoadingIndicator = isLoading && !lastAssistantHasText;

  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center text-ai-chat-muted-foreground">
      <div className="size-16 flex items-center justify-center mb-4 rounded-full bg-ai-chat-accent">
        <Sparkles
          className="size-8 text-ai-chat-accent-foreground"
          aria-hidden="true"
        />
      </div>
      <p>{t("start_conversation_with", { name: displayName })}</p>
    </div>
  );

  const padding = isCompact ? "p-2" : "p-4";
  const messageGap = isCompact ? "space-y-2" : "space-y-4";

  return (
    <AiChatProvider
      variant={variant}
      assistantName={displayName}
      assistantAvatar={assistantAvatar}
      userAvatar={userAvatar}
      showTimestamps={showTimestamps}
      showMessageActions={showMessageActions}
      showCopyButton={showCopyButton}
      isLoading={isLoading}
    >
      <div
        className={
          isEmbedded
            ? "flex flex-col h-full bg-transparent text-ai-chat-foreground"
            : "flex flex-col h-full border border-ai-chat-border rounded-lg bg-ai-chat text-ai-chat-foreground"
        }
        data-slot="ai-chat"
      >
        {renderHeader ??
          (title && !isCompact && !isEmbedded && (
            <div className="py-3 px-4">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4" aria-hidden="true" />
                {title}
              </h3>
            </div>
          ))}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive max-h-16 overflow-y-auto"
          >
            <AlertCircle
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span className="flex-1">{error.message}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                aria-label={RETRY_LABEL}
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                {RETRY_LABEL}
              </button>
            )}
          </div>
        )}

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            role="log"
            aria-label={t("chat_messages")}
            aria-live="polite"
            aria-atomic="false"
            className={`h-full overflow-y-auto ${padding}`}
          >
            {messages.length === 0 ? (
              (emptyState ?? defaultEmptyState)
            ) : (
              <div ref={contentRef} className={messageGap}>
                {children}

                {latestChoices && !isLoading && (
                  <AiChatSuggestions
                    prompt={latestChoices.prompt}
                    options={latestChoices.options}
                    onSelect={(option) => {
                      if (onChoiceSelect) {
                        onChoiceSelect(option);
                      } else {
                        onSendMessage(option.label);
                      }
                    }}
                  />
                )}

                {showLoadingIndicator && (
                  <AiChatLoading assistantName={displayName} />
                )}
              </div>
            )}
          </div>

          {!isStuck && (
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label={t("scroll_to_bottom")}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center size-8 rounded-full border border-ai-chat-border bg-ai-chat shadow-md hover:bg-ai-chat-muted"
            >
              <ArrowDown className="size-4" />
            </button>
          )}
        </div>

        <AiChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={onStop}
          onClear={onClearChat}
          isLoading={isLoading}
          placeholder={placeholder}
          showClearButton={showClearButton}
          hasMessages={messages.length > 0}
        />
      </div>
    </AiChatProvider>
  );
}
