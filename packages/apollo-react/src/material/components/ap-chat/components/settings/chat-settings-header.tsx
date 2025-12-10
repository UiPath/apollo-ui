import React from 'react';

import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
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
    const { _ } = useLingui();
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
                    color={'var(--color-foreground)'}
                    id="settings-title"
                    role="heading"
                    aria-level={2}
                >
                    {_(msg({ id: 'autopilot-chat.settings.title', message: `Settings` }))}
                </ap-typography>
            )}

            <VisuallyHidden id="settings-heading-description">
                {_(msg({ id: 'autopilot-chat.settings.heading-description', message: `Settings panel` }))}
            </VisuallyHidden>

            <ActionsContainer>
                <AutopilotChatActionButton
                    disabled={!isSettingsOpen}
                    iconName={isFullScreen ? 'right_panel_close' : 'chevron_left'}
                    onClick={handleCloseSettings}
                    tooltip={isSettingsOpen ? _(msg({ id: 'autopilot-chat.settings.hide', message: `Hide settings` })) : ''}
                    ariaLabel={isSettingsOpen ? _(msg({ id: 'autopilot-chat.settings.hide', message: `Hide settings` })) : ''}
                    ariaDescribedby={isSettingsOpen ? 'settings-title settings-heading-description' : ''}
                    title={isSettingsOpen ? _(msg({ id: 'autopilot-chat.settings.hide', message: `Hide settings` })) : ''}
                    {...(isFullScreen && { variant: 'custom' })}
                    data-testid="autopilot-chat-settings-close"
                />

                {!isFullScreen && (
                    <ap-typography
                        variant={FontVariantToken.fontBrandL}
                        color={'var(--color-foreground)'}
                        id="settings-title"
                        role="heading"
                        aria-level={2}
                    >
                        {_(msg({ id: 'autopilot-chat.settings.title', message: `Settings` }))}
                    </ap-typography>
                )}
            </ActionsContainer>
        </HeaderContainer>
    );
};

export const AutopilotChatSettingsHeader = React.memo(AutopilotChatSettingsHeaderComponent);
