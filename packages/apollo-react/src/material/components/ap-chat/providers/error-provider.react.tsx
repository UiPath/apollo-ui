/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AutopilotChatEvent } from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../services/chat-service';

interface AutopilotErrorContextType {
    error: string | undefined;
    setError: (error: string | undefined) => void;
    clearError: () => void;
}

export const AutopilotErrorContext = React.createContext<AutopilotErrorContextType>({
    error: undefined,
    setError: () => {},
    clearError: () => {},
});

export function AutopilotErrorProvider({ children }: { children: React.ReactNode }) {
    const chatService = AutopilotChatService.Instance;
    const [ error, setErrorState ] = React.useState<string | undefined>(
        chatService?.getError() ?? undefined,
    );

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.Error, (err: string) => {
            setErrorState(err);
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setErrorState(undefined);
        });

        return () => {
            unsubscribe();
            unsubscribeNewChat();
        };
    }, [ chatService ]);

    return (
        <AutopilotErrorContext.Provider value={{
            error,
            setError: chatService?.setError,
            clearError: chatService?.clearError,
        }}>
            {children}
        </AutopilotErrorContext.Provider>
    );
}

export function useError() {
    return React.useContext(AutopilotErrorContext);
}
