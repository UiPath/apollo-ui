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

import { useChatService } from '../../providers/chat-service.provider.react';
import { useLoading } from '../../providers/loading-provider.react';
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

const MessageGroup = React.memo(({ messages }: { messages: AutopilotChatMessage[] }) => {
    const [ groupRef, setGroupRef ] = React.useState<HTMLDivElement | null>(null);

    return (
        <div ref={setGroupRef}>
            {messages.map((message, index) => (
                <AutopilotChatMessageContent
                    key={message.id}
                    message={message}
                    isLastInGroup={index === messages.length - 1}
                    containerRef={groupRef}
                />
            ))}
        </div>
    );
});

function AutopilotChatMessagesComponent() {
    const messageContainerRef = React.useRef<HTMLDivElement>(null);
    const chatService = useChatService();
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(
        removeFakeStream(chatService?.getConversation?.() ?? []),
    );
    const [ messageGroups, setMessageGroups ] = React.useState<AutopilotChatMessage[][]>([]);
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

    const onCopy = React.useCallback(({
        group, message,
    }: AutopilotChatActionPayload) => {
        let finalString = '';

        if (group.length === 0) {
            finalString = message.toCopy ?? message.content;
        } else {
            for (const msg of group) {
                finalString += (msg.toCopy ?? msg.content) + '\n';
            }
        }

        if (navigator.clipboard && finalString) {
            navigator.clipboard.writeText(finalString).catch(() => {});
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

    React.useEffect(() => {
        const getMessageGroups = () => {
            return messages.reduce((acc, message, index) => {
                if (!message.groupId) {
                    acc.push([ message ]);
                } else if (index > 0 && messages[index - 1].groupId === message.groupId) {
                    acc[acc.length - 1].push(message);
                } else {
                    acc.push([ message ]);
                }

                return acc;
            }, [] as AutopilotChatMessage[][]);
        };

        setMessageGroups(getMessageGroups());
    }, [ messages ]);

    return (
        <MessageContainer ref={messageContainerRef}>
            { messages.length === 0 && (
                <AutopilotChatFRE />
            )}
            {messageGroups.map((group) => (
                <MessageGroup key={group[0].id} messages={group} />
            ))}

            <AutopilotChatLoading />
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
