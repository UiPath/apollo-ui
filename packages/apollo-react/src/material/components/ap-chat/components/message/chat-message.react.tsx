/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatAttachments } from './attachments/attachments.react';
import { AutopilotChatMessageContent } from './chat-message-content.react';
import { AutopilotChatFRE } from './first-run-experience/chat-fre.react';
import { AutopilotChatLoading } from './loader/chat-loading.react';

const MessageContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXl,
    margin: `0 ${token.Spacing.SpacingL}`,
    height: '100%',
}));

const removeFakeStream = (messages: AutopilotChatMessage[]) => {
    return messages.map(({
        fakeStream, ...rest
    }) => rest);
};

function AutopilotChatMessagesComponent() {
    const messageContainerRef = React.useRef<HTMLDivElement>(null);
    const chatService = AutopilotChatService.Instance;
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(
        removeFakeStream(chatService?.getConversation?.() ?? []),
    );

    // Update by patching if the message already exists or adding to the end of the array
    const updateMessages = React.useCallback((message: AutopilotChatMessage) => {
        setMessages(prev => {
            if (prev.some(m => m.id === message.id)) {
                return prev.map(m => m.id === message.id ? message : m);
            }
            return [ ...prev, message ];
        });
    }, []);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        // use an interceptor to add the message to the messages array so the chat doesn't have to wait for the consumer confirmation
        const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, updateMessages);
        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, updateMessages);
        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => setMessages([]));
        // set messages to the new conversation
        const unsubscribeConversation = chatService.on(AutopilotChatEvent.SetConversation, (msg) => {
            setMessages(removeFakeStream(msg));
        });

        return () => {
            unsubscribeRequest();
            unsubscribeResponse();
            unsubscribeConversation();
            unsubscribeNewChat();
        };
    }, [ chatService, updateMessages ]);

    return (
        <MessageContainer ref={messageContainerRef}>
            { messages.length === 0 && (
                <AutopilotChatFRE />
            )}
            {messages.map((message) => {
                return (
                    <React.Fragment key={message.id}>
                        {message.attachments && message.attachments.length > 0 && (
                            <AutopilotChatAttachments attachments={message.attachments}/>
                        )}
                        <AutopilotChatMessageContent message={message}/>
                    </React.Fragment>
                );
            })}

            <AutopilotChatLoading />
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
