import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import React from 'react';
import { useAttachments } from '../../providers/attachements-provider';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { usePicker } from '../../providers/picker-provider';
import { AutopilotChatMode, AutopilotChatPreHookAction } from '../../service';
import { AutopilotChatActionButton } from '../common/action-button';
import { AutopilotChatHeaderActionMenu } from './header-action-menu';

const StyledActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingMicro,
}));

function AutopilotChatHeaderActionsComponent() {
  const { _ } = useLingui();
  const chatService = useChatService();
  const {
    disabledFeatures,
    chatMode,
    historyOpen,
    settingsOpen,
    setHistoryAnchorElement,
    readOnly,
  } = useChatState();
  const { clearAttachments } = useAttachments();
  const { customHeaderActions, handleCustomHeaderAction } = usePicker();
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleOpenActionMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setActionMenuAnchorEl(event.currentTarget);
    },
    [setActionMenuAnchorEl]
  );

  const handleCloseActionMenu = React.useCallback(() => {
    setActionMenuAnchorEl(null);
  }, [setActionMenuAnchorEl]);

  const handleActionMenuItemClick = React.useCallback(
    (action: any) => {
      handleCustomHeaderAction(action);
      setActionMenuAnchorEl(null);
    },
    [handleCustomHeaderAction, setActionMenuAnchorEl]
  );

  const handleClose = React.useCallback(() => {
    if (!chatService) {
      return;
    }

    chatService
      .getPreHook(AutopilotChatPreHookAction.CloseChat)()
      .then((proceed) => {
        if (!proceed) {
          return;
        }
        chatService?.close();
      });
  }, [chatService]);

  const handleToggleChat = React.useCallback(() => {
    if (!chatService) {
      return;
    }

    chatService
      .getPreHook(AutopilotChatPreHookAction.ToggleChat)({ chatMode })
      .then((proceed) => {
        if (!proceed) {
          return;
        }
        chatService?.setChatMode(
          chatMode === AutopilotChatMode.FullScreen
            ? AutopilotChatMode.SideBySide
            : AutopilotChatMode.FullScreen
        );
      });
  }, [chatService, chatMode]);

  const handleNewChat = React.useCallback(() => {
    if (!chatService) {
      return;
    }

    chatService
      .getPreHook(AutopilotChatPreHookAction.NewChat)()
      .then((proceed) => {
        if (!proceed) {
          return;
        }
        chatService.newChat();
        chatService.stopResponse();
        chatService.setPrompt('');
        clearAttachments();
      });
  }, [clearAttachments, chatService]);

  const toggleHistory = React.useCallback(() => {
    if (!chatService) {
      return;
    }

    chatService
      .getPreHook(AutopilotChatPreHookAction.ToggleHistory)({ historyOpen })
      .then((proceed) => {
        if (!proceed) {
          return;
        }
        chatService?.toggleHistory();
      });
  }, [chatService, historyOpen]);

  const toggleSettings = React.useCallback(() => {
    if (!chatService) {
      return;
    }

    chatService
      .getPreHook(AutopilotChatPreHookAction.ToggleSettings)({ settingsOpen })
      .then((proceed) => {
        if (!proceed) {
          return;
        }
        chatService?.toggleSettings();
      });
  }, [chatService, settingsOpen]);

  return (
    <StyledActions>
      {!readOnly && !disabledFeatures.newChat && (
        <AutopilotChatActionButton
          iconName="new_chat"
          variant="custom"
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.new-chat', message: `New chat` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.new-chat', message: `New chat` }))}
          onClick={handleNewChat}
          data-testid="autopilot-chat-new-chat"
        />
      )}

      {!readOnly && !disabledFeatures.settings && (
        <AutopilotChatActionButton
          iconName="settings"
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.settings', message: `Settings` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.settings', message: `Settings` }))}
          onClick={toggleSettings}
          data-testid="autopilot-chat-settings"
        />
      )}

      {!readOnly && !disabledFeatures.history && (
        <AutopilotChatActionButton
          ref={setHistoryAnchorElement}
          iconName="history"
          variant="custom"
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.history', message: `History` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.history', message: `History` }))}
          onClick={toggleHistory}
          data-testid="autopilot-chat-history"
        />
      )}

      {!disabledFeatures.fullScreen && chatMode !== AutopilotChatMode.Embedded && (
        <AutopilotChatActionButton
          iconName={chatMode !== AutopilotChatMode.FullScreen ? 'open_in_full' : 'close_fullscreen'}
          tooltip={
            chatMode !== AutopilotChatMode.FullScreen
              ? _(msg({ id: 'autopilot-chat.header.actions.expand', message: `Expand` }))
              : _(msg({ id: 'autopilot-chat.header.actions.collapse', message: `Collapse` }))
          }
          ariaLabel={
            chatMode !== AutopilotChatMode.FullScreen
              ? _(msg({ id: 'autopilot-chat.header.actions.expand', message: `Expand` }))
              : _(msg({ id: 'autopilot-chat.header.actions.collapse', message: `Collapse` }))
          }
          onClick={handleToggleChat}
          data-testid="autopilot-chat-toggle-fullscreen"
        />
      )}

      {!readOnly && customHeaderActions.length > 0 && (
        <>
          <AutopilotChatActionButton
            iconName="more_vert"
            variant="outlined"
            tooltip={_(
              msg({ id: 'autopilot-chat.header.actions.custom-actions', message: `More actions` })
            )}
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
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.close', message: `Close` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.close', message: `Close` }))}
          data-testid="autopilot-chat-close"
        />
      )}
    </StyledActions>
  );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
