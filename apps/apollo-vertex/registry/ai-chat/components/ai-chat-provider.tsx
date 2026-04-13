"use client";

import { createContext, useContext } from "react";
import type { AiChatConfig, AiChatVariant } from "../types";

const defaultConfig: AiChatConfig = {
  variant: "default",
  assistantName: "AI Assistant",
  showTimestamps: false,
  showMessageActions: true,
  showCopyButton: true,
  isLoading: false,
  activeChoicesMessageIds: new Set(),
  latestAssistantMessageId: null,
  typewriterCps: 75,
  isLatestResponseAnimating: false,
  setIsLatestResponseAnimating: () => {
    // no-op default — replaced by AiChat with the real setter via context override
  },
  onEditMessage: undefined,
};

const AiChatContext = createContext<AiChatConfig>(defaultConfig);

interface AiChatProviderProps extends Partial<AiChatConfig> {
  children: React.ReactNode;
}

export function AiChatProvider({
  children,
  ...overrides
}: AiChatProviderProps) {
  const config: AiChatConfig = { ...defaultConfig, ...overrides };
  const variant: AiChatVariant = config.variant;

  return (
    <AiChatContext.Provider value={config}>
      {/*
        display: contents — wrapper carries data attributes for styling/test
        hooks but disappears from the box tree, so the AiChat outer div is a
        direct child of whatever the consumer's parent is. Without this, h-full
        on the AiChat outer would read this wrapper's auto height and collapse,
        and the chat would grow to fit its content instead of scrolling within
        a fixed-height parent like h-[500px].
      */}
      <div className="contents" data-slot="ai-chat-root" data-variant={variant}>
        {children}
      </div>
    </AiChatContext.Provider>
  );
}

export function useAiChat(): AiChatConfig {
  return useContext(AiChatContext);
}
