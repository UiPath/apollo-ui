import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import SearchIcon from '@mui/icons-material/Search';
import { CircularProgress, Popover, styled } from '@mui/material';
import token from '@uipath/apollo-core';
import { useChatHistory } from '@uipath/apollo-react/chat/headless/hooks/use-chat-history';
import { useScheduledCallback } from '@uipath/apollo-react/chat/headless/hooks/use-scheduled-callback';
import { useChatService } from '@uipath/apollo-react/chat/headless/providers/chat-service.provider';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { useChatWidth } from '@uipath/apollo-react/chat/headless/providers/chat-width-provider';
import {
  CHAT_HISTORY_FULL_SCREEN_WIDTH,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH,
} from '@uipath/apollo-react/chat/service';
import { ApSkeleton } from '@uipath/apollo-react/material/components/ap-skeleton';
import { ApTextField } from '@uipath/apollo-react/material/components/ap-text-field';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React, { useCallback, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';
import { AutopilotChatHistoryGroup } from './chat-history-group';

const ChatHistoryContainer = styled('div')<{
  isFullScreen: boolean;
  width: number;
  fullScreenContainer: HTMLElement | null;
}>(({ isFullScreen, width, fullScreenContainer }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-background)',
  padding: `${token.Spacing.SpacingXs} 0`,
  boxSizing: 'border-box',
  height: isFullScreen
    ? `calc(${fullScreenContainer?.clientHeight}px - ${token.Spacing.SpacingBase})`
    : CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
  width: isFullScreen
    ? Math.min(width, CHAT_HISTORY_FULL_SCREEN_WIDTH)
    : Math.min(
        width,
        CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH - 2 * parseInt(token.Spacing.SpacingBase, 10)
      ),

  '& .chat-history-search': {
    width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
    marginLeft: token.Spacing.SpacingBase,

    '& .MuiInputBase-root': { backgroundColor: 'var(--color-background)' },
  },

  '& .chat-history-content': {
    outline: 'none',
    flex: 1,
    overflowY: 'auto',
    marginRight: `calc(-${token.Spacing.SpacingBase})`,
    paddingRight: token.Spacing.SpacingBase,
  },
}));

const EmptyStateContainer = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
}));

const HistorySkeletonContainer = styled('div')(() => ({
  padding: token.Spacing.SpacingBase,
  '& .skeleton-item': {
    padding: token.Spacing.SpacingXs,
    marginBottom: token.Spacing.SpacingXs,
  },
}));

const HistorySkeletonLoader: React.FC = () => (
  <HistorySkeletonContainer>
    {[...Array(6)].map((_, index) => (
      <div key={index} className="skeleton-item">
        <ApSkeleton
          style={{
            width: '90%',
            height: token.Spacing.SpacingL,
          }}
        />
      </div>
    ))}
  </HistorySkeletonContainer>
);

interface AutopilotChatHistoryProps {
  open: boolean;
  isFullScreen: boolean;
}

const AutopilotChatHistoryComponent: React.FC<AutopilotChatHistoryProps> = ({
  open,
  isFullScreen,
}) => {
  const { _ } = useLingui();
  const chatService = useChatService();

  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const popperContainerRef = useRef<HTMLDivElement>(null);

  const { historyOpen, historyAnchorElement, fullScreenContainer, spacing, portalContainer } =
    useChatState();

  const popoverActionRef = useRef<{ updatePosition: () => void } | null>(null);

  const updatePosition = useCallback(() => {
    if (popoverActionRef.current) {
      popoverActionRef.current.updatePosition();
    }
  }, []);

  const schedulePositionUpdate = useScheduledCallback(updatePosition);

  const handleTransitionEnter = useCallback(() => {
    schedulePositionUpdate();
  }, [schedulePositionUpdate]);

  const handleTransitionEntered = useCallback(() => {
    schedulePositionUpdate();
  }, [schedulePositionUpdate]);
  const { width } = useChatWidth();

  const {
    groups: groupedHistory,
    searchQuery,
    setSearchQuery: handleSearchTextChange,
    hasHistoryData,
    noSearchResults: hasNoSearchResults,
    showSearchSkeleton: showSkeletonLoader,
    showLoadingMore: showLoadMoreSpinner,
  } = useChatHistory({ open: historyOpen, scrollContainer });

  const renderEmptyState = (message: string) => (
    <EmptyStateContainer>
      <ApTypography color={'var(--color-foreground)'} variant={spacing.primaryFontToken}>
        {message}
      </ApTypography>
    </EmptyStateContainer>
  );

  const renderHistoryGroups = () => (
    <>
      {groupedHistory.map((group) => (
        <AutopilotChatHistoryGroup key={group.key} group={group} isHistoryOpen={historyOpen} />
      ))}
      {showLoadMoreSpinner && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: spacing.compactMode ? token.Spacing.SpacingXs : token.Spacing.SpacingBase,
          }}
        >
          <CircularProgress size={20} />
        </div>
      )}
    </>
  );

  const renderHistoryContent = () => {
    if (showSkeletonLoader) {
      return <HistorySkeletonLoader />;
    }

    if (hasNoSearchResults) {
      return renderEmptyState(
        _(msg({ id: 'autopilot-chat.history.no-results', message: `No results found` }))
      );
    }

    return renderHistoryGroups();
  };

  return (
    <Popover
      open={open && historyOpen}
      anchorEl={historyAnchorElement}
      onClose={() => {
        chatService?.toggleHistory();
      }}
      container={portalContainer}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          ref: popperContainerRef,
          elevation: 6,
          sx: {
            borderRadius: token.Spacing.SpacingMicro,
            margin: `0 ${token.Spacing.SpacingXs + token.Spacing.SpacingBase} 0 ${token.Spacing.SpacingXs}`,
          },
        },
      }}
      action={popoverActionRef}
      TransitionProps={{
        onEnter: handleTransitionEnter,
        onEntered: handleTransitionEntered,
      }}
    >
      <FocusLock disabled={!open || !historyOpen} returnFocus={false}>
        <ChatHistoryContainer
          isFullScreen={isFullScreen}
          width={Math.min(
            width - 2 * parseInt(token.Spacing.SpacingBase, 10),
            popperContainerRef.current?.clientWidth ??
              (portalContainer
                ? width - 2 * parseInt(token.Spacing.SpacingBase, 10)
                : Number.POSITIVE_INFINITY)
          )}
          fullScreenContainer={fullScreenContainer}
        >
          {hasHistoryData ? (
            <>
              <ApTextField
                disabled={!historyOpen}
                className="chat-history-search"
                size="small"
                startAdornment={<SearchIcon />}
                placeholder={_(
                  msg({ id: 'autopilot-chat.history.search-placeholder', message: `Search chats` })
                )}
                value={searchQuery}
                onChange={handleSearchTextChange}
              />
              <div className="chat-history-content" ref={setScrollContainer}>
                {renderHistoryContent()}
              </div>
            </>
          ) : (
            renderEmptyState(
              _(msg({ id: 'autopilot-chat.history.empty', message: `No chat history` }))
            )
          )}
        </ChatHistoryContainer>
      </FocusLock>
    </Popover>
  );
};

export const AutopilotChatHistory = React.memo(AutopilotChatHistoryComponent);
