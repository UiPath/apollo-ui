/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    Theme,
} from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { DragHandle } from './components/common/drag-handle.react';
import { AutopilotChatDropzone } from './components/dropzone/dropzone.react';
import { AutopilotChatHeader } from './components/header/header.react';
import { AutopilotChatInput } from './components/input/chat-input.react';
import { ChatScrollContainer } from './components/message/chat-scroll-container.react';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import { ChatScrollProvider } from './providers/chat-scroll-provider.react';
import {
    ChatWidthProvider,
    useChatWidth,
} from './providers/chat-width-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';
import { AutopilotLoadingProvider } from './providers/loading-provider.react';
import { AutopilotStreamingProvider } from './providers/streaming-provider.react';
import { AutopilotChatService } from './services/chat-service';
import {
    CHAT_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from './utils/constants';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number }>(({
    shouldAnimate, mode, width, theme,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; theme: Theme }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)', // account for global header hight
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: 'width 0.2s ease' }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
}));

const HeaderContainer = styled('div')(() => ({
    flexShrink: 0,
    paddingBottom: token.Spacing.SpacingBase,
    padding: `${token.Spacing.SpacingBase} ${token.Spacing.SpacingL}`,
}));

const InputBackground = styled('div')(() => ({
    flexShrink: 0,
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingL}`,
}));

const InputContainer = styled('div')<{ isFullScreen: boolean }>(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
}));

function AutopilotChatContent() {
    const [ mode, setMode ] = React.useState<AutopilotChatMode>(
        AutopilotChatService.Instance?.getConfig?.()?.mode ?? AutopilotChatMode.SideBySide,
    );
    const chatService = AutopilotChatService.Instance;
    const {
        width, shouldAnimate,
    } = useChatWidth();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.ModeChange, (chatMode) => {
            setMode(chatMode);
        });

        return () => {
            unsubscribe();
        };
    }, [ chatService ]);

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={mode}
            width={width}
        >
            <DragHandle />

            <HeaderContainer>
                <AutopilotChatHeader />
            </HeaderContainer>

            <ChatScrollProvider>
                <ChatScrollContainer mode={mode} />
            </ChatScrollProvider>

            <InputBackground>
                <InputContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                    <AutopilotChatInput />
                </InputContainer>
            </InputBackground>
        </ChatContainer>
    );
}

export function ApAutopilotChatReact() {
    return (
        <AutopilotErrorProvider>
            <AutopilotLoadingProvider>
                <AutopilotStreamingProvider>
                    <AutopilotAttachmentsProvider>
                        <ChatWidthProvider>
                            <AutopilotChatDropzone>
                                <AutopilotChatContent />
                            </AutopilotChatDropzone>
                        </ChatWidthProvider>
                    </AutopilotAttachmentsProvider>
                </AutopilotStreamingProvider>
            </AutopilotLoadingProvider>
        </AutopilotErrorProvider>
    );
}
