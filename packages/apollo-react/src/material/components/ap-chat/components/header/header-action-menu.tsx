import React from 'react';

import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { ApTypography } from '../../../ap-typography';
import { useScheduledCallback } from '../../hooks/use-scheduled-callback';
import { useChatState } from '../../providers/chat-state-provider';
import { AutopilotChatCustomHeaderAction } from '../../service';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { AutopilotChatTooltip } from '../common/tooltip';

const StyledMenuItem = styled(MenuItem)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingS}`,
  gap: token.Spacing.SpacingMicro,
  cursor: 'pointer',
  fontSize: FontVariantToken.fontSizeS,
  color: 'var(--color-foreground)',
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
  portalContainer?: HTMLElement;
}

const NestedMenuItem = React.memo(
  React.forwardRef<HTMLLIElement, NestedMenuItemProps>(
    ({ action, onActionClick, isFirst = false, portalContainer }, ref) => {
      const [open, setOpen] = React.useState(false);
      const menuItemRef = React.useRef<HTMLLIElement | null>(null);
      const submenuRef = React.useRef<HTMLDivElement | null>(null);
      const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
      const nestedPopoverActionRef = React.useRef<{ updatePosition: () => void } | null>(null);

      const updateNestedPosition = React.useCallback(() => {
        if (nestedPopoverActionRef.current) {
          nestedPopoverActionRef.current.updatePosition();
        }
      }, []);

      const scheduleNestedPositionUpdate = useScheduledCallback(updateNestedPosition);

      const handleNestedTransitionEnter = React.useCallback(() => {
        scheduleNestedPositionUpdate();
      }, [scheduleNestedPositionUpdate]);

      const handleNestedTransitionEntered = React.useCallback(() => {
        scheduleNestedPositionUpdate();
      }, [scheduleNestedPositionUpdate]);

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
      }, [action.disabled, action.children]);

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

      const handleClick = React.useCallback(
        (event: React.MouseEvent) => {
          event.stopPropagation();

          if (!action.disabled && !action.children) {
            onActionClick(action);
          }
        },
        [onActionClick, action]
      );

      const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
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
                const firstChild = submenuRef.current?.querySelector(
                  '[role="menuitem"]'
                ) as HTMLElement;
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
        },
        [action, open, onActionClick]
      );

      const handleClose = React.useCallback(() => {
        setOpen(false);
        // Return focus to parent item
        menuItemRef.current?.focus();
      }, []);

      const handleChildClick = React.useCallback(
        (childAction: AutopilotChatCustomHeaderAction) => {
          onActionClick(childAction);
          setOpen(false);
        },
        [onActionClick]
      );

      const handleSubmenuKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();

            const menuItems = submenuRef.current?.querySelectorAll<HTMLElement>(
              '[role="menuitem"]:not([disabled])'
            );
            if (!menuItems || menuItems.length === 0) {
              return;
            }

            const currentIndex = Array.from(menuItems).findIndex(
              (item) => item === document.activeElement
            );
            let nextIndex: number;

            if (event.key === 'ArrowDown') {
              nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % menuItems.length;
            } else {
              nextIndex =
                currentIndex === -1
                  ? menuItems.length - 1
                  : (currentIndex - 1 + menuItems.length) % menuItems.length;
            }

            menuItems[nextIndex]?.focus();
          } else if (event.key === 'ArrowRight') {
            // Prevent arrow right from doing anything in submenu (no third level)
            event.preventDefault();
            event.stopPropagation();
          }
        },
        [handleClose]
      );

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
                  <ApTypography
                    color={'var(--color-foreground-inverse)'}
                    variant={FontVariantToken.fontSizeS}
                  >
                    {action.description}
                  </ApTypography>
                ) : null
              }
            >
              <NestedMenuContainer>
                <MenuItemContent>
                  {action.icon && (
                    <ApIcon variant="outlined" name={action.icon} size={token.Icon.IconXs} />
                  )}
                  <ApTypography variant={FontVariantToken.fontSizeS}>{action.name}</ApTypography>
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
              container={portalContainer}
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
              action={nestedPopoverActionRef}
              MenuListProps={{
                sx: { padding: 0 },
                disableListWrap: true,
              }}
              slotProps={{
                paper: {
                  sx: {
                    marginRight: token.Spacing.SpacingXs,
                  },
                },
              }}
              TransitionProps={{
                onEnter: handleNestedTransitionEnter,
                onEntered: handleNestedTransitionEntered,
              }}
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
                          <ApTypography
                            color={'var(--color-foreground-inverse)'}
                            variant={FontVariantToken.fontSizeS}
                          >
                            {child.description}
                          </ApTypography>
                        ) : null
                      }
                    >
                      <MenuItemContent>
                        {child.icon && (
                          <ApIcon variant="outlined" name={child.icon} size={token.Icon.IconXs} />
                        )}
                        <ApTypography variant={FontVariantToken.fontSizeS}>
                          {child.name}
                        </ApTypography>
                      </MenuItemContent>
                    </AutopilotChatTooltip>
                  </StyledMenuItem>
                ))}
              </div>
            </Menu>
          )}
        </>
      );
    }
  )
);

interface AutopilotChatHeaderActionMenuProps {
  actions: AutopilotChatCustomHeaderAction[];
  onActionClick: (action: AutopilotChatCustomHeaderAction) => void;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export const AutopilotChatHeaderActionMenu = React.memo(
  ({ actions, onActionClick, anchorEl, open, onClose }: AutopilotChatHeaderActionMenuProps) => {
    const { portalContainer } = useChatState();
    const firstItemRef = React.useRef<HTMLLIElement | null>(null);
    const popoverActionRef = React.useRef<{ updatePosition: () => void } | null>(null);

    const updatePosition = React.useCallback(() => {
      if (popoverActionRef.current) {
        popoverActionRef.current.updatePosition();
      }
    }, []);

    // Schedule position updates with automatic RAF cancellation
    const schedulePositionUpdate = useScheduledCallback(updatePosition);

    const handleTransitionEnter = React.useCallback(() => {
      schedulePositionUpdate();
    }, [schedulePositionUpdate]);

    const handleTransitionEntered = React.useCallback(() => {
      // Focus the first item after menu transition is complete
      if (firstItemRef.current) {
        firstItemRef.current.focus();
      }
      // Force another position update after transition completes
      schedulePositionUpdate();
    }, [schedulePositionUpdate]);

    return (
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        container={portalContainer}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        variant="menu"
        MenuListProps={{ autoFocusItem: false }}
        action={popoverActionRef}
        TransitionProps={{
          onEnter: handleTransitionEnter,
          onEntered: handleTransitionEntered,
        }}
      >
        {actions.map((action, index) => (
          <NestedMenuItem
            key={action.id}
            action={action}
            onActionClick={onActionClick}
            ref={index === 0 ? firstItemRef : undefined}
            isFirst={index === 0}
            portalContainer={portalContainer}
          />
        ))}
      </Menu>
    );
  }
);
