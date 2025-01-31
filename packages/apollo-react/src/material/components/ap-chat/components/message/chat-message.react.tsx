/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import {
    AutopilotChatEvent,
    AutopilotChatMessage,
    AutopilotChatRole,
} from '../../models/chat.model';
import { AutopilotChatService } from '../../services/chat-service';
import { APOLLO_MESSAGE_RENDERERS } from '../../utils/constants';
import { AutopilotChatAttachments } from './attachments/attachments.react';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown.react';

const MessageContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXl,
    margin: `0 ${token.Spacing.SpacingL}`,
}));

const MessageBox = styled('div')<{
    isAssistant: boolean;
}>(({
    theme, isAssistant,
}) => ({
    display: 'flex',
    padding: token.Spacing.SpacingBase,
    paddingRight: `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: isAssistant ? 'flex-start' : 'flex-end',
    gap: token.Spacing.SpacingMicro,
    borderRadius: token.Border.BorderRadiusL,
    backgroundColor: isAssistant ? 'unset' : theme.palette.semantic.colorBackgroundSecondary,
    marginLeft: isAssistant ? '0' : token.Spacing.SpacingL,
    marginRight: isAssistant ? token.Spacing.SpacingL : '0',
    maxWidth: 'calc(100% - 112px)',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
}));

const MessageContent = React.memo(({
    message, scrollToBottom,
}: { message: AutopilotChatMessage; scrollToBottom: () => void }) => {
    const chatService = AutopilotChatService.Instance;

    React.useLayoutEffect(() => {
        if (scrollToBottom) {
            scrollToBottom();
        }
    }, [ scrollToBottom, message ]);

    if (!message.content) {
        return null;
    }

    if (!chatService.getMessageRenderer(message.widget)) {
        const ApolloMessageRenderer = APOLLO_MESSAGE_RENDERERS.find(renderer => renderer.name === message.widget)?.component;

        if (!ApolloMessageRenderer) {
            return (
                <MessageBox isAssistant={message.role === AutopilotChatRole.Assistant} key={message.id}>
                    <AutopilotChatMarkdownRenderer message={message} />
                </MessageBox>
            );
        }

        return (
            <MessageBox isAssistant={message.role === AutopilotChatRole.Assistant} key={message.id}>
                <ApolloMessageRenderer message={message} />
            </MessageBox>
        );
    }

    return (
        <MessageBox
            isAssistant={message.role === AutopilotChatRole.Assistant}
            key={message.id}
            ref={(el) => {
                if (el) {
                    chatService.renderMessage(el, message);
                }
            }}
        />
    );
});

interface AutopilotChatMessagesProps {
    scrollToBottom: () => void;
    overflowContainerRef: React.RefObject<HTMLDivElement>;
}

function AutopilotChatMessagesComponent({
    scrollToBottom, overflowContainerRef,
}: AutopilotChatMessagesProps) {
    const chatService = AutopilotChatService.Instance;
    const messageContainerRef = React.useRef<HTMLDivElement>(null);
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>(chatService.getMessages());

    React.useEffect(() => {
        const unsubscribe = chatService.on(AutopilotChatEvent.Message, () => {
            setMessages(chatService.getMessages());
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setMessages([]);
        });

        return () => {
            unsubscribe();
            unsubscribeNewChat();
        };
    }, [ chatService ]);

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
            {messages.map((message, index) => {
                return (
                    <React.Fragment key={message.id}>
                        {message.attachments && message.attachments.length > 0 && (
                            <AutopilotChatAttachments
                                attachments={message.attachments}
                                onToggleExpanded={() => onAttachmentsToggleExpanded(index)}
                            />
                        )}
                        <MessageContent
                            message={message}
                            scrollToBottom={scrollToBottom}
                        />
                    </React.Fragment>
                );
            })}
        </MessageContainer>
    );
}

export const AutopilotChatMessages = React.memo(AutopilotChatMessagesComponent);
