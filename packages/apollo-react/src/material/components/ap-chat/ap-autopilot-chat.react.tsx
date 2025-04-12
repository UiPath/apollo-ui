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
import { AutopilotStreamingProvider } from './providers/streaming-provider.react';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number }>(({
    shouldAnimate, mode, width, theme,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; theme: Theme }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: mode === AutopilotChatMode.FullScreen ? 'column' : 'row',
    height: 'calc(100vh - 48px)', // account for global header height
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: `width ${CHAT_CONTAINER_ANIMATION_DURATION}ms ease` }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
}));

const AutopilotChatContent = React.memo(() => {
    const {
        width, shouldAnimate,
    } = useChatWidth();
    const {
        historyOpen,
        disabledFeatures,
        chatMode,
    } = useChatState();

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={chatMode}
            width={width}
        >
            { chatMode === AutopilotChatMode.SideBySide && (
                <DragHandle/>
            )}

            {chatMode === AutopilotChatMode.FullScreen ? (
                <FullScreenLayout
                    historyOpen={historyOpen}
                    historyDisabled={disabledFeatures.history ?? false}
                    mode={chatMode}
                />
            ) : (
                <StandardLayout
                    historyOpen={historyOpen}
                    historyDisabled={disabledFeatures.history ?? false}
                    mode={chatMode}
                />
            )}
        </ChatContainer>
    );
});

export function ApAutopilotChatReact({ chatServiceInstance }: { chatServiceInstance: AutopilotChatService }) {
    return (
        <AutopilotChatServiceProvider chatServiceInstance={chatServiceInstance}>
            <AutopilotChatStateProvider>
                <AutopilotChatScrollProvider>
                    <AutopilotErrorProvider>
                        <AutopilotLoadingProvider>
                            <AutopilotStreamingProvider>
                                <AutopilotAttachmentsProvider>
                                    <AutopilotChatWidthProvider>
                                        <AutopilotChatDropzone>
                                            <AutopilotChatContent />
                                        </AutopilotChatDropzone>
                                    </AutopilotChatWidthProvider>
                                </AutopilotAttachmentsProvider>
                            </AutopilotStreamingProvider>
                        </AutopilotLoadingProvider>
                    </AutopilotErrorProvider>
                </AutopilotChatScrollProvider>
            </AutopilotChatStateProvider>
        </AutopilotChatServiceProvider>
    );
}
