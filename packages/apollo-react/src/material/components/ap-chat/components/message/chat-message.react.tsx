/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatActionPayload,
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatMessage,
    AutopilotChatRole,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useLoading } from '../../providers/loading-provider.react';
import { AutopilotChatService } from '../../services/chat-service';
import { CHAT_WAITING_RESPONSE_TIMEOUT } from '../../utils/constants';
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

const Message = React.memo(({ message }: { message: AutopilotChatMessage }) => {
    return (
        <React.Fragment key={message.id}>
            {message.attachments && message.attachments.length > 0 && (
                <AutopilotChatAttachments attachments={message.attachments}/>
            )}
            <AutopilotChatMessageContent message={message}/>
        </React.Fragment>
    );
});

function AutopilotChatMessagesComponent() {
    const messageContainerRef = React.useRef<HTMLDivElement>(null);
    const chatService = AutopilotChatService.Instance;
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(
        removeFakeStream(chatService?.getConversation?.() ?? []),
    );
    const { setWaitingResponse } = useLoading();

    // Update by patching if the message already exists or adding to the end of the array
    const updateMessages = React.useCallback((message: AutopilotChatMessage) => {
        setMessages(prev => {
            if (prev.some(m => m.id === message.id)) {
                return prev.map(m => m.id === message.id ? message : m);
            }
            return [ ...prev, message ];
        });
    }, []);

    const sendFeedback = React.useCallback(({
        message, action,
    }: AutopilotChatActionPayload) => {
        if (!chatService) {
            return;
        }

        if (message.role === AutopilotChatRole.Assistant) {
            chatService.sendResponse({
                ...message,
                ...(message.fakeStream ? { fakeStream: false } : {}),
                feedback: { isPositive: action.details?.isPositive },
            } satisfies AutopilotChatMessage);
        } else {
            chatService.sendRequest({
                ...message,
                ...(message.fakeStream ? { fakeStream: false } : {}),
                feedback: { isPositive: action.details?.isPositive },
            } satisfies AutopilotChatMessage);
        }
    }, [ chatService ]);

    const onCopy = React.useCallback(({ message }: AutopilotChatActionPayload) => {
        if (navigator.clipboard && message.content) {
            navigator.clipboard.writeText(message.content).catch(() => {});
        }
    }, []);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        // use an interceptor to add the message to the messages array so the chat doesn't have to wait for the consumer confirmation
        const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, updateMessages);
        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, updateMessages);
        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => setMessages([]));
        const unsubscribeFeedback = chatService.on(AutopilotChatEvent.Feedback, sendFeedback);
        const unsubscribeCopy = chatService.on(AutopilotChatEvent.Copy, onCopy);
        // set messages to the new conversation
        const unsubscribeConversation = chatService.on(AutopilotChatEvent.SetConversation, (msg) => {
            setMessages(removeFakeStream(msg));

            const lastMessage = msg[msg.length - 1];

            // FIXME: Assumption - if last message is a user message and it's newer than 15 seconds, set waiting response to true
            if (
                lastMessage &&
                lastMessage.role === AutopilotChatRole.User &&
                new Date(lastMessage.created_at).getTime() > Date.now() - CHAT_WAITING_RESPONSE_TIMEOUT
            ) {
                setWaitingResponse(true);
            }
        });

        return () => {
            unsubscribeRequest();
            unsubscribeResponse();
            unsubscribeConversation();
            unsubscribeNewChat();
            unsubscribeFeedback();
            unsubscribeCopy();
        };
    }, [ chatService, updateMessages, setWaitingResponse, sendFeedback, onCopy ]);

    return (
        <MessageContainer ref={messageContainerRef}>
            { messages.length === 0 && (
                <AutopilotChatFRE />
            )}
            {messages.map((message) => {
                return (
                    <Message key={message.id} message={message} />
                );
            })}

            <AutopilotChatLoading />
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
