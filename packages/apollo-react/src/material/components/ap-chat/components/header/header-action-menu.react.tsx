import React from 'react';

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {
  styled,
  useTheme,
} from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { AutopilotChatCustomHeaderAction } from '../../service';
import { AutopilotChatTooltip } from '../common/tooltip.react';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
    gap: token.Spacing.SpacingMicro,
    cursor: 'pointer',
    fontSize: FontVariantToken.fontSizeS,
    color: theme.palette.semantic.colorForeground,
}));

const NestedMenuContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
    width: '100%',
    justifyContent: 'space-between',
});

const MenuItemContent = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingMicro,
});

interface NestedMenuItemProps {
    action: AutopilotChatCustomHeaderAction;
    onActionClick: (action: AutopilotChatCustomHeaderAction) => void;
    isFirst?: boolean;
}

const NestedMenuItem = React.memo(React.forwardRef<HTMLLIElement, NestedMenuItemProps>(({
    action, onActionClick, isFirst = false,
}, ref) => {
    const theme = useTheme();
    const [ open, setOpen ] = React.useState(false);
    const menuItemRef = React.useRef<HTMLLIElement | null>(null);
    const submenuRef = React.useRef<HTMLDivElement | null>(null);
    const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Merge external ref with internal ref
    React.useImperativeHandle(ref, () => menuItemRef.current as HTMLLIElement);

    // Clear timeout on unmount
    React.useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = React.useCallback(() => {
        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        if (!action.disabled && action.children && action.children.length > 0) {
            setOpen(true);
        }
    }, [ action.disabled, action.children ]);

    const handleMouseLeave = React.useCallback(() => {
        // Delay closing to allow moving mouse to submenu
        closeTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    }, []);

    const handleSubmenuMouseEnter = React.useCallback(() => {
        // Cancel close when mouse enters submenu
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    const handleSubmenuMouseLeave = React.useCallback(() => {
        // Close submenu when mouse leaves it
        setOpen(false);
    }, []);

    const handleClick = React.useCallback((event: React.MouseEvent) => {
        event.stopPropagation();

        if (!action.disabled && !action.children) {
            onActionClick(action);
        }
    }, [ onActionClick, action ]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
        if (action.disabled) {
            return;
        }

        if (action.children && action.children.length > 0) {
            // Parent item with children
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                setOpen(true);
                // Focus first child after opening
                requestAnimationFrame(() => {
                    const firstChild = submenuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
                    firstChild?.focus();
                });
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                setOpen(!open);
            }
        } else {
            // Leaf item without children
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onActionClick(action);
            }
        }
    }, [ action, open, onActionClick ]);

    const handleClose = React.useCallback(() => {
        setOpen(false);
        // Return focus to parent item
        menuItemRef.current?.focus();
    }, []);

    const handleChildClick = React.useCallback((childAction: AutopilotChatCustomHeaderAction) => {
        onActionClick(childAction);
        setOpen(false);
    }, [ onActionClick ]);

    const handleSubmenuKeyDown = React.useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();

            const menuItems = submenuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') as NodeListOf<HTMLElement>;
            if (!menuItems || menuItems.length === 0) {
                return;
            }

            const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);
            let nextIndex: number;

            if (event.key === 'ArrowDown') {
                nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % menuItems.length;
            } else {
                nextIndex = currentIndex === -1 ? menuItems.length - 1 : (currentIndex - 1 + menuItems.length) % menuItems.length;
            }

            menuItems[nextIndex]?.focus();
        } else if (event.key === 'ArrowRight') {
            // Prevent arrow right from doing anything in submenu (no third level)
            event.preventDefault();
            event.stopPropagation();
        }
    }, [ handleClose ]);

    return (
        <>
            <StyledMenuItem
                ref={menuItemRef}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                disabled={action.disabled}
                tabIndex={isFirst ? 0 : -1}
            >
                <AutopilotChatTooltip
                    placement="left"
                    disableInteractive
                    title={
                        action.description ? (
                            <ap-typography
                                color={theme.palette.semantic.colorForegroundInverse}
                                variant={FontVariantToken.fontSizeS}
                            >
                                {action.description}
                            </ap-typography>
                        ) : null
                    }
                >
                    <NestedMenuContainer>
                        <MenuItemContent>
                            {action.icon && (
                                <ap-icon
                                    variant="outlined"
                                    name={action.icon}
                                    size={token.Icon.IconXs}
                                />
                            )}
                            <ap-typography variant={FontVariantToken.fontSizeS}>
                                {action.name}
                            </ap-typography>
                        </MenuItemContent>
                        {action.children && action.children.length > 0 && (
                            <KeyboardArrowRightIcon fontSize="inherit" />
                        )}
                    </NestedMenuContainer>
                </AutopilotChatTooltip>
            </StyledMenuItem>
            {action.children && action.children.length > 0 && (
                <Menu
                    hideBackdrop
                    style={{ pointerEvents: 'none' }}
                    open={open}
                    anchorEl={menuItemRef.current}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    autoFocus={false}
                    disableAutoFocus
                    disableEnforceFocus
                    MenuListProps={{
                        sx: { padding: 0 },
                        disableListWrap: true,
                    }}
                    slotProps={{ paper: { sx: { marginRight: token.Spacing.SpacingXs } } }}
                >
                    <div
                        ref={submenuRef}
                        style={{ pointerEvents: 'auto' }}
                        onKeyDown={handleSubmenuKeyDown}
                        onMouseEnter={handleSubmenuMouseEnter}
                        onMouseLeave={handleSubmenuMouseLeave}
                    >
                        {action.children.map((child) => (
                            <StyledMenuItem
                                key={child.id}
                                onClick={() => handleChildClick(child)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleChildClick(child);
                                    }
                                }}
                                disabled={child.disabled}
                                tabIndex={0}
                            >
                                <AutopilotChatTooltip
                                    placement="left"
                                    disableInteractive
                                    title={
                                        child.description ? (
                                            <ap-typography
                                                color={theme.palette.semantic.colorForegroundInverse}
                                                variant={FontVariantToken.fontSizeS}
                                            >
                                                {child.description}
                                            </ap-typography>
                                        ) : null
                                    }
                                >
                                    <MenuItemContent>
                                        {child.icon && (
                                            <ap-icon
                                                variant="outlined"
                                                name={child.icon}
                                                size={token.Icon.IconXs}
                                            />
                                        )}
                                        <ap-typography variant={FontVariantToken.fontSizeS}>
                                            {child.name}
                                        </ap-typography>
                                    </MenuItemContent>
                                </AutopilotChatTooltip>
                            </StyledMenuItem>
                        ))}
                    </div>
                </Menu>
            )}
        </>
    );
}));

