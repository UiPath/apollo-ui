/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatPreHookAction } from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useChatService } from '../../providers/chat-service.provider.react';
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

const AutopilotChatSettingsHeaderComponent: React.FC<{ isFullScreen: boolean; isSettingsOpen: boolean }> = ({
    isFullScreen, isSettingsOpen,
}) => {
    const theme = useTheme();
    const chatService = useChatService();

    const handleCloseSettings = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.ToggleHistory)({ settingsOpen: isSettingsOpen })
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService?.toggleSettings();
            });
    }, [ chatService, isSettingsOpen ]);

    return (
        <HeaderContainer>
            {isFullScreen && (
                <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                    {t('autopilot-chat-settings-title')}
                </ap-typography>
            )}

            <ActionsContainer>
                <AutopilotChatActionButton
                    disabled={!isSettingsOpen}
                    iconName={isFullScreen ? 'right_panel_close' : 'chevron_left'}
                    onClick={handleCloseSettings}
                    tooltip={isSettingsOpen ? t('autopilot-chat-hide-settings') : ''}
                    {...(isFullScreen && { variant: 'custom' })}
                />

                {!isFullScreen && (
                    <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-settings-title')}
                    </ap-typography>
                )}
            </ActionsContainer>
        </HeaderContainer>
    );
};

export const AutopilotChatSettingsHeader = React.memo(AutopilotChatSettingsHeaderComponent);
