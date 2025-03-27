/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatHistory,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useLoading } from '../../providers/loading-provider.react';
import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatActionButton } from '../common/action-button.react';

const GroupItem = styled('div')<{ isActive: boolean; showRemoveIcon: boolean }>(({
    theme, isActive, showRemoveIcon,
}) => ({
    padding: `0 ${token.Padding.PadL}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: token.Border.BorderRadiusS,
    outlineColor: theme.palette.semantic.colorFocusIndicator,
    outlineWidth: '1px',
    outlineOffset: '-1px',

    '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
    '&:active': { backgroundColor: theme.palette.semantic.colorBackgroundSelected },
    ...(isActive && { backgroundColor: theme.palette.semantic.colorBackground }),

    '& .delete-button-wrapper': { opacity: showRemoveIcon ? 1 : 0 },
}));

const GroupTitle = styled('div')(() => ({
    flex: 1,
    minWidth: 0,
    '& ap-typography': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

interface AutopilotChatHistoryItemProps {
    item: AutopilotChatHistory;
}

const AutopilotChatHistoryItemComponent: React.FC<AutopilotChatHistoryItemProps> = ({ item }) => {
    const theme = useTheme();
    const chatService = AutopilotChatService.Instance;
    const [ isActive, setIsActive ] = React.useState(chatService.activeConversationId === item.id);
    const [ isFullScreen, setIsFullScreen ] = React.useState(chatService?.getConfig()?.mode === AutopilotChatMode.FullScreen);
    const { setWaitingResponse } = useLoading();

    const [ isRemoveIconVisible, setIsRemoveIconVisible ] = React.useState(false);
    const [ isFocused, setIsFocused ] = React.useState(false);
    const itemRef = React.useRef<HTMLDivElement>(null);
    const lastMousePosition = React.useRef({
        x: 0,
        y: 0,
    });
    const focusButtonRef = React.useRef<HTMLButtonElement>(null);

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
                const isInside = (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                );

                setIsRemoveIconVisible(isInside);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [ isFocused ]);

    React.useEffect(() => {
        const unsubscribeOpenConversation = chatService.on(AutopilotChatEvent.OpenConversation, (id) => {
            if (!isActive && id === item.id) {
                setWaitingResponse(false);
            }

            setIsActive(id === item.id);
        });

        const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, (mode) => {
            setIsFullScreen(mode === AutopilotChatMode.FullScreen);
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setIsActive(false);
        });

        return () => {
            unsubscribeOpenConversation();
            unsubscribeModeChange();
            unsubscribeNewChat();
        };
    }, [ chatService, item.id, isActive, setWaitingResponse ]);

    const handleDelete = React.useCallback((ev: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
        ev.stopPropagation();
        setIsFocused(false);
        chatService.deleteConversation(itemId);
    }, [ chatService ]);

    const handleItemClick = React.useCallback((itemId: string) => {
        if (isActive) {
            return;
        }

        chatService.openConversation(itemId);

        if (!isFullScreen) {
            chatService.toggleHistory(false);
        }
    }, [ chatService, isFullScreen, isActive ]);

    React.useEffect(() => {
        if (isFocused) {
            focusButtonRef.current?.focus();
        }
    }, [ isFocused ]);

    return (
        <GroupItem
            showRemoveIcon={isFocused || isRemoveIconVisible}
            ref={itemRef}
            tabIndex={0}
            key={item.id}
            isActive={isActive}
            onClick={() => handleItemClick(item.id)}
            onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    handleItemClick(item.id);
                }
            }}
        >
            <GroupTitle>
                <ap-typography color={theme.palette.semantic.colorForeground}>{item.name}</ap-typography>
            </GroupTitle>

            <div className="delete-button-wrapper">
                <AutopilotChatActionButton
                    ref={focusButtonRef}
                    onClick={(ev) => handleDelete(ev, item.id)}
                    onMouseDown={(ev) => {
                        ev.preventDefault();
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                    }}
                    iconName="delete"
                    iconSize="16px"
                    tooltip={isRemoveIconVisible || isFocused ? t('autopilot-chat-delete-history') : ''}
                />
            </div>
        </GroupItem>
    );
};

export const AutopilotChatHistoryItem = React.memo(AutopilotChatHistoryItemComponent);
