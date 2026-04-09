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
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground">
          {"What would you like to do?"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {"I can help you review, fix, or complete your work."}
        </p>
      </div>
    </div>
  );

  const padding = isCompact ? "p-2" : "py-4 pl-10 pr-4";
  const messageGap = isCompact ? "space-y-2" : "space-y-1";

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
            ? "flex flex-col h-full max-w-[765px] mx-auto bg-transparent text-ai-chat-foreground"
            : "flex flex-col h-full max-w-[765px] mx-auto border border-ai-chat-border rounded-lg bg-transparent text-ai-chat-foreground"
        }
        data-slot="ai-chat"
      >
        {renderHeader ??
          (title && !isCompact && !isEmbedded && (
            <div className="py-3 px-4 flex items-center gap-2">
              <Sparkles className="size-4 text-[#6C5AEF]" aria-hidden="true" />
              <span
                className="text-sm font-bold tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--ai-gradient-strong)" }}
              >
                {title}
              </span>
            </div>
          ))}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center px-4" style={{ justifyContent: "center", paddingBottom: "10%" }}>
            <div className="w-full max-w-[765px]">
              <div className="text-center mb-10">
                {emptyState ?? defaultEmptyState}
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
                hasMessages={false}
              />
            </div>
          </div>
        ) : (
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            role="log"
            aria-label={t("chat_messages")}
            aria-live="polite"
            aria-atomic="false"
            className={`h-full overflow-y-auto ${padding}`}
          >
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
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="relative z-0 mx-4 -mb-6 flex items-center gap-2 rounded-t-lg bg-destructive/10 px-[23px] pt-3 pb-6 text-sm text-destructive"
          >
            <AlertCircle
              className="h-4 w-4 flex-shrink-0"
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

        {messages.length > 0 && (
          <AiChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={onStop}
            onClear={onClearChat}
            isLoading={isLoading}
            placeholder={placeholder}
            showClearButton={showClearButton}
            hasMessages
          />
        )}
      </div>
    </AiChatProvider>
  );
}
