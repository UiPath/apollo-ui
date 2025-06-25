/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatActionPayload,
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMessage,
    AutopilotChatRole,
    AutopilotChatSuggestion,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from '../../providers/chat-service.provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useLoading } from '../../providers/loading-provider.react';
import { SkeletonLoader } from '../common/skeleton-loader.react';
import { AutopilotChatMessageContent } from './chat-message-content.react';
import { AutopilotChatFRE } from './first-run-experience/chat-fre.react';
import { AutopilotChatLoading } from './loader/chat-loading.react';
import { AutopilotChatLoadingMessages } from './loader/chat-loading-messages.react';
import { AutopilotChatSuggestions } from './suggestions/chat-suggestions.react';

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
    const chatService = useChatService();
    const [ showSkeletonLoader, setShowSkeletonLoader ] = React.useState<boolean>(false);
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(
        removeFakeStream(chatService?.getConversation?.() ?? []),
    );
    const [ messageGroups, setMessageGroups ] = React.useState<AutopilotChatMessage[][]>([]);
    const {
        setWaitingResponse, isLoadingMoreMessages,
    } = useLoading();

    const { firstRunExperience } = useChatState();

    const [ suggestions, setSuggestions ] = React.useState<AutopilotChatSuggestion[]>([]);
    const [ sendOnClick, setSendOnClick ] = React.useState<boolean>(false);

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
        const unsubscribeShowLoadingState = chatService.__internalService__
            .on(AutopilotChatInternalEvent.ShowLoadingState, (showLoadingState: boolean) => {
                setShowSkeletonLoader(showLoadingState);
            });
        const unsubscribeSetSuggestions = chatService.__internalService__
            .on(AutopilotChatInternalEvent.SetSuggestions, ({
                suggestions: suggestionsToSet,
                sendOnClick: sendOnClickToSet,
            }: {
                suggestions: AutopilotChatSuggestion[];
                sendOnClick: boolean;
            }) => {
                setSuggestions(suggestionsToSet);
                setSendOnClick(sendOnClickToSet);
            });

        return () => {
            unsubscribeRequest();
            unsubscribeResponse();
            unsubscribeConversation();
            unsubscribeNewChat();
            unsubscribeFeedback();
            unsubscribeCopy();
            unsubscribeShowLoadingState();
            unsubscribeSetSuggestions();
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
        <MessageContainer>
            {showSkeletonLoader ? (
                <SkeletonLoader />
            ) :
                <>
                    {isLoadingMoreMessages && (
                        <AutopilotChatLoadingMessages />
                    )}
                    { messages.length === 0 && (
                        <AutopilotChatFRE />
                    )}
                    {messageGroups.map((group) => (
                        <MessageGroup key={group[0].id} messages={group} />
                    ))}
                    { messages.length > 0 && suggestions.length > 0 && (
                        <AutopilotChatSuggestions
                            suggestions={suggestions}
                            sendOnClick={sendOnClick ?? firstRunExperience?.sendOnClick ?? false}
                            includeTitle={true}
                        />
                    )}

                    <AutopilotChatLoading />
                </>
            }
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
