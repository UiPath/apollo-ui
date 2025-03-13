/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatInterceptableEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMessage,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../../services/chat-internal-service';
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

interface AutopilotChatMessagesProps {
    scrollToBottom: () => void;
    overflowContainerRef: React.RefObject<HTMLDivElement>;
}

function AutopilotChatMessagesComponent({
    scrollToBottom, overflowContainerRef,
}: AutopilotChatMessagesProps) {
    const messageContainerRef = React.useRef<HTMLDivElement>(null);
    const chatService = AutopilotChatService.Instance;
    const chatInternalService = AutopilotChatInternalService.Instance;
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(
        chatService?.getConversation?.() ?? [],
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
        scrollToBottom();

        if (!chatInternalService) {
            return;
        }

        const unsubscribeScrollToBottom = chatInternalService.on(AutopilotChatInternalEvent.ScrollToBottom, () => {
            scrollToBottom();
        });

        return () => {
            unsubscribeScrollToBottom();
        };
    }, [ scrollToBottom, chatInternalService ]);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        // use an interceptor to add the message to the messages array so the chat doesn't have to wait for the consumer confirmation
        const unsubscribeRequest = chatService.intercept(AutopilotChatInterceptableEvent.Request, updateMessages);
        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, updateMessages);
        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => setMessages([]));

        return () => {
            unsubscribeRequest();
            unsubscribeResponse();
            unsubscribeNewChat();
        };
    }, [ chatService, updateMessages ]);

    const onAttachmentsToggleExpanded = React.useCallback((index: number) => {
        const container = overflowContainerRef.current;
        const BOTTOM_THRESHOLD = 300;
        const MESSAGE_THRESHOLD = 3;

        if (!container) {
            return;
        }

        const containerVisibleHeight = container.clientHeight;
        const distanceFromBottom = container.scrollHeight - (container.scrollTop + containerVisibleHeight);

        // Only scroll if we're near the bottom (within BOTTOM_THRESHOLD)
        // AND the message is the last 3 messages
        if (distanceFromBottom <= BOTTOM_THRESHOLD && index > messages.length - MESSAGE_THRESHOLD) {
            scrollToBottom();
        }
    }, [ scrollToBottom, overflowContainerRef, messages ]);

    return (
        <MessageContainer ref={messageContainerRef}>
            { messages.length === 0 && (
                <AutopilotChatFRE />
            )}
            {messages.map((message, index) => {
                return (
                    <React.Fragment key={message.id}>
                        {message.attachments && message.attachments.length > 0 && (
                            <AutopilotChatAttachments
                                attachments={message.attachments}
                                onToggleExpanded={() => onAttachmentsToggleExpanded(index)}
                            />
                        )}
                        <AutopilotChatMessageContent
                            message={message}
                            scrollToBottom={scrollToBottom}
                        />
                    </React.Fragment>
                );
            })}

            <AutopilotChatLoading />
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
