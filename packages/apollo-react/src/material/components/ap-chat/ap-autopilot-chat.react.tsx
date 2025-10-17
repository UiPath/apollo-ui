/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    Theme,
} from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatMode,
    AutopilotChatService,
    CHAT_CONTAINER_ANIMATION_DURATION,
    CHAT_WIDTH_FULL_SCREEN,
} from '@uipath/portal-shell-util';
import React from 'react';

import { DragHandle } from './components/common/drag-handle.react';
import { AutopilotChatDropzone } from './components/dropzone/dropzone.react';
import {
    FullScreenLayout,
    StandardLayout,
} from './components/layout';
import { AutopilotAgentModePickerProvider } from './providers/agent-mode-picker-provider.react';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import { AutopilotChatScrollProvider } from './providers/chat-scroll-provider.react';
import { AutopilotChatServiceProvider } from './providers/chat-service.provider.react';
import {
    AutopilotChatStateProvider,
    useChatState,
} from './providers/chat-state-provider.react';
import {
    AutopilotChatWidthProvider,
    useChatWidth,
} from './providers/chat-width-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';
import { AutopilotLoadingProvider } from './providers/loading-provider.react';
import { AutopilotModelPickerProvider } from './providers/model-picker-provider.react';
import { AutopilotStreamingProvider } from './providers/streaming-provider.react';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number; fullHeight: boolean }>(({
    shouldAnimate, mode, width, theme, fullHeight,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; theme: Theme; fullHeight: boolean }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: mode === AutopilotChatMode.FullScreen ? 'column' : 'row',
    height: fullHeight ? '100vh' : 'calc(100vh - 48px)', // account for global header height
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: `width ${CHAT_CONTAINER_ANIMATION_DURATION}ms ease` }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
    ...(mode === AutopilotChatMode.Embedded && {
        width: '100%',
        height: '100%',
        position: 'absolute',
        border: 'none',
    }),
}));

const AutopilotChatContent = React.memo(() => {
    const {
        width, shouldAnimate,
    } = useChatWidth();
    const {
        historyOpen,
        settingsOpen,
        disabledFeatures,
        chatMode,
        theming,
    } = useChatState();

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={chatMode}
            width={width}
            fullHeight={disabledFeatures.fullHeight === false}
        >
            { chatMode === AutopilotChatMode.SideBySide && (
                <DragHandle/>
            )}

            {chatMode === AutopilotChatMode.FullScreen ? (
                <FullScreenLayout
                    historyOpen={historyOpen}
                    settingsOpen={settingsOpen}
                    historyDisabled={disabledFeatures.history ?? false}
                    settingsDisabled={disabledFeatures.settings ?? false}
                    headerSeparatorDisabled={disabledFeatures.headerSeparator ?? false}
                    mode={chatMode}
                    theming={theming}
                />
            ) : (
                <StandardLayout
                    historyOpen={historyOpen}
                    settingsOpen={settingsOpen}
                    historyDisabled={disabledFeatures.history ?? false}
                    settingsDisabled={disabledFeatures.settings ?? false}
                    headerDisabled={disabledFeatures.header ?? false}
                    headerSeparatorDisabled={disabledFeatures.headerSeparator ?? false}
                    mode={chatMode}
                    theming={theming}
                />
            )}
        </ChatContainer>
    );
});

export function ApAutopilotChatReact({ chatServiceInstance }: { chatServiceInstance: AutopilotChatService }) {
    return (
        <AutopilotChatServiceProvider chatServiceInstance={chatServiceInstance}>
            <AutopilotStreamingProvider>
                <AutopilotChatScrollProvider>
                    <AutopilotChatStateProvider>
                        <AutopilotErrorProvider>
                            <AutopilotLoadingProvider>
                                <AutopilotAttachmentsProvider>
                                    <AutopilotModelPickerProvider>
                                        <AutopilotAgentModePickerProvider>
                                            <AutopilotChatWidthProvider>
                                                <AutopilotChatDropzone>
                                                    <AutopilotChatContent />
                                                </AutopilotChatDropzone>
                                            </AutopilotChatWidthProvider>
                                        </AutopilotAgentModePickerProvider>
                                    </AutopilotModelPickerProvider>
                                </AutopilotAttachmentsProvider>
                            </AutopilotLoadingProvider>
                        </AutopilotErrorProvider>
                    </AutopilotChatStateProvider>
                </AutopilotChatScrollProvider>
            </AutopilotStreamingProvider>
        </AutopilotChatServiceProvider>
    );
}
