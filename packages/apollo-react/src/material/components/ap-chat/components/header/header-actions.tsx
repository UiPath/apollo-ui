import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import { useChatHeaderActions } from '@uipath/apollo-react/chat/headless/hooks/use-chat-header-actions';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import type { AutopilotChatCustomHeaderAction } from '@uipath/apollo-react/chat/service';
import React from 'react';
import { AutopilotChatActionButton } from '../common/action-button';
import { AutopilotChatHeaderActionMenu } from './header-action-menu';

const StyledActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingMicro,
}));

function AutopilotChatHeaderActionsComponent() {
  const { _ } = useLingui();
  const { setHistoryAnchorElement } = useChatState();
  const {
    visibility,
    isFullScreen,
    customHeaderActions,
    newChat,
    toggleSettings,
    toggleHistory,
    toggleFullScreen,
    close,
    runCustomAction,
  } = useChatHeaderActions();
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleOpenActionMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseActionMenu = React.useCallback(() => {
    setActionMenuAnchorEl(null);
  }, []);

  const handleActionMenuItemClick = React.useCallback(
    (action: AutopilotChatCustomHeaderAction) => {
      runCustomAction(action);
      setActionMenuAnchorEl(null);
    },
    [runCustomAction]
  );

  return (
    <StyledActions>
      {visibility.newChat && (
        <AutopilotChatActionButton
          iconName="new_chat"
          variant="custom"
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.new-chat', message: `New chat` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.new-chat', message: `New chat` }))}
          onClick={newChat}
          data-testid="autopilot-chat-new-chat"
        />
      )}

      {visibility.settings && (
        <AutopilotChatActionButton
          iconName="settings"
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.settings', message: `Settings` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.settings', message: `Settings` }))}
          onClick={toggleSettings}
          data-testid="autopilot-chat-settings"
        />
      )}

      {visibility.history && (
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

      {visibility.fullScreenToggle && (
        <AutopilotChatActionButton
          iconName={!isFullScreen ? 'open_in_full' : 'close_fullscreen'}
          tooltip={
            !isFullScreen
              ? _(msg({ id: 'autopilot-chat.header.actions.expand', message: `Expand` }))
              : _(msg({ id: 'autopilot-chat.header.actions.collapse', message: `Collapse` }))
          }
          ariaLabel={
            !isFullScreen
              ? _(msg({ id: 'autopilot-chat.header.actions.expand', message: `Expand` }))
              : _(msg({ id: 'autopilot-chat.header.actions.collapse', message: `Collapse` }))
          }
          onClick={toggleFullScreen}
          data-testid="autopilot-chat-toggle-fullscreen"
        />
      )}

      {visibility.customActions && (
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

      {visibility.close && (
        <AutopilotChatActionButton
          iconName="remove"
          onClick={close}
          tooltip={_(msg({ id: 'autopilot-chat.header.actions.close', message: `Close` }))}
          ariaLabel={_(msg({ id: 'autopilot-chat.header.actions.close', message: `Close` }))}
          data-testid="autopilot-chat-close"
        />
      )}
    </StyledActions>
  );
}

export const AutopilotChatHeaderActions = React.memo(AutopilotChatHeaderActionsComponent);
