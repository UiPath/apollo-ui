/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    Collapse,
    styled,
    Tooltip,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import {
    AutopilotChatEvent,
    AutopilotChatMessage,
    AutopilotChatPreHookAction,
    PdfCitation,
    UrlCitation,
} from '@uipath/portal-shell-util';
import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useIsStreamingMessage } from '../../../hooks/use-is-streaming-message';
import { useChatService } from '../../../providers/chat-service.provider.react';

interface AutopilotChatSourcesProps {
    groupId: string;
    message: AutopilotChatMessage;
}

const getSources = (group: AutopilotChatMessage[]) => {
    return group.map((message) => message.contentParts?.map((part) => part.citations).flat() ?? [])
        .flat()
        .filter((citation): citation is UrlCitation | PdfCitation => citation !== undefined);
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

const StyledToggleButton = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
    cursor: 'pointer',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase} ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
    borderRadius: token.Border.BorderRadiusL,
    border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
    backgroundColor: theme.palette.semantic.colorBackground,
    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundSecondary },
    '&:active, &:focus': { outlineColor: theme.palette.semantic.colorFocusIndicator },
}));

const StyledContentContainer = styled(Box)(({ theme }) => ({
    borderRadius: token.Border.BorderRadiusL,
    marginTop: token.Spacing.SpacingXs,
    border: `1px solid ${theme.palette.semantic.colorBorderDeEmp}`,
    backgroundColor: theme.palette.semantic.colorBackground,
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

const StyledSourceItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: token.Spacing.SpacingXs,
    padding: `0 ${token.Spacing.SpacingBase}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    height: token.Spacing.SpacingM,
    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
    '&:focus, &:active': { outlineColor: theme.palette.semantic.colorFocusIndicator },
}));

const StyledSourceContent = styled(Box)(() => ({
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',

    '& ap-typography': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
}));

const StyledGradientOverlay = styled(Box)(({ theme }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: token.Spacing.SpacingM,
    background: `linear-gradient(to bottom, transparent 0%, ${theme.palette.semantic.colorBackground} 70%)`,
    pointerEvents: 'none',
}));

const StyledActionContainer = styled(Box)(() => ({
    display: 'flex',
    position: 'relative',
    marginTop: token.Spacing.SpacingXs,
}));

const StyledActionButton = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
    cursor: 'pointer',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`,
    borderRadius: token.Border.BorderRadiusM,
    backgroundColor: 'transparent',
    transition: 'all 0.2s',
    border: 'none',
    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
    '&:focus, &:active': { outlineColor: theme.palette.semantic.colorFocusIndicator },
}));

