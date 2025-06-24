/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMessage,
    AutopilotChatMode,
    AutopilotChatRole,
    CHAT_MESSAGE_MAX_PADDING,
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
    DEFAULT_MESSAGE_RENDERER,
    StorageService,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from '../../providers/chat-service.provider.react';
import { calculateDynamicPadding } from '../../utils/dynamic-padding';
import { Attachments } from '../common/attachments.react';
import { AutopilotChatMessageActions } from './actions/chat-actions.react';
import { AutopilotChatDisclaimers } from './disclaimers/chat-disclaimers.react';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown.react';
import { AutopilotChatSources } from './sources/chat-sources.react';

const APOLLO_MESSAGE_RENDERERS = [ {
    name: DEFAULT_MESSAGE_RENDERER,
    component: AutopilotChatMarkdownRenderer,
} ];

const MessageBoxComponent = styled('div')<{
    isAssistant: boolean;
    isCustomWidget?: boolean;
}>(({
    theme, isAssistant, isCustomWidget,
}) => {
    const chatService = useChatService();
    const chatInternalService = chatService.__internalService__;
    const [ padding, setPadding ] = React.useState(
        calculateDynamicPadding(parseInt(StorageService.Instance.get(CHAT_WIDTH_KEY) ?? CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString(), 10)),
    );

    React.useEffect(() => {
        if (!chatInternalService || !chatService) {
            return;
        }

        const unsubscribe = chatInternalService.on(AutopilotChatInternalEvent.ChatResize, (width: number) => {
            setPadding(calculateDynamicPadding(width));
        });

        const unsubscribeMode = chatService.on(
            AutopilotChatEvent.ModeChange, (mode: AutopilotChatMode) => {
                if (mode === AutopilotChatMode.FullScreen) {
                    setPadding(CHAT_MESSAGE_MAX_PADDING);
                } else {
                    const defaultWidth = CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString();
                    const storedWidth = StorageService.Instance.get(CHAT_WIDTH_KEY) ?? defaultWidth;
                    const width = parseInt(storedWidth, 10);

                    setPadding(calculateDynamicPadding(width));
                }
            });

        return () => {
            unsubscribe();
            unsubscribeMode();
        };
    }, [ chatInternalService, chatService ]);

    return {
        display: 'flex',
        padding: isAssistant ? 0 : token.Spacing.SpacingBase,
        paddingRight: isAssistant ? token.Spacing.SpacingXs : `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
        flexDirection: 'column',
        justifyContent: 'center',
        alignSelf: isAssistant ? 'flex-start' : 'flex-end',
        gap: token.Spacing.SpacingMicro,
        borderRadius: token.Border.BorderRadiusL,
        backgroundColor: isAssistant ? 'unset' : theme.palette.semantic.colorBackgroundSecondary,
        marginLeft: isAssistant ? '0' : `${padding}px`,
        marginRight: isAssistant ? token.Spacing.SpacingXl : '0',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        position: 'relative',
        ...(isCustomWidget && { width: '100%' }),
    };
});

const MessageBox = React.memo(MessageBoxComponent);

const WidgetContainer = React.memo(({
    message, isLastInGroup, containerRef,
}: {
    message: AutopilotChatMessage;
    isLastInGroup: boolean;
    containerRef: HTMLDivElement | null;
}) => {
    const chatService = useChatService();
    const unsubscribeRef = React.useRef<() => void>(() => {});

    React.useEffect(() => {
        return () => {
            unsubscribeRef?.current?.();
        };
    }, []);

    return (
        <MessageBox
            isAssistant={message.role === AutopilotChatRole.Assistant}
            isCustomWidget
        >
            {message.attachments && message.attachments.length > 0 && (
                <Attachments attachments={message.attachments} removeSpacing disableOverflow />
            )}
            <div className="chat-widget-container" ref={(el) => {
                if (el) {
                    const unsubscribe = chatService.renderMessage(el, message);

                    if (unsubscribe) {
                        unsubscribeRef.current = unsubscribe;
                    }
                }
            }}/>
            {isLastInGroup && (
                <AutopilotChatMessageActions message={message} containerElement={containerRef}/>
            )}
        </MessageBox>
    );
});

function AutopilotChatMessageContentComponent({
    message, isLastInGroup = true, containerRef,
}: { message: AutopilotChatMessage; isLastInGroup?: boolean; containerRef: HTMLDivElement | null }) {
    const chatService = useChatService();

    if (!message.content && !message.attachments) {
        return null;
    }

    if (!chatService.getMessageRenderer(message.widget)) {
        const ApolloMessageRenderer = APOLLO_MESSAGE_RENDERERS.find(renderer => renderer.name === message.widget)?.component;

        return (
            <MessageBox
                isAssistant={message.role === AutopilotChatRole.Assistant}
                key={message.id}
            >
                {message.attachments && message.attachments.length > 0 && (
                    <Attachments attachments={message.attachments} removeSpacing disableOverflow />
                )}
                {ApolloMessageRenderer ? <ApolloMessageRenderer message={message} /> : <AutopilotChatMarkdownRenderer message={message} />}
                {message.disclaimers && message.disclaimers.length > 0 && (
                    <AutopilotChatDisclaimers disclaimers={message.disclaimers} />
                )}
                {message.sources && message.sources.length > 0 && (
                    <AutopilotChatSources sources={message.sources} />
                )}
                {isLastInGroup && (
                    <AutopilotChatMessageActions message={message} containerElement={containerRef}/>
                )}
            </MessageBox>
        );
    }

    return (
        <WidgetContainer
            key={message.id}
            message={message}
            isLastInGroup={isLastInGroup}
            containerRef={containerRef}
        />
    );
}

export const AutopilotChatMessageContent = React.memo(AutopilotChatMessageContentComponent);
