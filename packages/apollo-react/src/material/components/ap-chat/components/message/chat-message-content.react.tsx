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
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { StorageService } from '../../services/storage';
import {
    APOLLO_MESSAGE_RENDERERS,
    CHAT_MESSAGE_MAX_PADDING,
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '../../utils/constants';
import { calculateDynamicPadding } from '../../utils/dynamic-padding';
import { AutopilotChatMessageActions } from './actions/chat-actions.react';
import { AutopilotChatMarkdownRenderer } from './markdown/markdown.react';

const MessageBoxComponent = styled('div')<{
    isAssistant: boolean;
}>(({
    theme, isAssistant,
}) => {
    const chatService = AutopilotChatService.Instance;
    const chatInternalService = AutopilotChatInternalService.Instance;
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
    };
});

const MessageBox = React.memo(MessageBoxComponent);

const WidgetContainer = React.memo(({
    message, setMessageElement, messageElement,
}: {
    message: AutopilotChatMessage;
    setMessageElement: (element: HTMLDivElement | null) => void;
    messageElement: HTMLDivElement | null;
}) => {
    const chatService = AutopilotChatService.Instance;
    const unsubscribeRef = React.useRef<() => void>(() => {});

    React.useEffect(() => {
        return () => {
            unsubscribeRef?.current?.();
        };
    }, []);

    return (
        <MessageBox isAssistant={message.role === AutopilotChatRole.Assistant}>
            <div ref={(el) => {
                if (el) {
                    if (messageElement !== el) {
                        setMessageElement(el);
                    }

                    const unsubscribe = chatService.renderMessage(el, message);

                    if (unsubscribe) {
                        unsubscribeRef.current = unsubscribe;
                    }
                }
            }}/>
            <AutopilotChatMessageActions message={message} containerElement={messageElement}/>
        </MessageBox>
    );
});

function AutopilotChatMessageContentComponent({ message }: { message: AutopilotChatMessage }) {
    const chatService = AutopilotChatService.Instance;
    const [ messageElement, setMessageElement ] = React.useState<HTMLDivElement | null>(null);

    if (!message.content) {
        return null;
    }

    if (!chatService.getMessageRenderer(message.widget)) {
        const ApolloMessageRenderer = APOLLO_MESSAGE_RENDERERS.find(renderer => renderer.name === message.widget)?.component;

        return (
            <MessageBox
                ref={setMessageElement}
                isAssistant={message.role === AutopilotChatRole.Assistant}
                key={message.id}
            >
                {ApolloMessageRenderer ? <ApolloMessageRenderer message={message} /> : <AutopilotChatMarkdownRenderer message={message} />}
                <AutopilotChatMessageActions message={message} containerElement={messageElement}/>
            </MessageBox>
        );
    }

    return (
        <WidgetContainer
            key={message.id}
            message={message}
            setMessageElement={setMessageElement}
            messageElement={messageElement}
        />
    );
}

export const AutopilotChatMessageContent = React.memo(AutopilotChatMessageContentComponent);
