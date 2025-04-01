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

const AutopilotChatHistoryHeaderComponent: React.FC<{ isFullScreen: boolean; isHistoryOpen: boolean }> = ({
    isFullScreen, isHistoryOpen,
}) => {
    const theme = useTheme();
    const chatService = AutopilotChatService.Instance;

    const handleCloseHistory = React.useCallback(() => {
        chatService?.toggleHistory(false);
    }, [ chatService ]);

    return (
        <HeaderContainer>
            {isFullScreen && (
                <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                    {t('autopilot-chat-history')}
                </ap-typography>
            )}

            <ActionsContainer>
                <AutopilotChatActionButton
                    disabled={!isHistoryOpen}
                    iconName={isFullScreen ? 'right_panel_close' : 'chevron_left'}
                    onClick={handleCloseHistory}
                    tooltip={isHistoryOpen ? t('autopilot-chat-hide-history') : ''}
                    {...(isFullScreen && { variant: 'custom' })}
                />

                {!isFullScreen && (
                    <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-history')}
                    </ap-typography>
                )}
            </ActionsContainer>
        </HeaderContainer>
    );
};

export const AutopilotChatHistoryHeader = React.memo(AutopilotChatHistoryHeaderComponent);
