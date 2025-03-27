/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { AutopilotChatInternalService } from '../../services/chat-internal-service';
import { AutopilotChatService } from '../../services/chat-service';
import { StorageService } from '../../services/storage';
import { CHAT_MODE_KEY } from '../../utils/constants';
import { AutopilotChatActionButton } from '../common/action-button.react';

const StyledActions = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingS,
}));

function AutopilotChatHeaderActionsComponent() {
    const chatService = AutopilotChatService.Instance;
    const internalService = AutopilotChatInternalService.Instance;
    const [ isFullScreen, setIsFullScreen ] = React.useState(StorageService.Instance.get(CHAT_MODE_KEY) === AutopilotChatMode.FullScreen);
    const [ disabledFullScreen, setDisabledFullScreen ] = React.useState(
        chatService?.getConfig?.()?.disabledFeatures?.fullScreen ?? false,
    );
    const [ disabledHistory, setDisabledHistory ] = React.useState(
        chatService?.getConfig?.()?.disabledFeatures?.history ?? false,
    );
    const { clearAttachments } = useAttachments();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, (mode) => {
            setIsFullScreen(mode === AutopilotChatMode.FullScreen);
        });

        const unsubscribeSetDisabledFeatures = chatService.on(AutopilotChatEvent.SetDisabledFeatures,
            (features: AutopilotChatDisabledFeatures) => {
                setDisabledFullScreen(features?.fullScreen ?? false);
                setDisabledHistory(features?.history ?? false);
            });

        return () => {
            unsubscribeModeChange();
            unsubscribeSetDisabledFeatures();
        };
    }, [ chatService, internalService ]);

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

            {!disabledHistory && (
                <AutopilotChatActionButton
                    iconName="history"
                    variant="custom"
                    tooltip={t('autopilot-chat-history')}
                    onClick={toggleHistory}
                />
            )}

            {!disabledFullScreen && (
                <AutopilotChatActionButton
                    iconName={!isFullScreen ? 'right_panel_open' : 'right_panel_close'}
                    tooltip={!isFullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    onClick={handleToggleChat}
                    variant="custom"
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
