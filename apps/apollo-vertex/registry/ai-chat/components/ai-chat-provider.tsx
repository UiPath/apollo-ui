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
      <div data-slot="ai-chat-root" data-variant={variant}>
        {children}
      </div>
    </AiChatContext.Provider>
  );
}

export function useAiChat(): AiChatConfig {
  return useContext(AiChatContext);
}
