import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React from 'react';

import { ApTypography } from '../../../ap-typography';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useLoading } from '../../providers/loading-provider';
import {
  AutopilotChatEvent,
  AutopilotChatPreHookAction,
  type AutopilotChatHistory,
} from '../../service';
import { AutopilotChatActionButton } from '../common/action-button';

const GroupItem = styled('div')<{ isActive: boolean; showActionButtons: boolean }>(
  ({ isActive, showActionButtons }) => ({
    width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
    padding: `0 calc(${token.Padding.PadL} + ${token.Spacing.SpacingBase})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: token.Border.BorderRadiusS,
    outlineColor: 'var(--color-focus-indicator)',
    outlineWidth: '1px',
    outlineOffset: '-1px',

    '&:hover, &:active': { backgroundColor: 'var(--color-background-hover)' },
    ...(isActive && {
      backgroundColor: 'var(--color-background-selected)',
      borderLeft: `4px solid var(--color-selection-indicator)`,
    }),

    '& .action-buttons-wrapper': {
      opacity: showActionButtons ? 1 : 0,
      position: 'relative',
      left: token.Spacing.SpacingXs,
      marginRight: token.Spacing.SpacingBase,
      display: 'flex',
      alignItems: 'center',
      gap: token.Spacing.SpacingXs,
    },
  })
);

const GroupTitle = styled('div')(() => ({
  flex: 1,
  minWidth: 0,
  '& .MuiTypography-root': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const RenameInput = styled('input')(() => ({
  width: '100%',
  padding: 0,
  margin: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-foreground)',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  outline: 'none',

  '&:focus-visible': {
    outline: `1px solid var(--color-focus-indicator)`,
    outlineOffset: '2px',
    borderRadius: token.Border.BorderRadiusS,
  },
}));

interface AutopilotChatHistoryItemProps {
  item: AutopilotChatHistory;
  isHistoryOpen: boolean;
}

const AutopilotChatHistoryItemComponent: React.FC<AutopilotChatHistoryItemProps> = ({
  item,
  isHistoryOpen,
}) => {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { spacing, disabledFeatures } = useChatState();
  const renameEnabled = !disabledFeatures.renameChat;
  const [isActive, setIsActive] = React.useState(chatService.activeConversationId === item.id);
  const { setWaitingResponse } = useLoading();

  const [isActionButtonsVisible, setIsActionButtonsVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState(item.name);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const lastMousePosition = React.useRef({
    x: 0,
    y: 0,
  });
  // Guards against double-commit when Enter triggers commit then the resulting
  // unmount/blur fires again before state settles.
  const isCommittingRef = React.useRef(false);

  // Keep the draft in sync with parent-driven updates while not editing
  React.useEffect(() => {
    if (!isEditing) {
      setDraftName(item.name);
    }
  }, [item.name, isEditing]);

  // Tooltip interferes with the onMouseEnter/onMouseLeave events, so we need to listen to mouse move events
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isFocused) {
        return;
      }

      // Store the last known mouse position
      lastMousePosition.current = {
        x: e.clientX,
        y: e.clientY,
      };

      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        setIsActionButtonsVisible(isInside);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isFocused]);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    if (chatService.activeConversationId === item.id && !isActive) {
      setIsActive(true);
    }

    const unsubscribeOpenConversation = chatService.on(
      AutopilotChatEvent.OpenConversation,
      (id) => {
        if (!isActive && item.id === id) {
          setWaitingResponse(false);
        }

        setIsActive(id === item.id);
      }
    );

    const unsubscribeDeleteConversation = chatService.on(
      AutopilotChatEvent.DeleteConversation,
      (id) => {
        if (isActive && id === item.id) {
          chatService.newChat();
        }
      }
    );

    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
      setIsActive(false);
    });

    return () => {
      unsubscribeOpenConversation();
      unsubscribeDeleteConversation();
      unsubscribeNewChat();
    };
  }, [chatService, item.id, isActive, setWaitingResponse]);

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const enterEditMode = React.useCallback(() => {
    if (!isHistoryOpen) {
      return;
    }
    isCommittingRef.current = false;
    setDraftName(item.name);
    setIsEditing(true);
  }, [isHistoryOpen, item.name]);

  const cancelRename = React.useCallback(() => {
    isCommittingRef.current = false;
    setDraftName(item.name);
    setIsEditing(false);
  }, [item.name]);

  const commitRename = React.useCallback(() => {
    if (isCommittingRef.current) {
      return;
    }
    const trimmed = draftName.trim();

    if (trimmed === '' || trimmed === item.name) {
      cancelRename();
      return;
    }

    if (!chatService) {
      setIsEditing(false);
      return;
    }

    isCommittingRef.current = true;
    chatService
      .getPreHook(AutopilotChatPreHookAction.RenameConversation)({
        conversationId: item.id,
        name: trimmed,
      })
      .then((proceed) => {
        if (!proceed) {
          cancelRename();
          return;
        }
        chatService.renameConversation(item.id, trimmed);
        setIsEditing(false);
        isCommittingRef.current = false;
      });
  }, [draftName, item.id, item.name, chatService, cancelRename]);

  const handleDelete = React.useCallback(
    (
      ev: React.KeyboardEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>,
      itemId: string
    ) => {
      ev.stopPropagation();
      setIsFocused(false);

      if (!chatService) {
        return;
      }

      chatService
        .getPreHook(AutopilotChatPreHookAction.DeleteConversation)({ conversationId: itemId })
        .then((proceed) => {
          if (!proceed) {
            return;
          }
          chatService.deleteConversation(itemId);
        });
    },
    [chatService]
  );

  const handleRename = React.useCallback(
    (ev: React.KeyboardEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
      ev.stopPropagation();
      setIsFocused(false);
      enterEditMode();
    },
    [enterEditMode]
  );

  const handleItemClick = React.useCallback(
    (itemId: string) => {
      if (isEditing || isActive) {
        return;
      }

      chatService.openConversation(itemId);
      chatService.toggleHistory(false);
    },
    [chatService, isActive, isEditing]
  );

  const renameLabel = _(msg({ id: 'autopilot-chat.history.rename', message: `Rename chat` }));
  const renameInputLabel = _(
    msg({ id: 'autopilot-chat.history.rename-input', message: `Chat name` })
  );
  const deleteLabel = _(msg({ id: 'autopilot-chat.history.delete', message: `Delete chat` }));
  const showActionButtons = !isEditing && (isFocused || isActionButtonsVisible);
  const tooltipVisible = showActionButtons && isHistoryOpen;

  return (
    <GroupItem
      showActionButtons={showActionButtons}
      ref={itemRef}
      tabIndex={isHistoryOpen && !isEditing ? 0 : -1}
      key={item.id}
      isActive={isActive}
      onClick={() => handleItemClick(item.id)}
      onKeyDown={(ev) => {
        if (isEditing) {
          return;
        }
        if (ev.key === 'Enter' || ev.key === ' ') {
          handleItemClick(item.id);
        }
      }}
      aria-label={item.name}
      role="button"
      aria-pressed={isActive}
    >
      <GroupTitle>
        {isEditing ? (
          <RenameInput
            ref={inputRef}
            value={draftName}
            aria-label={renameInputLabel}
            data-testid="autopilot-chat-history-rename-input"
            onChange={(ev) => setDraftName(ev.target.value)}
            onClick={(ev) => ev.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                ev.stopPropagation();
                commitRename();
              } else if (ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopPropagation();
                cancelRename();
              } else {
                // Prevent Space from bubbling to GroupItem's onKeyDown (which would open the conversation)
                ev.stopPropagation();
              }
            }}
          />
        ) : (
          <ApTypography variant={spacing.primaryFontToken} color={'var(--color-foreground)'}>
            {item.name}
          </ApTypography>
        )}
      </GroupTitle>

      {!isEditing && (
        <div className="action-buttons-wrapper">
          {renameEnabled && (
          <AutopilotChatActionButton
            disabled={!isHistoryOpen}
            onClick={(ev) => handleRename(ev)}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onKeyDown={(ev) => {
              // Close modal if escape is pressed (propagate to Popover parent)
              if (ev.key !== 'Escape') {
                ev.stopPropagation();
              }

              if (ev.key === 'Enter' || ev.key === ' ') {
                handleRename(ev);
              }
            }}
            iconName="edit"
            iconSize="16px"
            tooltip={tooltipVisible ? renameLabel : ''}
            data-testid="autopilot-chat-history-rename"
            ariaLabel={renameLabel}
          />
          )}
          <AutopilotChatActionButton
            disabled={!isHistoryOpen}
            onClick={(ev) => handleDelete(ev, item.id)}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onKeyDown={(ev) => {
              // Close modal if escape is pressed (propagate to Popover parent)
              if (ev.key !== 'Escape') {
                ev.stopPropagation();
              }

              if (ev.key === 'Enter' || ev.key === ' ') {
                handleDelete(ev, item.id);
              }
            }}
            iconName="delete"
            iconSize="16px"
            tooltip={tooltipVisible ? deleteLabel : ''}
            data-testid="autopilot-chat-history-delete"
            ariaLabel={deleteLabel}
          />
        </div>
      )}
    </GroupItem>
  );
};

export const AutopilotChatHistoryItem = React.memo(AutopilotChatHistoryItemComponent);
