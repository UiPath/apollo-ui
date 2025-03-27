/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatActionButton } from '../common/action-button.react';

const HeaderContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.Spacing.SpacingXs,
}));

const ActionsContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
}));

const AutopilotChatHistoryHeaderComponent: React.FC = () => {
    const theme = useTheme();
    const chatService = AutopilotChatService.Instance;

    const handleCloseHistory = React.useCallback(() => {
        chatService?.toggleHistory(false);
    }, [ chatService ]);

    return (
        <HeaderContainer>
            <ActionsContainer>
                <AutopilotChatActionButton
                    iconName="chevron_left"
                    onClick={handleCloseHistory}
                    tooltip={t('autopilot-chat-hide-history')}
                />

                <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                    {t('autopilot-chat-header')}
                </ap-typography>
            </ActionsContainer>
        </HeaderContainer>
    );
};

export const AutopilotChatHistoryHeader = React.memo(AutopilotChatHistoryHeaderComponent);
