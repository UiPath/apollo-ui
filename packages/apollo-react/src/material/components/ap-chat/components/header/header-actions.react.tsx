/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import {
    AutopilotChatEvent,
    AutopilotChatMode,
} from '../../models/chat.model';
import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatActionButton } from '../common/action-button.react';

const StyledActions = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingS,
}));

function AutopilotChatHeaderActionsComponent() {
    const [ isFullScreen, setIsFullScreen ] = React.useState(false);

    const handleClose = React.useCallback(() => {
        AutopilotChatService.Instance.close();
    }, []);

    const handleToggle = React.useCallback(() => {
        AutopilotChatService.Instance.setChatMode(
            isFullScreen ? AutopilotChatMode.SideBySide : AutopilotChatMode.FullScreen,
        );

        setIsFullScreen(!isFullScreen);
    }, [ isFullScreen ]);

    React.useEffect(() => {
        AutopilotChatService.Instance.on(AutopilotChatEvent.ModeChange, (mode) => {
            setIsFullScreen(mode === AutopilotChatMode.FullScreen);
        });
    }, []);

    return (
        <StyledActions>
            <AutopilotChatActionButton
                iconName={!isFullScreen ? 'right_panel_open' : 'right_panel_close'}
                tooltip={!isFullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                onClick={handleToggle}
                variant="custom"
            />

            <AutopilotChatActionButton
                iconName="close"
                onClick={handleClose}
                tooltip={t('autopilot-chat-close')}
            />
        </StyledActions>
    );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
