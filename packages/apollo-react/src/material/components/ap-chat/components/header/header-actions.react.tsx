/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatMode,
    CHAT_MODE_KEY,
    StorageService,
} from '@uipath/portal-shell-util';
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
    const { disabledFeatures } = useChatState();
    const [ isFullScreen, setIsFullScreen ] = React.useState(StorageService.Instance.get(CHAT_MODE_KEY) === AutopilotChatMode.FullScreen);
    const { clearAttachments } = useAttachments();

    const handleClose = React.useCallback(() => {
        chatService?.close();
    }, [ chatService ]);

    const handleToggleChat = React.useCallback(() => {
        chatService?.setChatMode(
            isFullScreen ? AutopilotChatMode.SideBySide : AutopilotChatMode.FullScreen,
        );

        setIsFullScreen(!isFullScreen);
    }, [ isFullScreen, chatService ]);

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

            {!disabledFeatures.fullScreen && (
                <AutopilotChatActionButton
                    iconName={!isFullScreen ? 'open_in_full' : 'close_fullscreen'}
                    tooltip={!isFullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    onClick={handleToggleChat}
                />
            )}

            <AutopilotChatActionButton
                iconName="close"
                onClick={handleClose}
                tooltip={t('autopilot-chat-close')}
            />
        </StyledActions>
    );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
