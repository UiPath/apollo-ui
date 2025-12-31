import React, { useCallback, useEffect, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Box, Collapse, styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { ApTypography } from '../../../../ap-typography';
import { ApIcon } from '../../common/icon';
import { AutopilotChatTooltip } from '../../common/tooltip';
import { useIsStreamingMessage } from '../../../hooks/use-is-streaming-message';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import {
  AutopilotChatEvent,
  AutopilotChatMessage,
  AutopilotChatPreHookAction,
  PdfCitation,
  UrlCitation,
} from '../../../service';

interface AutopilotChatSourcesProps {
  groupId: string;
  message: AutopilotChatMessage;
}

const getSources = (group: AutopilotChatMessage[]) => {
  const allCitations = group
    .map((message) => message.contentParts?.map((part) => part.citations).flat() ?? [])
    .flat()
    .filter((citation): citation is UrlCitation | PdfCitation => citation !== undefined);

  // Deduplicate citations by ID, keeping the first occurrence
  const seenIds = new Set<number>();
  return allCitations.filter((citation) => {
    if (seenIds.has(citation.id)) {
      return false;
    }
    seenIds.add(citation.id);
    return true;
  });
};

const COLLAPSED_ITEMS_COUNT = 2;

const StyledContainer = styled(Box)(() => ({
  marginTop: token.Spacing.SpacingXs,
  animation: 'fadeInUp 0.3s ease-out',

  '@keyframes fadeInUp': {
    '0%': {
      opacity: 0,
      transform: `translateY(${token.Spacing.SpacingM})`,
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const StyledToggleButton = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  cursor: 'pointer',
  padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase} ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
  borderRadius: token.Border.BorderRadiusL,
  border: `1px solid var(--color-border-de-emp)`,
  backgroundColor: 'var(--color-background)',
  '&:hover': { backgroundColor: 'var(--color-background-secondary)' },
  '&:active, &:focus': { outlineColor: 'var(--color-focus-indicator)' },
}));

const StyledContentContainer = styled(Box)(() => ({
  borderRadius: token.Border.BorderRadiusL,
  marginTop: token.Spacing.SpacingXs,
  border: `1px solid var(--color-border-de-emp)`,
  backgroundColor: 'var(--color-background)',
  position: 'relative',
  padding: `${token.Spacing.SpacingXs} 0`,
}));

const StyledSourcesListWrapper = styled('div')<{ isCollapsed?: boolean }>(({ isCollapsed }) => ({
  position: 'relative',
  ...(isCollapsed && {
    // show COLLAPSED_ITEMS_COUNT items (with gap) + half of next item with gradient
    maxHeight: `calc((${token.Spacing.SpacingM} + ${token.Spacing.SpacingS}) * (${COLLAPSED_ITEMS_COUNT} + 0.6))`,
    overflow: 'hidden',
  }),
}));

const StyledSourcesList = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: token.Spacing.SpacingS,
}));

const StyledSourceItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: token.Spacing.SpacingXs,
  padding: `0 ${token.Spacing.SpacingBase}`,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  height: token.Spacing.SpacingM,
  '&:hover': { backgroundColor: 'var(--color-background-hover)' },
  '&:focus, &:active': { outlineColor: 'var(--color-focus-indicator)' },
}));

