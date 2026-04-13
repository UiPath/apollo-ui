import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';

export interface TaskMenuHandle {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

interface TaskMenuProps {
  taskId: string;
  getContextMenuItems: () => NodeMenuItem[];
  disabled?: boolean;
}

const TaskMenuComponent = (
  { taskId, getContextMenuItems, disabled }: TaskMenuProps,
  ref: React.Ref<TaskMenuHandle>
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<NodeMenuItem[]>([]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      if (open) {
        setMenuItems(getContextMenuItems());
      }
      setIsOpen(open);
    },
    [getContextMenuItems, disabled]
  );

  const handleMenuItemClick = useCallback((item: NodeMenuAction) => {
    item.onClick();
    setIsOpen(false);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (disabled) return;
      handleOpenChange(true);
    },
    [handleOpenChange, disabled]
  );

  useImperativeHandle(ref, () => ({
    handleContextMenu,
  }));

  return (
    <CanvasDropdownMenu
      open={isOpen}
      onOpenChange={handleOpenChange}
      menuItems={menuItems}
      onItemClick={handleMenuItemClick}
      triggerTestId={`stage-task-menu-${taskId}`}
      triggerAriaLabel="Task actions"
      contentClassName="w-[300px]"
      disabled={disabled}
    />
  );
};

export const TaskMenu = memo(forwardRef(TaskMenuComponent));
