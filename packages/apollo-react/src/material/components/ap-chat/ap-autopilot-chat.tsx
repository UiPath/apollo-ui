import React from 'react';

import {
  styled,
  Theme,
} from '@mui/material/styles';
import token from '@uipath/apollo-core';

import { DragHandle } from './components/common/drag-handle';
import { AutopilotChatDropzone } from './components/dropzone/dropzone';
import {
  FullScreenLayout,
  StandardLayout,
} from './components/layout';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider';
import { AutopilotChatScrollProvider } from './providers/chat-scroll-provider';
import { AutopilotChatServiceProvider } from './providers/chat-service.provider';
import {
  AutopilotChatStateProvider,
  useChatState,
} from './providers/chat-state-provider';
import {
  AutopilotChatWidthProvider,
  useChatWidth,
} from './providers/chat-width-provider';
import { AutopilotErrorProvider } from './providers/error-provider';
import { AutopilotLoadingProvider } from './providers/loading-provider';
import { AutopilotPickerProvider } from './providers/picker-provider';
import { AutopilotStreamingProvider } from './providers/streaming-provider';
import {
  AutopilotChatMode,
  AutopilotChatService,
  CHAT_CONTAINER_ANIMATION_DURATION,
  CHAT_WIDTH_FULL_SCREEN,
} from './service';

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
                                    <AutopilotPickerProvider>
                                        <AutopilotChatWidthProvider>
                                            <AutopilotChatDropzone>
                                                <AutopilotChatContent />
                                            </AutopilotChatDropzone>
                                        </AutopilotChatWidthProvider>
                                    </AutopilotPickerProvider>
                                </AutopilotAttachmentsProvider>
                            </AutopilotLoadingProvider>
                        </AutopilotErrorProvider>
                    </AutopilotChatStateProvider>
                </AutopilotChatScrollProvider>
            </AutopilotStreamingProvider>
        </AutopilotChatServiceProvider>
    );
}
