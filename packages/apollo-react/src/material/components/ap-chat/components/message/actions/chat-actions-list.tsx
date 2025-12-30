import React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Menu, MenuItem, styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { useScheduledCallback } from '../../../hooks/use-scheduled-callback';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import {
  AutopilotChatActionPayload,
  AutopilotChatMessage,
  AutopilotChatMessageAction,
  AutopilotChatPreHookAction,
  AutopilotChatRole,
} from '../../../service';
import { AutopilotChatActionButton } from '../../common/action-button';

const ActionsListContainer = styled('div')<{ isRequest: boolean }>(({ isRequest }) => ({
  display: 'flex',
  gap: token.Spacing.SpacingMicro,
  position: 'absolute',
  bottom: isRequest ? `-${token.Spacing.SpacingS}` : `-${token.Spacing.SpacingXl}`,
  ...(isRequest
    ? {
        right: token.Spacing.SpacingS,
        backgroundColor: 'var(--color-background)',
        borderRadius: token.Border.BorderRadiusM,
        border: `1px solid var(--color-border-grid)`,
      }
    : { left: 0 }),
  transition: 'opacity 0.2s ease-in-out',
  zIndex: 1,
}));

interface AutopilotChatActionsListProps {
  message: AutopilotChatMessage;
  defaultActions: AutopilotChatMessageAction[];
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  onHoverChange?: (isHovering: boolean, focusOut?: boolean) => void;
  actionsContainerRef?: (node: HTMLDivElement | null) => void;
}

function AutopilotChatActionsListComponent({
  message,
  defaultActions,
  isVisible,
  setIsVisible,
  onHoverChange,
  actionsContainerRef,
}: AutopilotChatActionsListProps) {
  const { _ } = useLingui();
  const { portalContainer } = useChatState();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const overflowMenuOpen = Boolean(anchorEl);
  const overflowButtonRef = React.useRef<HTMLButtonElement>(null);
  const popoverActionRef = React.useRef<{ updatePosition: () => void } | null>(null);

  const updatePosition = React.useCallback(() => {
    if (popoverActionRef.current) {
      popoverActionRef.current.updatePosition();
    }
  }, []);

  const schedulePositionUpdate = useScheduledCallback(updatePosition);

  const handleTransitionEnter = React.useCallback(() => {
    schedulePositionUpdate();
  }, [schedulePositionUpdate]);

  const handleTransitionEntered = React.useCallback(() => {
    schedulePositionUpdate();
  }, [schedulePositionUpdate]);
  const mainActions = [
    ...(defaultActions?.filter((action) => !action.showInOverflow) || []),
    ...(message?.actions?.filter((action) => !action.showInOverflow) || []),
  ];
  const overflowActions = [
    ...(defaultActions?.filter((action) => action.showInOverflow) || []),
    ...(message?.actions?.filter((action) => action.showInOverflow) || []),
  ];
  const shouldBeVisible = isVisible || overflowMenuOpen;
  const chatService = useChatService();

  const handleAction = React.useCallback(
    async (action: AutopilotChatMessageAction) => {
      if (!action.eventName || !chatService) {
        return;
      }

      // Get message and group info
      const group = chatService.getMessagesInGroup(message.groupId ?? '');
      const currentMessage = chatService
        .getConversation()
        .find((m) => m.id === message.id) as AutopilotChatMessage;

      // Check if this action has a pre-hook
      if (action.details?.preHookAction) {
        const proceed = await chatService.getPreHook(
          action.details.preHookAction as AutopilotChatPreHookAction
        )({
          isPositive: action.details.isPositive,
          group,
          message: currentMessage,
        });
        if (!proceed) {
          return;
        }
      }

      (chatService as any)._eventBus.publish(action.eventName, {
        group,
        message: currentMessage,
        action,
      } satisfies AutopilotChatActionPayload);
    },
    [message, chatService]
  );

  const handleOpenOverflowMenu = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
      setIsVisible(true);
    },
    [setIsVisible]
  );

  const handleCloseOverflowMenu = React.useCallback(() => {
    setAnchorEl(null);
    setIsVisible(false);
  }, [setIsVisible]);

  const handleMouseEnter = React.useCallback(() => {
    setIsVisible(true);
    onHoverChange?.(true);
  }, [setIsVisible, onHoverChange]);

  const handleMouseLeave = React.useCallback(() => {
    if (!overflowMenuOpen) {
      onHoverChange?.(false);
    }
  }, [overflowMenuOpen, onHoverChange]);

  const containerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Call the parent's ref callback if provided
      if (actionsContainerRef) {
        actionsContainerRef(node);
      }
    },
    [actionsContainerRef]
  );

  return (
    <ActionsListContainer
      ref={containerRef}
      isRequest={message.role === AutopilotChatRole.User}
      style={{ opacity: shouldBeVisible ? 1 : 0 }}
      role="group"
      aria-label={_(
        msg({ id: 'autopilot-chat.message.actions.label', message: `Message actions` })
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
    >
      {mainActions.map((action) => (
        <AutopilotChatActionButton
          key={action.name}
          onClick={() => handleAction(action)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              handleAction(action);
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleMouseEnter}
          iconName={action.icon ?? ''}
          iconSize="16px"
          tooltip={action.label}
          ariaLabel={action.label}
          variant={action.disabled ? 'normal' : 'outlined'}
          disableInteractiveTooltip={false}
          disabled={action.disabled ?? false}
          data-testid={`autopilot-chat-message-action-${action.name}`}
        />
      ))}

      {overflowActions.length > 0 && (
        <>
          <AutopilotChatActionButton
            ref={overflowButtonRef}
            iconName="more_vert"
            iconSize="16px"
            tooltip={_(msg({ id: 'autopilot-chat.message.actions.more', message: `More actions` }))}
            ariaLabel={_(
              msg({ id: 'autopilot-chat.message.actions.more', message: `More actions` })
            )}
            onClick={handleOpenOverflowMenu}
            onFocus={handleMouseEnter}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disableInteractiveTooltip={false}
            data-testid="autopilot-chat-message-actions-overflow"
          />
          <Menu
            anchorEl={anchorEl}
            open={overflowMenuOpen}
            onClose={handleCloseOverflowMenu}
            container={portalContainer}
            action={popoverActionRef}
            TransitionProps={{
              onEnter: handleTransitionEnter,
              onEntered: handleTransitionEntered,
            }}
          >
            {overflowActions.map((action) => (
              <MenuItem
                key={action.name}
                onClick={() => {
                  handleAction(action);
                  handleCloseOverflowMenu();
                }}
                aria-label={action.label}
              >
                {action.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </ActionsListContainer>
  );
}

export const AutopilotChatActionsList = React.memo(AutopilotChatActionsListComponent);
