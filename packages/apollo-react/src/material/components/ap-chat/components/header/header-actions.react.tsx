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
    const [ isFullScreen, setIsFullScreen ] = React.useState(StorageService.Instance.get(CHAT_MODE_KEY) === AutopilotChatMode.FullScreen);
    const chatService = AutopilotChatService.Instance;
    const [ disabledFullScreen, setDisabledFullScreen ] = React.useState(
        chatService?.getConfig?.()?.disabledFeatures?.fullScreen ?? false,
    );

    const handleClose = React.useCallback(() => {
        chatService?.close();
    }, [ chatService ]);

    const handleToggle = React.useCallback(() => {
        chatService?.setChatMode(
            isFullScreen ? AutopilotChatMode.SideBySide : AutopilotChatMode.FullScreen,
        );

        setIsFullScreen(!isFullScreen);
    }, [ isFullScreen, chatService ]);

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
            });

        return () => {
            unsubscribeModeChange();
            unsubscribeSetDisabledFeatures();
        };
    }, [ chatService ]);

    return (
        <StyledActions>
            {!disabledFullScreen && (
                <AutopilotChatActionButton
                    iconName={!isFullScreen ? 'right_panel_open' : 'right_panel_close'}
                    tooltip={!isFullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    onClick={handleToggle}
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
