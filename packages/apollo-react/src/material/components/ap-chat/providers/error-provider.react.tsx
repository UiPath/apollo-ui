/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';

import { AutopilotChatEvent } from '../models/chat.model';
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
    const [ error, setErrorState ] = React.useState<string | undefined>(undefined);
    const chatService = AutopilotChatService.Instance;

    React.useEffect(() => {
        const unsubscribe = chatService.on(AutopilotChatEvent.Error, (err: string) => {
            setErrorState(err);
        });

        return () => {
            unsubscribe();
        };
    }, [ chatService ]);

    return (
        <AutopilotErrorContext.Provider value={{
            error,
            setError: chatService.setError,
            clearError: chatService.clearError,
        }}>
            {children}
        </AutopilotErrorContext.Provider>
    );
}

export function useError() {
    return React.useContext(AutopilotErrorContext);
}
