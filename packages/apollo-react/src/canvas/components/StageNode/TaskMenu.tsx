import { forwardRef, memo, useCallback, useImperativeHandle, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { CanvasDropdownMenu } from '../shared/CanvasDropdownMenu';
import type { StageTaskItem } from './StageNode.types';

export interface TaskMenuHandle {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

interface TaskMenuProps {
  task: StageTaskItem;
  /** Task-keyed so parents can share one stable builder across every task item. */
  getContextMenuItems: (task: StageTaskItem) => NodeMenuItem[];
  disabled?: boolean;
}

const TaskMenuComponent = (
  { task, getContextMenuItems, disabled }: TaskMenuProps,
  ref: React.Ref<TaskMenuHandle>
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<NodeMenuItem[]>([]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      if (open) {
        setMenuItems(getContextMenuItems(task));
      }
      setIsOpen(open);
    },
    [getContextMenuItems, task, disabled]
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
      triggerTestId={`stage-task-menu-${task.id}`}
      triggerAriaLabel="Task actions"
      contentClassName="w-[300px]"
      disabled={disabled}
    />
  );
};

export const TaskMenu = memo(forwardRef(TaskMenuComponent));
