import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  differenceInDays,
  differenceInMonths,
  isToday,
  isYesterday,
} from 'date-fns';
import debounce from 'debounce';
import FocusLock from 'react-focus-lock';

import SearchIcon from '@mui/icons-material/Search';
import {
  CircularProgress,
  Popover,
  styled,
  useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { ApTextFieldReact } from '../../../ap-text-field/ap-text-field.react';
import { useChatService } from '../../providers/chat-service.provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useChatWidth } from '../../providers/chat-width-provider.react';
import {
  AutopilotChatEvent,
  AutopilotChatHistory as AutopilotChatHistoryType,
  AutopilotChatHistorySearchPayload,
  AutopilotChatInternalEvent,
  CHAT_HISTORY_FULL_SCREEN_WIDTH,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
  CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH,
} from '../../service';
import { AutopilotChatHistoryGroup } from './chat-history-group.react';

const ChatHistoryContainer = styled('div')<{ isFullScreen: boolean; width: number; fullScreenContainer: HTMLElement | null }>(({
    theme, isFullScreen, width, fullScreenContainer,
}) => ({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.semantic.colorBackground,
    padding: `${token.Spacing.SpacingXs} 0`,
    boxSizing: 'border-box',
    height: isFullScreen ? `calc(${fullScreenContainer?.clientHeight}px - ${token.Spacing.SpacingBase})` : CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
    width: isFullScreen
        ? Math.min(width, CHAT_HISTORY_FULL_SCREEN_WIDTH)
        : Math.min(width, CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH - 2 * parseInt(token.Spacing.SpacingBase, 10)),

    '& .chat-history-search': {
        width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
        marginLeft: token.Spacing.SpacingBase,

        '& .MuiInputBase-root': { backgroundColor: theme.palette.semantic.colorBackground },
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
        {[ ...Array(6) ].map((_, index) => (
            <div key={index} className="skeleton-item">
                <ap-skeleton
                    style={{
                        width: '90%',
                        height: token.Spacing.SpacingL,
                    }}
                />
            </div>
        ))}
    </HistorySkeletonContainer>
);

const DEBOUNCE_DELAY_IN_MS = 400;
const LOAD_MORE_THRESHOLD_IN_PX = 50;

export interface ChatHistoryGroup {
    title: string;
    items: AutopilotChatHistoryType[];
}

interface AutopilotChatHistoryProps {
    open: boolean;
    isFullScreen: boolean;
}

const AutopilotChatHistoryComponent: React.FC<AutopilotChatHistoryProps> = ({
    open, isFullScreen,
}) => {
    const chatService = useChatService();
    const internalService = chatService .__internalService__;

    const theme = useTheme();
    const [ history, setHistory ] = useState<AutopilotChatHistoryType[]>(chatService?.getHistory() ?? []);
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ isLoadingMore, setIsLoadingMore ] = useState(false);
    const [ isSearching, setIsSearching ] = useState(false);
    const [ scrollContainer, setScrollContainer ] = useState<HTMLDivElement | null>(null);

    const popperContainerRef = useRef<HTMLDivElement>(null);
    const isLoadingMoreRef = useRef(false);
    const shouldShowLoadingMoreRef = useRef(true);
    const appendingRef = useRef(false);
    const scrollTopBeforeAppendRef = useRef(0);
    const searchQueryRef = useRef('');

    const {
        historyOpen,
        historyAnchorElement,
        fullScreenContainer,
        spacing,
    } = useChatState();
    const { width } = useChatWidth();

    const handleScroll = useCallback(() => {
        if (!scrollContainer || !chatService) {
            return;
        }

        const {
            scrollTop, scrollHeight, clientHeight,
        } = scrollContainer;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        if (scrollBottom < LOAD_MORE_THRESHOLD_IN_PX &&
            !isLoadingMoreRef.current &&
            shouldShowLoadingMoreRef.current &&
            chatService.getConfig()?.paginatedHistory
        ) {
            (chatService as any)._eventBus.publish(
                AutopilotChatEvent.HistoryLoadMore,
                { searchText: searchQueryRef.current } satisfies AutopilotChatHistorySearchPayload,
            );
            internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, true);
        }
    }, [ scrollContainer, chatService, internalService ]);

    const debouncedSearch = useMemo(
        () => debounce((newSearchQuery: string) => {
            if (chatService?.getConfig()?.paginatedHistory) {
                (chatService as any)._eventBus.publish(
                    AutopilotChatEvent.HistorySearch,
                    { searchText: newSearchQuery } satisfies AutopilotChatHistorySearchPayload,
                );
                internalService.publish(AutopilotChatInternalEvent.SetIsLoadingMoreHistory, false);
            }
        }, DEBOUNCE_DELAY_IN_MS),
        [ chatService, internalService ],
    );

    useEffect(() => {
        if (!chatService || !internalService) {
            return;
        }

        const unsubscribeSetHistory = chatService.on(AutopilotChatEvent.SetHistory, (newHistory) => {
            setHistory(newHistory);
            setIsSearching(false);
        });

        const unsubscribeSetIsLoadingMore = internalService.on(
            AutopilotChatInternalEvent.SetIsLoadingMoreHistory,
            (value: boolean) => {
                isLoadingMoreRef.current = value;
                setIsLoadingMore(value);
            },
        );

        const unsubscribeShouldShowLoading = internalService.on(
            AutopilotChatInternalEvent.ShouldShowLoadingMoreHistory,
            (value: boolean) => {
                shouldShowLoadingMoreRef.current = value;
            },
        );

        const unsubscribeAppendOlderHistory = internalService.on(
            AutopilotChatInternalEvent.AppendOlderHistory,
            () => {
                if (scrollContainer) {
                    appendingRef.current = true;
                    scrollTopBeforeAppendRef.current = scrollContainer.scrollTop;
                }
            },
        );

        return () => {
            unsubscribeSetHistory();
            unsubscribeSetIsLoadingMore();
            unsubscribeShouldShowLoading();
            unsubscribeAppendOlderHistory();
        };
    }, [ chatService, internalService, scrollContainer ]);

    useEffect(() => {
        if (!scrollContainer || !historyOpen || !chatService) {
            return;
        }

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [ scrollContainer, handleScroll, historyOpen, chatService ]);

    useEffect(() => {
        if (appendingRef.current && scrollContainer) {
            scrollContainer.scrollTop = scrollTopBeforeAppendRef.current;
            appendingRef.current = false;
        }
    }, [ history, scrollContainer ]);

    useEffect(() => {
        searchQueryRef.current = searchQuery;
    }, [ searchQuery ]);

    const groupedHistory = useMemo(() => {
        const filteredHistory = chatService?.getConfig()?.paginatedHistory
            ? history
            : history.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()),
            );

        const grouped = filteredHistory.reduce<ChatHistoryGroup[]>((acc, item) => {
            const date = new Date(item.timestamp);
            const currentDate = new Date();
            const daysAgo = differenceInDays(currentDate, date);
            let groupTitle = '';

            if (isToday(date)) {
                groupTitle = t('chat-history-group-title-today');
            } else if (isYesterday(date)) {
                groupTitle = t('chat-history-group-title-yesterday');
            } else if (daysAgo <= 7) {
                groupTitle = t('chat-history-group-title-last-week');
            } else if (daysAgo <= 30) {
                groupTitle = t('chat-history-group-title-previous-30-days');
            } else {
                const monthsAgo = differenceInMonths(currentDate, date);
                groupTitle = t('chat-history-group-title-months-ago', { count: monthsAgo });
            }

            const existingGroup = acc.find(group => group.title === groupTitle);

            if (existingGroup) {
                existingGroup.items.push(item);
            } else {
                acc.push({
                    title: groupTitle,
                    items: [ item ],
                });
            }

            return acc;
        }, []);

        // Sort groups by date (most recent first)
        grouped.sort((a, b) => {
            const getDate = (group: ChatHistoryGroup) => {
                if (group.items.length === 0) {
                    return new Date();
                }

                return new Date(group.items[0].timestamp);
            };

            return getDate(b).getTime() - getDate(a).getTime();
        });

        // Sort items within each group by date (most recent first)
        grouped.forEach(group => {
            group.items.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            );
        });

        return grouped;
    }, [ history, searchQuery, chatService ]);

    const handleSearchTextChange = useCallback((searchText: string | undefined) => {
        const newSearchText = searchText || '';
        setSearchQuery(newSearchText);

        if (chatService?.getConfig()?.paginatedHistory) {
            setIsSearching(true);
            debouncedSearch(newSearchText);
        }
    }, [ chatService, debouncedSearch ]);

    const hasHistoryData = history.length > 0 || searchQuery || isSearching;
    const hasNoSearchResults = groupedHistory.length === 0 && searchQuery;
    const showSkeletonLoader = isSearching && chatService?.getConfig()?.paginatedHistory;
    const showLoadMoreSpinner = isLoadingMore && chatService?.getConfig()?.paginatedHistory;

    const renderEmptyState = (messageKey: string) => (
        <EmptyStateContainer>
            <ap-typography color={theme.palette.semantic.colorForeground} variant={spacing.primaryFontToken}>
                {t(messageKey)}
            </ap-typography>
        </EmptyStateContainer>
    );

    const renderHistoryGroups = () => (
        <>
            {groupedHistory.map((group) => (
                <AutopilotChatHistoryGroup key={group.title} group={group} isHistoryOpen={historyOpen}/>
            ))}
            {showLoadMoreSpinner && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: spacing.compactMode ? token.Spacing.SpacingXs : token.Spacing.SpacingBase,
                }}>
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
            return renderEmptyState('chat-history-no-results');
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
        >
            <FocusLock
                disabled={!open || !historyOpen}
                returnFocus={false}
            >
                <ChatHistoryContainer
                    isFullScreen={isFullScreen}
                    width={Math.min(
                        width - 2 * parseInt(token.Spacing.SpacingBase, 10),
                        popperContainerRef.current?.clientWidth ?? Number.POSITIVE_INFINITY,
                    )}
                    fullScreenContainer={fullScreenContainer}
                >
                    {hasHistoryData ? (
                        <>
                            <ApTextFieldReact
                                disabled={!historyOpen}
                                className="chat-history-search"
                                size="small"
                                startAdornment={<SearchIcon />}
                                placeholder={t('chat-history-search-placeholder')}
                                value={searchQuery}
                                onChange={handleSearchTextChange}
                            />
                            <div className="chat-history-content" ref={setScrollContainer}>
                                {renderHistoryContent()}
                            </div>
                        </>
                    ) : (
                        renderEmptyState('chat-history-empty')
                    )}
                </ChatHistoryContainer>
            </FocusLock>
        </Popover>
    );
};

export const AutopilotChatHistory = React.memo(AutopilotChatHistoryComponent);
