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
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useChatService } from '../../providers/chat-service.provider.react';
import { useLoading } from '../../providers/loading-provider.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

const GroupItem = styled('div')<{ isActive: boolean; showRemoveIcon: boolean }>(({
    theme, isActive, showRemoveIcon,
}) => ({
    width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
    padding: `0 calc(${token.Padding.PadL} + ${token.Spacing.SpacingBase})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    borderRadius: token.Border.BorderRadiusS,
    outlineColor: theme.palette.semantic.colorFocusIndicator,
    outlineWidth: '1px',
    outlineOffset: '-1px',

    '&:hover, &:active': { backgroundColor: theme.palette.semantic.colorBackgroundHover },
    ...(isActive && { backgroundColor: theme.palette.semantic.colorBackgroundSelected }),

    '& .delete-button-wrapper': {
        opacity: showRemoveIcon ? 1 : 0,
        position: 'relative',
        left: token.Spacing.SpacingXs,
        marginRight: token.Spacing.SpacingBase,
    },
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
    isHistoryOpen: boolean;
}

const AutopilotChatHistoryItemComponent: React.FC<AutopilotChatHistoryItemProps> = ({
    item, isHistoryOpen,
}) => {
    const theme = useTheme();
    const chatService = useChatService();
    const [ isActive, setIsActive ] = React.useState(chatService.activeConversationId === item.id);
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
        if (!chatService) {
            return;
        }

        if (chatService.activeConversationId === item.id && !isActive) {
            setIsActive(true);
        }

        const unsubscribeOpenConversation = chatService.on(AutopilotChatEvent.OpenConversation, (id) => {
            if (!isActive && item.id === id) {
                setWaitingResponse(false);
            }

            setIsActive(id === item.id);
        });

        const unsubscribeDeleteConversation = chatService.on(AutopilotChatEvent.DeleteConversation, (id) => {
            if (isActive && id === item.id) {
                chatService.newChat();
            }
        });

        const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => {
            setIsActive(false);
        });

        return () => {
            unsubscribeOpenConversation();
            unsubscribeDeleteConversation();
            unsubscribeNewChat();
        };
    }, [ chatService, item.id, isActive, setWaitingResponse ]);

    const handleDelete = React.useCallback((
        ev: React.KeyboardEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>,
        itemId: string,
    ) => {
        ev.stopPropagation();
        setIsFocused(false);

        chatService.deleteConversation(itemId);
    }, [ chatService ]);

    const handleItemClick = React.useCallback((itemId: string) => {
        if (isActive) {
            return;
        }

        chatService.openConversation(itemId);
        chatService.toggleHistory(false);
    }, [ chatService, isActive ]);

    React.useEffect(() => {
        if (isFocused) {
            focusButtonRef.current?.focus();
        }
    }, [ isFocused ]);

    return (
        <GroupItem
            showRemoveIcon={isFocused || isRemoveIconVisible}
            ref={itemRef}
            tabIndex={isHistoryOpen ? 0 : -1}
            key={item.id}
            isActive={isActive}
            onClick={() => handleItemClick(item.id)}
            onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    handleItemClick(item.id);
                }
            }}
            aria-label={item.name}
            role="button"
            aria-pressed={isActive}
        >
            <GroupTitle>
                <ap-typography color={theme.palette.semantic.colorForeground}>{item.name}</ap-typography>
            </GroupTitle>

            <div className="delete-button-wrapper">
                <AutopilotChatActionButton
                    disabled={!isHistoryOpen}
                    ref={focusButtonRef}
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
                    tooltip={(isRemoveIconVisible || isFocused) && isHistoryOpen ? t('autopilot-chat-delete-history') : ''}
                />
            </div>
        </GroupItem>
    );
};

export const AutopilotChatHistoryItem = React.memo(AutopilotChatHistoryItemComponent);
