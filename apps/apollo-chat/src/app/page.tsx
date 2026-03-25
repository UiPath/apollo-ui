"use client";

import { ChatComposer } from "@/components/chat-composer";
import {
  PromptSuggestions,
  type PromptSuggestion,
} from "@/components/prompt-suggestions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState } from "react";

const SUGGESTIONS: PromptSuggestion[] = [
  { id: "1", label: "Make a list of affordable apartments in NYC" },
  { id: "2", label: "Find the highest CD rates available right now" },
  { id: "3", label: "Summarize the latest AI research trends" },
];

export default function ChatPage() {
  const [text, setText] = useState("");
  const modelRef = useRef("claude-sonnet-4-5");

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ model: modelRef.current }),
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const isEmpty = messages.length === 0;

  const handleSubmit = () => {
    if (!text.trim() && !isStreaming) return;
    sendMessage({ text });
    setText("");
  };

  const handleSuggestion = (suggestion: PromptSuggestion) => {
    sendMessage({ text: suggestion.label });
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      {isEmpty ? (
        /* ── First-run / empty state ── */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="flex w-full max-w-[800px] flex-col items-center gap-[37px]">
            {/* Greeting */}
            <div className="flex flex-col items-center text-center">
              <h1 className="text-[40px] font-bold leading-tight tracking-[-0.8px] text-foreground">
                Hello David
              </h1>
              <p className="mt-1 text-base font-normal leading-9 text-foreground-secondary">
                What should we work on today?
              </p>
            </div>

            {/* Composer */}
            <ChatComposer
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
              onStop={stop}
              isStreaming={isStreaming}
              placeholder="I would like you to automate my"
            />

            {/* Suggestions */}
            <PromptSuggestions
              className="w-full"
              suggestions={SUGGESTIONS}
              onSelect={handleSuggestion}
            />
          </div>
        </div>
      ) : (
        /* ── Active conversation ── */
        <>
          <Conversation className="flex-1 overflow-y-auto px-4 py-6">
            <ConversationContent className="mx-auto max-w-[800px] space-y-6">
              {messages.map((message) => {
                const reasoningParts = message.parts.filter(
                  (p) => p.type === "reasoning"
                );
                const textParts = message.parts.filter(
                  (p) => p.type === "text"
                );
                const sourceUrlParts = message.parts.filter(
                  (p) => p.type === "source-url"
                );
                const isLastMessage =
                  message === messages[messages.length - 1];

                return (
                  <Message
                    key={message.id}
                    from={message.role === "user" ? "user" : "assistant"}
                  >
                    <div>
                      {sourceUrlParts.length > 0 && (
                        <Sources>
                          <SourcesTrigger count={sourceUrlParts.length} />
                          <SourcesContent>
                            {sourceUrlParts.map((p) =>
                              p.type === "source-url" ? (
                                <Source
                                  key={p.sourceId}
                                  href={p.url}
                                  title={p.title}
                                />
                              ) : null
                            )}
                          </SourcesContent>
                        </Sources>
                      )}
                      {reasoningParts.length > 0 && (
                        <Reasoning isStreaming={isStreaming && isLastMessage}>
                          <ReasoningTrigger />
                          <ReasoningContent>
                            {reasoningParts
                              .map((p) =>
                                p.type === "reasoning" ? p.text : ""
                              )
                              .join("")}
                          </ReasoningContent>
                        </Reasoning>
                      )}
                      <MessageContent>
                        <MessageResponse>
                          {textParts
                            .map((p) => (p.type === "text" ? p.text : ""))
                            .join("")}
                        </MessageResponse>
                      </MessageContent>
                    </div>
                  </Message>
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Composer pinned at bottom */}
          <div className="flex justify-center px-4 py-4">
            <ChatComposer
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
              onStop={stop}
              isStreaming={isStreaming}
              placeholder="Message..."
            />
          </div>
        </>
      )}
    </div>
  );
}