const StyledSourceContent = styled(Box)(() => ({
  flex: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',

  '& .MuiTypography-root': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

const StyledGradientOverlay = styled(Box)(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: token.Spacing.SpacingM,
  background: `linear-gradient(to bottom, transparent 0%, var(--color-background) 70%)`,
  pointerEvents: 'none',
}));

const StyledActionContainer = styled(Box)(() => ({
  display: 'flex',
  position: 'relative',
  marginTop: token.Spacing.SpacingXs,
}));

const StyledActionButton = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  cursor: 'pointer',
  padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`,
  borderRadius: token.Border.BorderRadiusM,
  backgroundColor: 'transparent',
  transition: 'all 0.2s',
  border: 'none',
  '&:hover': { backgroundColor: 'var(--color-background-hover)' },
  '&:focus, &:active': { outlineColor: 'var(--color-focus-indicator)' },
}));

function AutopilotChatSourcesComponent({ groupId, message }: AutopilotChatSourcesProps) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { spacing } = useChatState();

  const [sources, setSources] = useState<Array<UrlCitation | PdfCitation>>(
    getSources(chatService?.getMessagesInGroup(groupId) ?? [])
  );
  const { isStreaming } = useIsStreamingMessage(message);
  const [isWaitingForMoreMessages, setIsWaitingForMoreMessages] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribeResponse = chatService.on(
      AutopilotChatEvent.Response,
      (response: AutopilotChatMessage) => {
        if (response.groupId === groupId || response.id === message.id) {
          setSources(getSources(chatService.getMessagesInGroup(groupId)));
          setIsWaitingForMoreMessages(!!response.shouldWaitForMoreMessages);
        }
      }
    );

    const unsubscribeChunk = chatService.on(AutopilotChatEvent.SendChunk, (chunk) => {
      if (chunk.groupId === groupId || chunk.id === message.id) {
        setSources(getSources(chatService.getMessagesInGroup(groupId)));
      }
    });

    const unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
      setSources(getSources(chatService.getMessagesInGroup(groupId)));
    });

    return () => {
      unsubscribeResponse();
      unsubscribeChunk();
      unsubscribeStopResponse();
    };
  }, [chatService, message.id, groupId]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleShowMore = useCallback(() => {
    setShowFullList(true);
  }, []);

  const handleShowLess = useCallback(() => {
    setShowFullList(false);
  }, []);

  const handleSourceClick = useCallback(
    (source: UrlCitation | PdfCitation) => {
      if (!chatService) {
        return;
      }

      chatService
        ?.getPreHook(AutopilotChatPreHookAction.CitationClick)({ citation: source })
        .then((proceed) => {
          if (!proceed) {
            return;
          }

          const url =
            'url' in source
              ? source.url
              : `${source.download_url}${source.page_number ? `#page=${source.page_number}` : ''}`;
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
    },
    [chatService]
  );

  if (isWaitingForMoreMessages || isStreaming || sources.length === 0) {
    return null;
  }

  const hasMoreItems = sources.length > COLLAPSED_ITEMS_COUNT;

  return (
    <StyledContainer>
      <StyledToggleButton
        component="button"
        title={_(msg({ id: 'autopilot-chat.message.sources', message: `Sources` }))}
        onClick={handleToggleExpand}
      >
        <ApIcon
          variant="outlined"
          name="link"
          size={spacing.compactMode ? token.Icon.IconS : token.Icon.IconM}
          color={'var(--color-foreground)'}
        />
        <ApTypography variant={spacing.primaryFontToken} color={'var(--color-foreground)'}>
          {_(msg({ id: 'autopilot-chat.message.sources', message: `Sources` }))}
        </ApTypography>
      </StyledToggleButton>

      <Collapse in={isExpanded} timeout={300}>
        <StyledContentContainer>
          <StyledSourcesListWrapper isCollapsed={!showFullList && hasMoreItems}>
            <StyledSourcesList>
              {sources.map((source, index) => {
                const isUrl = 'url' in source;
                const isPdf = 'download_url' in source;
                const pageNumber = isPdf && source.page_number ? source.page_number : 0;
                const pageText =
                  isPdf && source.page_number
                    ? ` (${_(msg({ id: 'autopilot-chat.message.page-number', message: `Page ${pageNumber}` }))})`
                    : '';
                const text = `[${source.id}] ${source.title}${pageText}`;

                return (
                  <AutopilotChatTooltip key={`${source.id}-${index}`} title={text}>
                    <StyledSourceItem
                      role="button"
                      onClick={() => handleSourceClick(source)}
                      tabIndex={!showFullList && index > COLLAPSED_ITEMS_COUNT - 1 ? -1 : 0}
                    >
                      <ApIcon
                        variant={isUrl ? 'custom' : 'outlined'}
                        name={isUrl ? 'website' : 'file_open'}
                        size={token.Icon.IconXs}
                        color={'var(--color-primary)'}
                      />
                      <StyledSourceContent>
                        <ApTypography
                          variant={spacing.primaryBoldFontToken}
                          color={'var(--color-foreground-de-emp)'}
                        >
                          {text}
                        </ApTypography>
                      </StyledSourceContent>
                    </StyledSourceItem>
                  </AutopilotChatTooltip>
                );
              })}
            </StyledSourcesList>
            {!showFullList && hasMoreItems && <StyledGradientOverlay />}
          </StyledSourcesListWrapper>

          {hasMoreItems && (
            <StyledActionContainer>
              <StyledActionButton
                component="button"
                title={
                  showFullList
                    ? _(msg({ id: 'autopilot-chat.message.show-less', message: `Show less` }))
                    : _(msg({ id: 'autopilot-chat.message.show-more', message: `Show more` }))
                }
                onClick={showFullList ? handleShowLess : handleShowMore}
              >
                <ApTypography variant={spacing.primaryBoldFontToken} color={'var(--color-primary)'}>
                  {showFullList
                    ? _(msg({ id: 'autopilot-chat.message.show-less', message: `Show less` }))
                    : _(msg({ id: 'autopilot-chat.message.show-more', message: `Show more` }))}
                </ApTypography>
                <ApIcon
                  name={showFullList ? 'expand_less' : 'expand_more'}
                  variant="outlined"
                  size={token.Icon.IconXs}
                  color={'var(--color-primary)'}
                />
              </StyledActionButton>
            </StyledActionContainer>
          )}
        </StyledContentContainer>
      </Collapse>
    </StyledContainer>
  );
}

export const AutopilotChatSources = React.memo(AutopilotChatSourcesComponent);