interface AutopilotChatHeaderActionMenuProps {
    actions: AutopilotChatCustomHeaderAction[];
    onActionClick: (action: AutopilotChatCustomHeaderAction) => void;
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
}

// Account for this icon being last in case close is disabled and display it to the left of the default calculation
const paperSlotProps = { paper: { style: { marginLeft: `-50px` } } };

export const AutopilotChatHeaderActionMenu = React.memo(({
    actions,
    onActionClick,
    anchorEl,
    open,
    onClose,
}: AutopilotChatHeaderActionMenuProps) => {
    const firstItemRef = React.useRef<HTMLLIElement | null>(null);

    const handleTransitionEntered = () => {
        // Focus the first item after menu transition is complete
        if (firstItemRef.current) {
            firstItemRef.current.focus();
        }
    };

    return (
        <Menu
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            variant="menu"
            slotProps={paperSlotProps}
            MenuListProps={{ autoFocusItem: false }}
            TransitionProps={{ onEntered: handleTransitionEntered }}
        >
            {actions.map((action, index) => (
                <NestedMenuItem
                    key={action.id}
                    action={action}
                    onActionClick={onActionClick}
                    ref={index === 0 ? firstItemRef : undefined}
                    isFirst={index === 0}
                />
            ))}
        </Menu>
    );
});
