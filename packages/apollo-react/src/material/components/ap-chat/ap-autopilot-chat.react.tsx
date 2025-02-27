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
import { AutopilotChatMessages } from './components/message/chat-message.react';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';
import { AutopilotLoadingProvider } from './providers/loading-provider.react';
import { AutopilotChatService } from './services/chat-service';
import { StorageService } from './services/storage';
import {
    CHAT_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
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

const OverflowContainer = styled('div')(() => ({
    flex: '1 1 100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    paddingBottom: token.Spacing.SpacingBase,
}));

const MessagesContainer = styled('div')(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
    height: '100%',
}));

const InputBackground = styled('div')(({ theme }) => ({
    flexShrink: 0,
    borderTop: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingL}`,
    backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
}));

const InputContainer = styled('div')<{ isFullScreen: boolean }>(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
}));

export function ApAutopilotChatReact() {
    const storage = StorageService.Instance;
    const overflowContainerRef = React.useRef<HTMLDivElement>(null);
    const [ mode, setMode ] = React.useState<AutopilotChatMode>(AutopilotChatService.Instance.getConfig().mode);
    const [ width, setWidth ] = React.useState(() => {
        const savedWidth = storage.get(CHAT_WIDTH_KEY);

        return savedWidth ? parseInt(savedWidth, 10) : CHAT_WIDTH_SIDE_BY_SIDE_MIN;
    });
    const [ shouldAnimate, setShouldAnimate ] = React.useState(false);

    React.useEffect(() => {
        AutopilotChatService.Instance.on(AutopilotChatEvent.ModeChange, (chatMode) => {
            setMode(chatMode);
        });
    }, []);

    const scrollToBottom = React.useCallback(() => {
        if (overflowContainerRef.current) {
            // need a delay for the content to be rendered
            setTimeout(() => {
                requestAnimationFrame(() => {
                    const container = overflowContainerRef.current;

                    if (container) {
                        container.scrollTo({
                            top: container.scrollHeight,
                            behavior: 'smooth',
                        });
                    }
                });
            }, 200);
        }
    }, [ overflowContainerRef ]);

    return (
        <AutopilotErrorProvider>
            <AutopilotLoadingProvider>
                <AutopilotAttachmentsProvider>
                    <AutopilotChatDropzone>
                        <ChatContainer
                            shouldAnimate={shouldAnimate}
                            mode={mode}
                            width={width}
                        >
                            <DragHandle
                                width={width}
                                onWidthChange={setWidth}
                                setShouldAnimate={setShouldAnimate}
                            />

                            <HeaderContainer>
                                <AutopilotChatHeader />
                            </HeaderContainer>

                            <OverflowContainer ref={overflowContainerRef}>
                                <MessagesContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                                    <AutopilotChatMessages overflowContainerRef={overflowContainerRef} scrollToBottom={scrollToBottom} />
                                </MessagesContainer>
                            </OverflowContainer>

                            <InputBackground>
                                <InputContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                                    <AutopilotChatInput />
                                </InputContainer>
                            </InputBackground>
                        </ChatContainer>
                    </AutopilotChatDropzone>
                </AutopilotAttachmentsProvider>
            </AutopilotLoadingProvider>
        </AutopilotErrorProvider>
    );
}
