/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import {
    AutopilotChatMessage,
    AutopilotChatRole,
} from '../../models/chat.model';
import { AutopilotChatService } from '../../services/chat-service';
import { APOLLO_MESSAGE_RENDERERS } from '../../utils/constants';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown.react';

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

function AutopilotChatMessageContentComponent({
    message, scrollToBottom,
}: { message: AutopilotChatMessage; scrollToBottom: () => void }) {
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
}

export const AutopilotChatMessageContent = React.memo(AutopilotChatMessageContentComponent);
