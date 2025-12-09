import React from 'react';

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { usePicker } from '../../providers/picker-provider';
import {
  AutopilotChatMode,
  AutopilotChatPreHookAction,
} from '../../service';
import { AutopilotChatActionButton } from '../common/action-button';
import { AutopilotChatHeaderActionMenu } from './header-action-menu';

const StyledActions = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
}));

function AutopilotChatHeaderActionsComponent() {
    const chatService = useChatService();
    const {
        disabledFeatures, chatMode, historyOpen, settingsOpen, setHistoryAnchorElement,
    } = useChatState();
    const { clearAttachments } = useAttachments();
    const {
        customHeaderActions, handleCustomHeaderAction,
    } = usePicker();
    const [ actionMenuAnchorEl, setActionMenuAnchorEl ] = React.useState<HTMLElement | null>(null);

    const handleOpenActionMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
        setActionMenuAnchorEl(event.currentTarget);
    }, [ setActionMenuAnchorEl ]);

    const handleCloseActionMenu = React.useCallback(() => {
        setActionMenuAnchorEl(null);
    }, [ setActionMenuAnchorEl ]);

    const handleActionMenuItemClick = React.useCallback((action: any) => {
        handleCustomHeaderAction(action);
        setActionMenuAnchorEl(null);
    }, [ handleCustomHeaderAction, setActionMenuAnchorEl ]);

    const handleClose = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.CloseChat)()
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService?.close();
            });
    }, [ chatService ]);

    const handleToggleChat = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.ToggleChat)({ chatMode })
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService?.setChatMode(
                    chatMode === AutopilotChatMode.FullScreen ? AutopilotChatMode.SideBySide : AutopilotChatMode.FullScreen,
                );
            });
    }, [ chatService, chatMode ]);

    const handleNewChat = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.NewChat)()
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService.newChat();
                chatService.stopResponse();
                chatService.setPrompt('');
                clearAttachments();
            });
    }, [ clearAttachments, chatService ]);

    const toggleHistory = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.ToggleHistory)({ historyOpen })
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService?.toggleHistory();
            });
    }, [ chatService, historyOpen ]);

    const toggleSettings = React.useCallback(() => {
        if (!chatService) {
            return;
        }

        chatService.getPreHook(AutopilotChatPreHookAction.ToggleSettings)({ settingsOpen })
            .then((proceed) => {
                if (!proceed) {
                    return;
                }
                chatService?.toggleSettings();
            });
    }, [ chatService, settingsOpen ]);

    return (
        <StyledActions>
            {!disabledFeatures.newChat && (
                <AutopilotChatActionButton
                    iconName="new_chat"
                    variant="custom"
                    tooltip={t('autopilot-chat-new-chat')}
                    ariaLabel={t('autopilot-chat-new-chat')}
                    onClick={handleNewChat}
                    data-testid="autopilot-chat-new-chat"
                />
            )}

            {!disabledFeatures.settings && (
                <AutopilotChatActionButton
                    iconName="settings"
                    tooltip={t('autopilot-chat-settings')}
                    ariaLabel={t('autopilot-chat-settings')}
                    onClick={toggleSettings}
                    data-testid="autopilot-chat-settings"
                />
            )}

            {!disabledFeatures.history && (
                <AutopilotChatActionButton
                    ref={setHistoryAnchorElement}
                    iconName="history"
                    variant="custom"
                    tooltip={t('autopilot-chat-history')}
                    ariaLabel={t('autopilot-chat-history')}
                    onClick={toggleHistory}
                    data-testid="autopilot-chat-history"
                />
            )}

            {!disabledFeatures.fullScreen && chatMode !== AutopilotChatMode.Embedded && (
                <AutopilotChatActionButton
                    iconName={chatMode !== AutopilotChatMode.FullScreen ? 'open_in_full' : 'close_fullscreen'}
                    tooltip={chatMode !== AutopilotChatMode.FullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    ariaLabel={chatMode !== AutopilotChatMode.FullScreen ? t('autopilot-chat-expand') : t('autopilot-chat-collapse')}
                    onClick={handleToggleChat}
                    data-testid="autopilot-chat-toggle-fullscreen"
                />
            )}

            {customHeaderActions.length > 0 && (
                <>
                    <AutopilotChatActionButton
                        iconName="more_vert"
                        variant="outlined"
                        tooltip={t('autopilot-chat-custom-actions')}
                        onClick={handleOpenActionMenu}
                        data-testid="autopilot-chat-action-menu"
                    />
                    <AutopilotChatHeaderActionMenu
                        actions={customHeaderActions}
                        onActionClick={handleActionMenuItemClick}
                        anchorEl={actionMenuAnchorEl}
                        open={!!actionMenuAnchorEl}
                        onClose={handleCloseActionMenu}
                    />
                </>
            )}

            {((chatMode !== AutopilotChatMode.Embedded && !disabledFeatures.close) ||
                (chatMode === AutopilotChatMode.Embedded && disabledFeatures.close === false)) && (
                <AutopilotChatActionButton
                    iconName="remove"
                    onClick={handleClose}
                    tooltip={t('autopilot-chat-close')}
                    ariaLabel={t('autopilot-chat-close')}
                    data-testid="autopilot-chat-close"
                />
            )}
        </StyledActions>
    );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
