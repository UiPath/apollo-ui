/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

interface AutopilotStreamingContextType {
    streaming: boolean;
    setStreaming: (streaming: boolean) => void;
}

export const AutopilotStreamingContext = React.createContext<AutopilotStreamingContextType>({
    streaming: false,
    setStreaming: () => {},
});

export function AutopilotStreamingProvider({ children }: { children: React.ReactNode }) {
    const [ streaming, setStreaming ] = React.useState<boolean>(false);
    const chatService = useChatService();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
            setStreaming(false);
        });

        const unsubscribeStreaming = chatService.on(AutopilotChatEvent.SendChunk, (message: AutopilotChatMessage) => {
            setStreaming(!message.done);
        });

        return () => {
            unsubscribeStreaming();
            unsubscribeStopResponse();
        };
    }, [ chatService ]);

    return (
        <AutopilotStreamingContext.Provider value={{
            streaming,
            setStreaming,
        }}>
            {children}
        </AutopilotStreamingContext.Provider>
    );
}

export function useStreaming() {
    const context = React.useContext(AutopilotStreamingContext);

    if (!context) {
        throw new Error('useStreaming must be used within a AutopilotStreamingProvider');
    }

    return context;
}
