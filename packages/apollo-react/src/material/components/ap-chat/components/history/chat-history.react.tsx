/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import SearchIcon from '@mui/icons-material/Search';
import {
    Popover,
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatHistory as AutopilotChatHistoryType,
    CHAT_HISTORY_FULL_SCREEN_WIDTH,
    CHAT_HISTORY_SIDE_BY_SIDE_MAX_HEIGHT,
    CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH,
} from '@uipath/portal-shell-util';
import {
    differenceInDays,
    differenceInMonths,
    isToday,
} from 'date-fns';
import React, {
    useEffect,
    useState,
} from 'react';
import FocusLock from 'react-focus-lock';

import { t } from '../../../../utils/localization/loc';
import { ApTextFieldReact } from '../../../ap-text-field/ap-text-field.react';
import { useChatService } from '../../providers/chat-service.provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useChatWidth } from '../../providers/chat-width-provider.react';
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
        ? CHAT_HISTORY_FULL_SCREEN_WIDTH
        : Math.min(
            width - 2 * parseInt(token.Spacing.SpacingBase, 10), // acount for padding
            CHAT_HISTORY_SIDE_BY_SIDE_MAX_WIDTH - 2 * parseInt(token.Spacing.SpacingBase, 10),
        ),

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
    const [ groupedHistory, setGroupedHistory ] = useState<ChatHistoryGroup[]>([]);
    const {
        historyOpen, historyAnchorElement, fullScreenContainer,
    } = useChatState();
    const { width } = useChatWidth();

    useEffect(() => {
        if (!chatService || !internalService) {
            return;
        }

        const unsubscribeSetHistory = chatService.on(AutopilotChatEvent.SetHistory, setHistory);

        return () => {
            unsubscribeSetHistory();
        };
    }, [ chatService, internalService ]);

    useEffect(() => {
        const filteredHistory = history.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        const grouped = filteredHistory.reduce<ChatHistoryGroup[]>((acc, item) => {
            const date = new Date(item.timestamp);
            const currentDate = new Date();
            const daysAgo = differenceInDays(currentDate, date);
            let groupTitle = '';

            if (isToday(date)) {
                groupTitle = t('chat-history-group-title-today');
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

        setGroupedHistory(grouped);
    }, [ history, searchQuery ]);

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
                <ChatHistoryContainer isFullScreen={isFullScreen} width={width} fullScreenContainer={fullScreenContainer}>
                    { history.length > 0 ? (
                        <>
                            <ApTextFieldReact
                                disabled={!historyOpen}
                                className="chat-history-search"
                                size="small"
                                startAdornment={<SearchIcon />}
                                placeholder={t('chat-history-search-placeholder')}
                                value={searchQuery}
                                onChange={(value) => {
                                    setSearchQuery(value || '');
                                }}
                            />
                            <div className="chat-history-content">
                                {groupedHistory.map((group) => (
                                    <AutopilotChatHistoryGroup key={group.title} group={group} isHistoryOpen={historyOpen}/>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyStateContainer>
                            <ap-typography color={theme.palette.semantic.colorForeground}>
                                {t('chat-history-empty')}
                            </ap-typography>
                        </EmptyStateContainer>
                    )}
                </ChatHistoryContainer>
            </FocusLock>
        </Popover>
    );
};

export const AutopilotChatHistory = React.memo(AutopilotChatHistoryComponent);
