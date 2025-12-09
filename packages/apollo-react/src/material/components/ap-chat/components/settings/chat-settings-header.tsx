import React from 'react';

import {
  styled,
  useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { useChatService } from '../../providers/chat-service.provider';
import { AutopilotChatPreHookAction } from '../../service';
import { AutopilotChatActionButton } from '../common/action-button';
import { VisuallyHidden } from '../common/shared-controls';

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
                <ap-typography
                    variant={FontVariantToken.fontBrandL}
                    color={theme.palette.semantic.colorForeground}
                    id="settings-title"
                    role="heading"
                    aria-level={2}
                >
                    {t('autopilot-chat-settings-title')}
                </ap-typography>
            )}

            <VisuallyHidden id="settings-heading-description">
                {t('autopilot-chat-settings-heading-description')}
            </VisuallyHidden>

            <ActionsContainer>
                <AutopilotChatActionButton
                    disabled={!isSettingsOpen}
                    iconName={isFullScreen ? 'right_panel_close' : 'chevron_left'}
                    onClick={handleCloseSettings}
                    tooltip={isSettingsOpen ? t('autopilot-chat-hide-settings') : ''}
                    ariaLabel={isSettingsOpen ? t('autopilot-chat-hide-settings') : ''}
                    ariaDescribedby={isSettingsOpen ? 'settings-title settings-heading-description' : ''}
                    title={isSettingsOpen ? t('autopilot-chat-hide-settings') : ''}
                    {...(isFullScreen && { variant: 'custom' })}
                    data-testid="autopilot-chat-settings-close"
                />

                {!isFullScreen && (
                    <ap-typography
                        variant={FontVariantToken.fontBrandL}
                        color={theme.palette.semantic.colorForeground}
                        id="settings-title"
                        role="heading"
                        aria-level={2}
                    >
                        {t('autopilot-chat-settings-title')}
                    </ap-typography>
                )}
            </ActionsContainer>
        </HeaderContainer>
    );
};

export const AutopilotChatSettingsHeader = React.memo(AutopilotChatSettingsHeaderComponent);
