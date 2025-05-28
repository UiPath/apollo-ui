/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import SearchIcon from '@mui/icons-material/Search';
import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatHistory as AutopilotChatHistoryType,
    CHAT_DRAWER_WIDTH_FULL_SCREEN,
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
import { AutopilotChatHistoryGroup } from './chat-history-group.react';
import { AutopilotChatHistoryHeader } from './chat-history-header.react';

const ChatHistoryContainer = styled('div')<{ isOpen: boolean; isFullScreen: boolean }>(({
    theme, isOpen, isFullScreen,
}) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingL,
    backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
    height: '100%',
    zIndex: 1,
    transition: 'width 0.3s ease, padding 0.3s ease',
    padding: token.Spacing.SpacingBase,
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'nowrap',

    ...(isOpen ? { width: '100%' } : {
        width: 0,
        paddingLeft: 0,
        paddingRight: 0,
    }),

    ...(isFullScreen ? {
        width: isOpen ? `calc(${CHAT_DRAWER_WIDTH_FULL_SCREEN}px + 2 * ${token.Spacing.SpacingBase})` : 0, // account for padding
        borderTopLeftRadius: token.Spacing.SpacingXs,
    } : {
        position: 'absolute',
        right: 0,
    }),

    '& .chat-history-search': {
        width: '100%',

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
    const { historyOpen } = useChatState();

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
        <FocusLock
            disabled={!open || !historyOpen || isFullScreen}
            returnFocus={true}
        >
            <ChatHistoryContainer isOpen={open} isFullScreen={isFullScreen}>
                <AutopilotChatHistoryHeader isFullScreen={isFullScreen} isHistoryOpen={historyOpen}/>

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
                    <ap-typography color={theme.palette.semantic.colorForeground}>
                        {t('chat-history-empty')}
                    </ap-typography>
                )}
            </ChatHistoryContainer>
        </FocusLock>
    );
};

export const AutopilotChatHistory = React.memo(AutopilotChatHistoryComponent);
