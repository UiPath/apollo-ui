import { memo, useCallback, useState } from 'react';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';
import { MenuButton } from './NodeContextMenu.styles';
import type { NodeContextMenuProps, NodeMenuAction } from './NodeContextMenu.types';

export const NodeContextMenu = memo(({ menuItems, isVisible = false }: NodeContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuItemClick = useCallback((item: NodeMenuAction) => {
    if (item.disabled === true) {
      return;
    }
    item.onClick();
    setIsOpen(false);
  }, []);

  if (!menuItems || menuItems.length === 0) {
    return null;
  }

  if (!isVisible && !isOpen) {
    return null;
  }

  return (
    <MenuButton
      $isVisible={isVisible || isOpen}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <CanvasDropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
        menuItems={menuItems}
        onItemClick={handleMenuItemClick}
        triggerAriaLabel="Node context menu"
      />
    </MenuButton>
  );
});
