/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    Theme,
} from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { DragHandle } from './components/common/drag-handle.react';
import { AutopilotChatDropzone } from './components/dropzone/dropzone.react';
import {
    FullScreenLayout,
    StandardLayout,
} from './components/layout';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider.react';
import {
    ChatWidthProvider,
    useChatWidth,
} from './providers/chat-width-provider.react';
import { AutopilotErrorProvider } from './providers/error-provider.react';
import { AutopilotLoadingProvider } from './providers/loading-provider.react';
import { AutopilotStreamingProvider } from './providers/streaming-provider.react';
import { AutopilotChatInternalService } from './services/chat-internal-service';
import { AutopilotChatService } from './services/chat-service';
import {
    CHAT_CONTAINER_ANIMATION_DURATION,
    CHAT_WIDTH_FULL_SCREEN,
} from './utils/constants';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number }>(({
    shouldAnimate, mode, width, theme,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; theme: Theme }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: mode === AutopilotChatMode.FullScreen ? 'column' : 'row',
    height: 'calc(100vh - 48px)', // account for global header hight
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: `width ${CHAT_CONTAINER_ANIMATION_DURATION}ms ease` }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
}));

function AutopilotChatContent() {
    const [ mode, setMode ] = React.useState<AutopilotChatMode>(
        AutopilotChatService.Instance?.getConfig?.()?.mode ?? AutopilotChatMode.SideBySide,
    );
    const chatService = AutopilotChatService.Instance;
    const internalService = AutopilotChatInternalService.Instance;
    const [ historyDisabled, setHistoryDisabled ] = React.useState(chatService?.getConfig?.()?.disabledFeatures?.history ?? false);
    const [ historyOpen, setHistoryOpen ] = React.useState(chatService?.historyOpen ?? false);
    const {
        width, shouldAnimate,
    } = useChatWidth();
    const isFullScreen = mode === AutopilotChatMode.FullScreen;

    React.useEffect(() => {
        if (!chatService || !internalService) {
            return;
        }

        const unsubscribeSetDisabledFeatures = chatService.on(
            AutopilotChatEvent.SetDisabledFeatures,
            (features: AutopilotChatDisabledFeatures) => {
                setHistoryDisabled(features?.history ?? false);
            },
        );

        const unsubscribeToggleHistory = internalService.on(AutopilotChatInternalEvent.ToggleHistory, (open) => {
            setHistoryOpen(open);
        });

        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, (chatMode) => {
            setMode(chatMode);
        });

        return () => {
            unsubscribeModeChange();
            unsubscribeSetDisabledFeatures();
            unsubscribeToggleHistory();
        };
    }, [ chatService, internalService ]);

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={mode}
            width={width}
        >
            { mode === AutopilotChatMode.SideBySide && (
                <DragHandle/>
            )}

            {isFullScreen ? (
                <FullScreenLayout
                    historyOpen={historyOpen}
                    historyDisabled={historyDisabled}
                    mode={mode}
                />
            ) : (
                <StandardLayout
                    historyOpen={historyOpen}
                    historyDisabled={historyDisabled}
                    mode={mode}
                />
            )}
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
