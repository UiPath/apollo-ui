/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../services/chat-service';

interface AutopilotLoadingContextType {
    waitingResponse: boolean;
    setWaitingResponse: (waitingResponse: boolean) => void;
}

export const AutopilotLoadingContext = React.createContext<AutopilotLoadingContextType>({
    waitingResponse: false,
    setWaitingResponse: () => {},
});

export function AutopilotLoadingProvider({ children }: { children: React.ReactNode }) {
    const [ waitingResponse, setWaitingResponse ] = React.useState<boolean>(false);
    const chatService = AutopilotChatService.Instance;

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, () => {
            setWaitingResponse(true);
        });

        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, () => {
            setWaitingResponse(false);
        });

        const unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
            setWaitingResponse(false);
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setWaitingResponse(false);
        });

        return () => {
            unsubscribeRequest();
            unsubscribeResponse();
            unsubscribeStopResponse();
            unsubscribeNewChat();
        };
    }, [ chatService ]);

    return (
        <AutopilotLoadingContext.Provider value={{
            waitingResponse,
            setWaitingResponse,
        }}>
            {children}
        </AutopilotLoadingContext.Provider>
    );
}

export function useLoading() {
    const context = React.useContext(AutopilotLoadingContext);

    if (!context) {
        throw new Error('useLoading must be used within a AutopilotLoadingProvider');
    }

    return context;
}
