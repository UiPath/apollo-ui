import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';

export interface TaskMenuHandle {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

interface TaskMenuProps {
  taskId: string;
  getContextMenuItems: () => NodeMenuItem[];
}

const TaskMenuComponent = (
  { taskId, getContextMenuItems }: TaskMenuProps,
  ref: React.Ref<TaskMenuHandle>
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<NodeMenuItem[]>([]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setMenuItems(getContextMenuItems());
      }
      setIsOpen(open);
    },
    [getContextMenuItems]
  );

  const handleMenuItemClick = useCallback((item: NodeMenuAction) => {
    item.onClick();
    setIsOpen(false);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      handleOpenChange(true);
    },
    [handleOpenChange]
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
    />
  );
};

export const TaskMenu = memo(forwardRef(TaskMenuComponent));
