"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { AlertCircle, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ChoiceOption } from "../types";
import { findLatestChoices } from "../utils/ai-chat-utils";
import { AiChatInput } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";
import { AiChatSuggestions } from "./ai-chat-suggestions";

export interface AiChatProps {
  messages: UIMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onStop: () => void;
  onClearChat?: () => void;
  onChoiceSelect?: (option: ChoiceOption) => void;
  children?: ReactNode;
  assistantName?: string;
  title?: string;
  emptyState?: ReactNode;
  placeholder?: string;
  showClearButton?: boolean;
  error?: Error | null;
}

export function AiChat({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  onClearChat,
  onChoiceSelect,
  children,
  assistantName,
  title,
  emptyState,
  placeholder,
  showClearButton = true,
  error,
}: AiChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const displayName = assistantName ?? t("ai_assistant");

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
    const last = contentRef.current?.lastElementChild;
    if (!last) return;
    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(last);
    return () => observer.disconnect();
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const latestChoices = findLatestChoices(messages);

  const lastMessageIsAssistant = messages.at(-1)?.role === "assistant";
  const showLoadingIndicator = isLoading && !lastMessageIsAssistant;

  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
      <div className="size-16 flex items-center justify-center mb-4 rounded-full bg-primary">
        <Sparkles
          className="size-8 text-primary-foreground"
          aria-hidden="true"
        />
      </div>
      <p>{t("start_conversation_with", { name: displayName })}</p>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full border rounded-lg bg-card"
      data-slot="ai-chat"
    >
      {title && (
        <div className="py-3 px-4">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4" aria-hidden="true" />
            {title}
          </h3>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle
            className="h-4 w-4 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{error.message}</span>
        </div>
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-label={t("chat_messages")}
        aria-live="polite"
        aria-atomic="false"
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          (emptyState ?? defaultEmptyState)
        ) : (
          <div ref={contentRef} className="space-y-4">
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
  );
}
