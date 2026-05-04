import type { ReactNode } from 'react';
import { GroupModificationType } from '../../utils/GroupModificationUtils';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';

// TODO: Add translation for the menu items

export const getContextMenuItems = ({
  isParallelGroup,
  groupIndex,
  tasksLength,
  groupIndexInAllTasks,
  taskIndexInAllTasks,
  isAboveParallel,
  isBelowParallel,
  reGroupTaskFunction,
  hideParallelOptions = false,
}: {
  isParallelGroup: boolean;
  groupIndex: number;
  tasksLength: number;
  groupIndexInAllTasks: number;
  taskIndexInAllTasks: number;
  isAboveParallel: boolean;
  isBelowParallel: boolean;
  reGroupTaskFunction: (
    groupModificationType: GroupModificationType,
    groupIndex: number,
    taskIndex: number
  ) => void;
  hideParallelOptions?: boolean;
}): NodeMenuItem[] => {
  const CONTEXT_MENU_ITEMS = {
    MOVE_UP: getMenuItem('move-up', 'Move up', () =>
      reGroupTaskFunction(
        GroupModificationType.TASK_GROUP_UP,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    MOVE_DOWN: getMenuItem('move-down', 'Move down', () =>
      reGroupTaskFunction(
        GroupModificationType.TASK_GROUP_DOWN,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    UNGROUP_ALL: getMenuItem('ungroup', 'Ungroup parallel tasks', () =>
      reGroupTaskFunction(
        GroupModificationType.UNGROUP_ALL_TASKS,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    SPLIT_TASK: getMenuItem('split', 'Remove from parallel group', () =>
      reGroupTaskFunction(
        GroupModificationType.SPLIT_GROUP,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    REMOVE_GROUP: getMenuItem('remove-group', 'Remove group from stage', () =>
      reGroupTaskFunction(
        GroupModificationType.REMOVE_GROUP,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    REMOVE_TASK: getMenuItem('remove-task', 'Delete task', () =>
      reGroupTaskFunction(
        GroupModificationType.REMOVE_TASK,
        groupIndexInAllTasks,
        taskIndexInAllTasks
      )
    ),
    CREATE_PARALLEL_GROUP_ABOVE: getMenuItem(
      'group-with-up',
      'Create parallel group with task above',
      () =>
        reGroupTaskFunction(
          GroupModificationType.MERGE_GROUP_UP,
          groupIndexInAllTasks,
          taskIndexInAllTasks
        )
    ),
    CREATE_PARALLEL_GROUP_BELOW: getMenuItem(
      'group-with-down',
      'Create parallel group with task below',
      () =>
        reGroupTaskFunction(
          GroupModificationType.MERGE_GROUP_DOWN,
          groupIndexInAllTasks,
          taskIndexInAllTasks
        )
    ),
    ADD_TO_PARALLEL_GROUP_ABOVE: getMenuItem(
      'add-to-group-with-up',
      'Add task to parallel group above',
      () =>
        reGroupTaskFunction(
          GroupModificationType.MERGE_GROUP_UP,
          groupIndexInAllTasks,
          taskIndexInAllTasks
        )
    ),
    ADD_TO_PARALLEL_GROUP_BELOW: getMenuItem(
      'add-to-group-with-down',
      'Add task to parallel group below',
      () =>
        reGroupTaskFunction(
          GroupModificationType.MERGE_GROUP_DOWN,
          groupIndexInAllTasks,
          taskIndexInAllTasks
        )
    ),
    DIVIDER: getDivider(),
  };

  const items: NodeMenuItem[] = [];

  if (groupIndex > 0) items.push(CONTEXT_MENU_ITEMS.MOVE_UP);
  if (groupIndex < tasksLength - 1) items.push(CONTEXT_MENU_ITEMS.MOVE_DOWN);

  if (items.length) items.push(CONTEXT_MENU_ITEMS.DIVIDER);

  if (isParallelGroup && !hideParallelOptions) {
    items.push(
      CONTEXT_MENU_ITEMS.UNGROUP_ALL,
      CONTEXT_MENU_ITEMS.SPLIT_TASK,
      CONTEXT_MENU_ITEMS.DIVIDER,
      CONTEXT_MENU_ITEMS.REMOVE_GROUP,
      CONTEXT_MENU_ITEMS.REMOVE_TASK
    );
  } else if (!isParallelGroup && !hideParallelOptions) {
    if (groupIndex > 0) {
      items.push(
        isAboveParallel
          ? CONTEXT_MENU_ITEMS.ADD_TO_PARALLEL_GROUP_ABOVE
          : CONTEXT_MENU_ITEMS.CREATE_PARALLEL_GROUP_ABOVE
      );
    }

    if (groupIndex < tasksLength - 1) {
      items.push(
        isBelowParallel
          ? CONTEXT_MENU_ITEMS.ADD_TO_PARALLEL_GROUP_BELOW
          : CONTEXT_MENU_ITEMS.CREATE_PARALLEL_GROUP_BELOW
      );
    }

    if (items.length) items.push(CONTEXT_MENU_ITEMS.DIVIDER);

    items.push(CONTEXT_MENU_ITEMS.REMOVE_TASK);
  } else {
    items.push(CONTEXT_MENU_ITEMS.REMOVE_TASK);
  }

  return items;
};

export function getMenuItem(
  id: string = 'id',
  label: string = 'label',
  onClick: () => void,
  isDisabled = false
): NodeMenuItem {
  return { id, label, onClick, disabled: isDisabled };
}

export const getDivider = (): NodeMenuItem => {
  return {
    type: 'divider' as const,
  };
};

export interface TransformedMenuItem {
  key: string;
  title?: string;
  startIcon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant: 'item' | 'separator';
  divider?: boolean;
}

/**
 * Transforms NodeMenuItem array into the format expected by ApMenu
 * This ensures consistent menu item structure across all menu instances
 */
export const transformMenuItems = (
  menuItems: NodeMenuItem[] | undefined,
  onItemClick: (item: NodeMenuAction) => void
): TransformedMenuItem[] => {
  if (!menuItems) {
    return [];
  }

  return menuItems.map((item, index) => {
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
      onClick: () => onItemClick(actionItem),
      variant: 'item' as const,
    };
  });
};
