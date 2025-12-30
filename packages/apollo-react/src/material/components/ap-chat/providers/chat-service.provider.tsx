import React from 'react';

import { AutopilotChatService } from '../service';

interface AutopilotChatServiceContextType {
  chatService: AutopilotChatService | undefined;
}

export const AutopilotChatServiceContext = React.createContext<AutopilotChatServiceContextType>({
  chatService: undefined,
});

export function AutopilotChatServiceProvider({
  chatServiceInstance,
  children,
}: {
  chatServiceInstance: AutopilotChatService;
  children: React.ReactNode;
}) {
  const chatService = chatServiceInstance;

  return (
    <AutopilotChatServiceContext.Provider value={{ chatService }}>
      {children}
    </AutopilotChatServiceContext.Provider>
  );
}

export function useChatService() {
  const context = React.useContext(AutopilotChatServiceContext);

  if (!context) {
    throw new Error('useChatService must be used within a AutopilotChatServiceProvider');
  }

  return context.chatService as AutopilotChatService;
}