function AutopilotChatSourcesComponent({
    groupId, message,
}: AutopilotChatSourcesProps) {
    const chatService = useChatService();
    const theme = useTheme();

    const [ sources, setSources ] = useState<Array<UrlCitation | PdfCitation>>(
        getSources(chatService?.getMessagesInGroup(groupId) ?? []),
    );
    const { isStreaming } = useIsStreamingMessage(message);
    const [ isWaitingForMoreMessages, setIsWaitingForMoreMessages ] = useState(false);
    const [ isExpanded, setIsExpanded ] = useState(false);
    const [ showFullList, setShowFullList ] = useState(false);

    useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeResponse = chatService.on(AutopilotChatEvent.Response, (response: AutopilotChatMessage) => {
            if (response.groupId === groupId || response.id === message.id) {
                setSources(getSources(chatService.getMessagesInGroup(groupId)));
                setIsWaitingForMoreMessages(!!response.shouldWaitForMoreMessages);
            }
        });

        const unsubscribeChunk = chatService.on(AutopilotChatEvent.SendChunk, (chunk) => {
            if ((chunk.groupId === groupId || chunk.id === message.id)) {
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
    }, [ chatService, message.id, groupId ]);

    const handleToggleExpand = useCallback(() => {
        setIsExpanded(!isExpanded);
    }, [ isExpanded ]);

    const handleShowMore = useCallback(() => {
        setShowFullList(true);
    }, []);

    const handleShowLess = useCallback(() => {
        setShowFullList(false);
    }, []);

    const handleSourceClick = useCallback((source: UrlCitation | PdfCitation) => {
        if (!chatService) {
            return;
        }

        chatService?.getPreHook(AutopilotChatPreHookAction.CitationClick)({ citation: source })
            .then((proceed) => {
                if (!proceed) {
                    return;
                }

                const url = 'url' in source ? source.url : `${source.download_url}${source.page_number ? `#page=${source.page_number}` : ''}`;
                if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            });
    }, [ chatService ]);

    if (isWaitingForMoreMessages || isStreaming || sources.length === 0) {
        return null;
    }

    const hasMoreItems = sources.length > COLLAPSED_ITEMS_COUNT;

    return (
        <StyledContainer>
            <StyledToggleButton component="button" title={t('autopilot-chat-sources')} onClick={handleToggleExpand}>
                <ap-icon
                    name="link"
                    variant="outlined"
                    size={token.Icon.IconM}
                    color={theme.palette.semantic.colorForeground}
                />
                <ap-typography color={theme.palette.semantic.colorForeground}>
                    {t('autopilot-chat-sources')}
                </ap-typography>
            </StyledToggleButton>

            <Collapse in={isExpanded} timeout={300}>
                <StyledContentContainer>
                    <StyledSourcesListWrapper isCollapsed={!showFullList && hasMoreItems}>
                        <StyledSourcesList>
                            {sources.map((source, index) => {
                                const isUrl = 'url' in source;
                                const isPdf = 'download_url' in source;
                                const pageText = isPdf && source.page_number
                                    ? ` (${t('autopilot-chat-page-number', { page_number: source.page_number })})`
                                    : '';
                                const text = `[${source.id}] ${source.title}${pageText}`;

                                return (
                                    <Tooltip
                                        componentsProps={{ popper: { disablePortal: true } }}
                                        key={`${source.id}-${index}`}
                                        title={text}
                                    >
                                        <StyledSourceItem
                                            role="button"
                                            onClick={() => handleSourceClick(source)}
                                            tabIndex={ !showFullList && (index > COLLAPSED_ITEMS_COUNT - 1) ? -1 : 0 }
                                        >
                                            <ap-icon
                                                variant={isUrl ? 'custom' : 'outlined'}
                                                name={isUrl ? 'website' : 'file_open'}
                                                size={token.Icon.IconXs}
                                                color={theme.palette.semantic.colorPrimary}
                                            />
                                            <StyledSourceContent>
                                                <ap-typography
                                                    variant={FontVariantToken.fontSizeMBold}
                                                    color={theme.palette.semantic.colorForegroundDeEmp}
                                                >
                                                    {text}
                                                </ap-typography>
                                            </StyledSourceContent>
                                        </StyledSourceItem>
                                    </Tooltip>
                                );
                            })}
                        </StyledSourcesList>
                        {!showFullList && hasMoreItems && (
                            <StyledGradientOverlay />
                        )}
                    </StyledSourcesListWrapper>

                    {hasMoreItems && (
                        <StyledActionContainer>
                            <StyledActionButton
                                component="button"
                                title={showFullList ? t('autopilot-chat-show-less') : t('autopilot-chat-show-more')}
                                onClick={showFullList ? handleShowLess : handleShowMore}
                            >
                                <ap-typography
                                    variant={FontVariantToken.fontSizeMBold}
                                    color={theme.palette.semantic.colorPrimary}
                                >
                                    {showFullList ? t('autopilot-chat-show-less') : t('autopilot-chat-show-more')}
                                </ap-typography>
                                <ap-icon
                                    name={showFullList ? 'expand_less' : 'expand_more'}
                                    variant="outlined"
                                    size={token.Icon.IconXs}
                                    color={theme.palette.semantic.colorPrimary}
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
