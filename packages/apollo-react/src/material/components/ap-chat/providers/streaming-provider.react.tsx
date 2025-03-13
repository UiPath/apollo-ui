/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../services/chat-service';

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
    const chatService = AutopilotChatService.Instance;

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
    return React.useContext(AutopilotStreamingContext);
}
