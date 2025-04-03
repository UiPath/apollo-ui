/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Menu,
    MenuItem,
    styled,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatMessage,
    AutopilotChatMessageAction,
    AutopilotChatRole,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
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
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
}

function AutopilotChatActionsListComponent({
    message, isVisible, setIsVisible,
}: AutopilotChatActionsListProps) {
    const [ anchorEl, setAnchorEl ] = React.useState<null | HTMLElement>(null);
    const overflowMenuOpen = Boolean(anchorEl);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const overflowButtonRef = React.useRef<HTMLButtonElement>(null);
    const mainActions = message?.actions?.filter(action => !action.showInOverflow) || [];
    const overflowActions = message?.actions?.filter(action => action.showInOverflow) || [];
    const shouldBeVisible = isVisible || overflowMenuOpen;

    const handleAction = React.useCallback((action: AutopilotChatMessageAction) => {
        action.onClick?.(message, action);
    }, [ message ]);

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
    }, [ setIsVisible ]);

    const handleMouseLeave = React.useCallback(() => {
        if (!overflowMenuOpen) {
            setIsVisible(false);
        }
    }, [ setIsVisible, overflowMenuOpen ]);

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
                    onFocus={handleMouseEnter}
                    iconName={action.icon ?? ''}
                    iconSize="16px"
                    tooltip={action.label}
                    variant={action.disabled ? 'normal' : 'outlined'}
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
                    />
                    <Menu
                        anchorEl={anchorEl}
                        open={overflowMenuOpen}
                        onClose={handleCloseOverflowMenu}
                        onClick={handleCloseOverflowMenu}
                    >
                        {overflowActions.map((action) => (
                            <MenuItem
                                key={action.name}
                                onClick={() => handleAction(action)}
                                onKeyDown={(ev) => {
                                    if (ev.key === 'Enter' || ev.key === ' ') {
                                        handleAction(action);
                                        handleCloseOverflowMenu();
                                    }
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
