/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Menu,
    MenuItem,
    styled,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatActionPayload,
    AutopilotChatMessage,
    AutopilotChatMessageAction,
    AutopilotChatPreHookAction,
    AutopilotChatRole,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider.react';
import { AutopilotChatActionButton } from '../../common/action-button.react';

const ActionsListContainer = styled('div')<{ isRequest: boolean }>(({
    theme, isRequest,
}) => ({
    display: 'flex',
    gap: token.Spacing.SpacingMicro,
    position: 'absolute',
    bottom: isRequest ? `-${token.Spacing.SpacingS}` : `-${token.Spacing.SpacingXl}`,
    ...(isRequest ? {
        right: token.Spacing.SpacingS,
        backgroundColor: theme.palette.semantic.colorBackground,
        borderRadius: token.Border.BorderRadiusM,
        border: `1px solid ${theme.palette.semantic.colorBorderGrid}`,
    } : { left: 0 }),
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
    message, defaultActions, isVisible, setIsVisible, onHoverChange, actionsContainerRef,
}: AutopilotChatActionsListProps) {
    const [ anchorEl, setAnchorEl ] = React.useState<null | HTMLElement>(null);
    const overflowMenuOpen = Boolean(anchorEl);
    const overflowButtonRef = React.useRef<HTMLButtonElement>(null);
    const mainActions = [
        ...defaultActions?.filter(action => !action.showInOverflow) || [],
        ...(message?.actions?.filter(action => !action.showInOverflow) || []),
    ];
    const overflowActions = [
        ...defaultActions?.filter(action => action.showInOverflow) || [],
        ...(message?.actions?.filter(action => action.showInOverflow) || []),
    ];
    const shouldBeVisible = isVisible || overflowMenuOpen;
    const chatService = useChatService();

    const handleAction = React.useCallback(async (action: AutopilotChatMessageAction) => {
        if (!action.eventName || !chatService) {
            return;
        }

        // Get message and group info
        const group = chatService.getMessagesInGroup(message.groupId ?? '');
        const currentMessage = chatService.getConversation().find(m => m.id === message.id) as AutopilotChatMessage;

        // Check if this action has a pre-hook
        if (action.details?.preHookAction) {
            const proceed = await chatService.getPreHook(action.details.preHookAction as AutopilotChatPreHookAction)({
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
    }, [ message, chatService ]);

    const handleOpenOverflowMenu = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setIsVisible(true);
    }, [ setIsVisible ]);

    const handleCloseOverflowMenu = React.useCallback(() => {
        setAnchorEl(null);
        setIsVisible(false);
    }, [ setIsVisible ]);

    const handleMouseEnter = React.useCallback(() => {
        setIsVisible(true);
        onHoverChange?.(true);
    }, [ setIsVisible, onHoverChange ]);

    const handleMouseLeave = React.useCallback(() => {
        if (!overflowMenuOpen) {
            onHoverChange?.(false);
        }
    }, [ overflowMenuOpen, onHoverChange ]);

    const containerRef = React.useCallback((node: HTMLDivElement | null) => {
        // Call the parent's ref callback if provided
        if (actionsContainerRef) {
            actionsContainerRef(node);
        }
    }, [ actionsContainerRef ]);

    return (
        <ActionsListContainer
            ref={containerRef}
            isRequest={message.role === AutopilotChatRole.User}
            style={{ opacity: shouldBeVisible ? 1 : 0 }}
            role="group"
            aria-label={t('autopilot-chat-message-actions')}
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
                    variant={action.disabled ? 'normal' : 'outlined'}
                    disableInteractiveTooltip={true}
                />
            ))}

            {overflowActions.length > 0 && (
                <>
                    <AutopilotChatActionButton
                        ref={overflowButtonRef}
                        iconName="more_vert"
                        iconSize="16px"
                        tooltip={t('autopilot-chat-more-actions')}
                        onClick={handleOpenOverflowMenu}
                        onFocus={handleMouseEnter}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        disableInteractiveTooltip={true}
                    />
                    <Menu
                        anchorEl={anchorEl}
                        open={overflowMenuOpen}
                        onClose={handleCloseOverflowMenu}
                    >
                        {overflowActions.map((action) => (
                            <MenuItem
                                key={action.name}
                                onClick={() => {
                                    handleAction(action);
                                    handleCloseOverflowMenu();
                                }}
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
