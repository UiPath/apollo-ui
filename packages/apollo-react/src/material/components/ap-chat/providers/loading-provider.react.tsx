/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

interface AutopilotLoadingContextType {
    waitingResponse: boolean;
    isLoadingMoreMessages: boolean;
    setWaitingResponse: (waitingResponse: boolean) => void;
}

export const AutopilotLoadingContext = React.createContext<AutopilotLoadingContextType>({
    waitingResponse: false,
    isLoadingMoreMessages: false,
    setWaitingResponse: () => {},
});

export function AutopilotLoadingProvider({ children }: { children: React.ReactNode }) {
    const [ waitingResponse, setWaitingResponse ] = React.useState<boolean>(false);
    const [ isLoadingMoreMessages, setIsLoadingMoreMessages ] = React.useState<boolean>(false);
    const chatService = useChatService();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeSetIsLoadingMoreMessages = chatService.__internalService__.on(
            AutopilotChatInternalEvent.SetIsLoadingMoreMessages,
            (value: boolean) => {
                setIsLoadingMoreMessages(value);
            },
        );

        const unsubscribeShouldShowLoadingMoreMessages = chatService.__internalService__.on(
            AutopilotChatInternalEvent.ShouldShowLoadingMoreMessages,
            (value: boolean) => {
                if (!value) {
                    setIsLoadingMoreMessages(false);
                }
            },
        );

        const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, () => {
            setWaitingResponse(true);
        });

        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, (message: AutopilotChatMessage) => {
            setWaitingResponse(!!message.shouldWaitForMoreMessages);
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
            unsubscribeSetIsLoadingMoreMessages();
            unsubscribeShouldShowLoadingMoreMessages();
        };
    }, [ chatService ]);

    return (
        <AutopilotLoadingContext.Provider value={{
            waitingResponse,
            setWaitingResponse,
            isLoadingMoreMessages,
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
