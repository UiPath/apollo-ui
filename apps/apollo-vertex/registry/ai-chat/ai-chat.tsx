"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiChatInput, type AiChatInputHandle } from "./ai-chat-input";
import { AiChatLoading } from "./ai-chat-loading";
import { AiChatMessage } from "./ai-chat-message";
import { AiChatSuggestions } from "./ai-chat-suggestions";
import { AiChatToolGroupMessage } from "./ai-chat-tool-group-message";
import { findLatestChoices, groupMessages } from "@/lib/ai-chat-utils";
import type { ChatMessage, ChoiceOption } from "@/lib/ai-chat-types";

interface AiChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string, files?: File[]) => void;
  onStop: () => void;
  onClearChat?: () => void;
  onChoiceSelect?: (option: ChoiceOption) => void;
  renderToolCall?: (toolCall: ChatMessage["toolCalls"]) => ReactNode;
  assistantName?: string;
  title?: string;
  emptyState?: ReactNode;
  placeholder?: string;
  showClearButton?: boolean;
  allowFileAttachments?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  toolDisplayNames?: Record<string, string>;
  enableToolGrouping?: boolean;
}

export function AiChat({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  onClearChat,
  onChoiceSelect,
  renderToolCall,
  assistantName,
  title,
  emptyState,
  placeholder,
  showClearButton = true,
  allowFileAttachments = true,
  maxFiles,
  maxFileSize,
  acceptedFileTypes,
  toolDisplayNames,
  enableToolGrouping = false,
}: AiChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<AiChatInputHandle>(null);
  const displayName = assistantName ?? t("ai_assistant");

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let previousScrollHeight = container.scrollHeight;
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const scrollToBottom = (force = false) => {
      const currentScrollHeight = container.scrollHeight;
      if (force || currentScrollHeight > previousScrollHeight) {
        container.scrollTop = currentScrollHeight;
        previousScrollHeight = currentScrollHeight;
      }
    };

    const initialTimer = setTimeout(() => scrollToBottom(true), 100);

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => scrollToBottom(false), 50);
    });

    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(scrollTimeout);
      resizeObserver.disconnect();
    };
  }, [messages]);

  const handleSubmit = (files?: File[]) => {
    if ((!input.trim() && !files) || isLoading) return;
    onSendMessage(input, files);
    setInput("");
  };

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const latestChoices = findLatestChoices(messages);

  const groupedItems = groupMessages(messages, enableToolGrouping);

  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
      <div className="size-16 flex items-center justify-center mb-4 rounded-full bg-primary">
        <Sparkles className="size-8 text-primary-foreground" />
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
            <Sparkles className="size-4" />
            {title}
          </h3>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {groupedItems.length === 0 ? (
          (emptyState ?? defaultEmptyState)
        ) : (
          <>
            {groupedItems.map((item, idx) => {
              if (item.kind === "tool-group") {
                const isLast = !groupedItems
                  .slice(idx + 1)
                  .some((g) => g.kind === "tool-group");
                return (
                  <AiChatToolGroupMessage
                    key={item.id}
                    toolCalls={item.toolCalls}
                    isLatest={isLast}
                    assistantName={displayName}
                    toolDisplayNames={toolDisplayNames}
                  />
                );
              }

              const message = item.message;
              return (
                <AiChatMessage
                  key={message.id}
                  message={message}
                  renderToolCall={renderToolCall}
                  assistantName={displayName}
                />
              );
            })}

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

            {isLoading && <AiChatLoading assistantName={displayName} />}
          </>
        )}
      </div>

      <AiChatInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={onStop}
        onClear={onClearChat}
        isLoading={isLoading}
        placeholder={placeholder}
        showClearButton={showClearButton}
        hasMessages={messages.length > 0}
        allowFileAttachments={allowFileAttachments}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        acceptedFileTypes={acceptedFileTypes}
      />
    </div>
  );
}

export { AiChatInput, type AiChatInputHandle } from "./ai-chat-input";
export { AiChatLoading } from "./ai-chat-loading";
export { AiChatMessage } from "./ai-chat-message";
export { AiChatSuggestions } from "./ai-chat-suggestions";
export { AiChatToolGroup } from "./ai-chat-tool-group";
export { AiChatToolGroupMessage } from "./ai-chat-tool-group-message";
export type {
  ChoiceOption,
  ToolResult,
  ToolResultChoices,
  ToolResultNavigation,
} from "@/lib/ai-chat-types";
