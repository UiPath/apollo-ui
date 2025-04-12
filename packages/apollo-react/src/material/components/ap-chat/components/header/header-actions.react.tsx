/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatMode } from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useChatService } from '../../providers/chat-service.provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

const StyledActions = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingS,
}));

function AutopilotChatHeaderActionsComponent() {
    const chatService = useChatService();
    const {
        disabledFeatures, chatMode,
    } = useChatState();
    const { clearAttachments } = useAttachments();

    const handleClose = React.useCallback(() => {
        chatService?.close();
    }, [ chatService ]);

    const handleToggleChat = React.useCallback(() => {
        chatService?.setChatMode(
            chatMode === AutopilotChatMode.FullScreen ? AutopilotChatMode.SideBySide : AutopilotChatMode.FullScreen,
        );
    }, [ chatService, chatMode ]);

    const handleNewChat = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.newChat();
        chatService.stopResponse();
        chatService.setPrompt('');

        clearAttachments();
    }, [ clearAttachments, chatService ]);

    const toggleHistory = React.useCallback(() => {
        chatService?.toggleHistory();
    }, [ chatService ]);

    return (
        <StyledActions>
            <AutopilotChatActionButton
                iconName="new_chat"
                variant="custom"
                tooltip={t('autopilot-chat-new-chat')}
                onClick={handleNewChat}
            />

            {!disabledFeatures.history && (
                <AutopilotChatActionButton
                    iconName="history"
                    variant="custom"
                    tooltip={t('autopilot-chat-history')}
                    onClick={toggleHistory}
                />
            )}

            {!disabledFeatures.fullScreen && chatMode !== AutopilotChatMode.Embedded && (
                <AutopilotChatActionButton
                    iconName={chatMode !== AutopilotChatMode.FullScreen ? 'open_in_full' : 'close_fullscreen'}
                    tooltip={chatMode !== AutopilotChatMode.FullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    onClick={handleToggleChat}
                />
            )}

            {chatMode !== AutopilotChatMode.Embedded && (
                <AutopilotChatActionButton
                    iconName="close"
                    onClick={handleClose}
                    tooltip={t('autopilot-chat-close')}
                />
            )}
        </StyledActions>
    );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
