import { useRef, useState, useCallback, useMemo, memo, useEffect } from 'react';
import type { NodeContextMenuProps, NodeMenuAction } from './NodeContextMenu.types';
import { MenuButton } from './NodeContextMenu.styles';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { ApIconButton, ApMenu } from '@uipath/portal-shell-react';

export const NodeContextMenu = memo(({ menuItems, isVisible = false }: NodeContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLApIconButtonElement>(null);

  const handleMenuOpen = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Don't auto-close the menu when hover is lost if the menu is already open
  // This allows users to click the menu button without it immediately closing

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    const handleClickAway = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking the menu button or the menu itself
      if (anchorRef.current?.contains(target)) {
        return;
      }

      // Check if clicking outside the menu
      const menuElement = document.querySelector('[role="menu"]');
      if (menuElement && !menuElement.contains(target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleClickAway);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [isOpen]);

  const handleMenuItemClick = useCallback(
    (item: NodeMenuAction) => {
      if (item.disabled === true) {
        return;
      }
      item.onClick();
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const transformedMenuItems = useMemo(
    () =>
      menuItems?.map((item, index) => {
        if ('type' in item && item.type === 'divider') {
          return {
            divider: true,
            key: `divider-${index}`,
            variant: 'separator' as const,
          };
        }
        const actionItem = item as NodeMenuAction;
        return {
          key: actionItem.id,
          title: actionItem.label,
          startIcon: actionItem.icon,
          disabled: actionItem.disabled,
          onClick: () => handleMenuItemClick(actionItem),
          variant: 'item' as const,
        };
      }) || [],
    [menuItems, handleMenuItemClick]
  );

  if (!menuItems || menuItems.length === 0) {
    return null;
  }

  if (!isVisible && !isOpen) {
    return null;
  }

  return (
    <>
      <MenuButton
        $isVisible={isVisible || isOpen}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <ApIconButton
          ref={anchorRef}
          size="small"
          color="secondary"
          onClick={handleMenuOpen}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <ApIcon name="more_vert" size="16px" />
        </ApIconButton>
      </MenuButton>
      {isOpen && anchorRef.current && (
        <ApMenu
          isOpen={isOpen}
          anchorEl={anchorRef.current}
          menuItems={transformedMenuItems}
          onClose={handleMenuClose}
          autoFocus
        />
      )}
    </>
  );
});
