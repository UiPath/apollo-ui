import { ApMenu } from '@uipath/apollo-react/material';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';

interface TaskContextMenuProps {
  menuItems: NodeMenuItem[];
  isVisible: boolean;
  refTask: React.RefObject<HTMLElement | null>;
}

export const TaskContextMenu = memo(({ isVisible, menuItems, refTask }: TaskContextMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(isVisible);

  useEffect(() => {
    setIsMenuOpen(isVisible);
  }, [isVisible]);

  const handleContextMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleMenuItemClick = useCallback(
    (item: NodeMenuAction) => {
      if (item.disabled) {
        return;
      }
      item.onClick();
      handleContextMenuClose();
    },
    [handleContextMenuClose]
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

  if (!isMenuOpen || menuItems.length === 0) {
    return null;
  }

  return (
    <ApMenu
      data-testid="context-menu"
      isOpen={isMenuOpen}
      menuItems={transformedMenuItems}
      anchorEl={refTask.current}
      width={300}
    />
  );
});
