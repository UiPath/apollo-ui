import React from 'react';

import {
  type AutopilotChatError,
  type AutopilotChatErrorLevel,
  AutopilotChatEvent,
} from '../service';
import { useChatService } from './chat-service.provider';

interface AutopilotErrorContextType {
  error: AutopilotChatError | undefined;
  setError: (message: string | undefined, level?: AutopilotChatErrorLevel) => void;
  clearError: () => void;
}

export const AutopilotErrorContext = React.createContext<AutopilotErrorContextType>({
  error: undefined,
  setError: () => {},
  clearError: () => {},
});

export function AutopilotErrorProvider({ children }: { children: React.ReactNode }) {
  const chatService = useChatService();
  const [error, setErrorState] = React.useState<AutopilotChatError | undefined>(
    chatService?.getError() ?? undefined
  );

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribe = chatService.on(
      AutopilotChatEvent.Error,
      (errorData: AutopilotChatError) => {
        setErrorState(errorData);
      }
    );

    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
      setErrorState(undefined);
    });

    return () => {
      unsubscribe();
      unsubscribeNewChat();
    };
  }, [chatService]);

  return (
    <AutopilotErrorContext.Provider
      value={{
        error,
        setError: chatService?.setError,
        clearError: chatService?.clearError,
      }}
    >
      {children}
    </AutopilotErrorContext.Provider>
  );
}

export function useError() {
  const context = React.useContext(AutopilotErrorContext);

  if (!context) {
    throw new Error('useError must be used within a AutopilotErrorProvider');
  }

  return context;
}
