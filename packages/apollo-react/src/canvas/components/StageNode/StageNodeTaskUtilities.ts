import { GroupModificationType } from "./StageNode.types";
import type { NodeMenuItem } from "../NodeContextMenu";

// TODO: Add translation for the menu items

export const getContextMenuItems = (
  isParallelGroup: boolean,
  groupIndex: number,
  tasksLength: number,
  taskIndex: number,
  taskGroupLength: number,
  isAboveParallel: boolean,
  isBelowParallel: boolean,
  reGroupTaskFunction: (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => void
): NodeMenuItem[] => {
  const CONTEXT_MENU_ITEMS = {
    MOVE_UP: getMenuItem("move-up", "Move Up", () => reGroupTaskFunction(GroupModificationType.TASK_GROUP_UP, groupIndex, taskIndex)),
    MOVE_DOWN: getMenuItem("move-down", "Move Down", () =>
      reGroupTaskFunction(GroupModificationType.TASK_GROUP_DOWN, groupIndex, taskIndex)
    ),
    UNGROUP_ALL: getMenuItem("ungroup", "Ungroup parallel tasks", () =>
      reGroupTaskFunction(GroupModificationType.UNGROUP_ALL_TASKS, groupIndex, taskIndex)
    ),
    SPLIT_TASK: getMenuItem("split", "Remove from parallel group", () =>
      reGroupTaskFunction(GroupModificationType.SPLIT_GROUP, groupIndex, taskIndex)
    ),
    REMOVE_GROUP: getMenuItem("remove-group", "Remove group from stage", () =>
      reGroupTaskFunction(GroupModificationType.REMOVE_GROUP, groupIndex, taskIndex)
    ),
    REMOVE_TASK: getMenuItem("remove-task", "Remove task from stage", () =>
      reGroupTaskFunction(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex)
    ),
    CREATE_PARALLEL_GROUP_ABOVE: getMenuItem("group-with-up", "Create parallel group with task above", () =>
      reGroupTaskFunction(GroupModificationType.MERGE_GROUP_UP, groupIndex, taskIndex)
    ),
    CREATE_PARALLEL_GROUP_BELOW: getMenuItem("group-with-down", "Create parallel group with task below", () =>
      reGroupTaskFunction(GroupModificationType.MERGE_GROUP_DOWN, groupIndex, taskIndex)
    ),
    ADD_TO_PARALLEL_GROUP_ABOVE: getMenuItem("add-to-group-with-up", "Add task to parallel group above", () =>
      reGroupTaskFunction(GroupModificationType.MERGE_GROUP_UP, groupIndex, taskIndex)
    ),
    ADD_TO_PARALLEL_GROUP_BELOW: getMenuItem("add-to-group-with-down", "Add task to parallel group below", () =>
      reGroupTaskFunction(GroupModificationType.MERGE_GROUP_DOWN, groupIndex, taskIndex)
    ),
    DIVIDER: getDivider(),
  };

  const items: NodeMenuItem[] = [];

  if (groupIndex > 0) items.push(CONTEXT_MENU_ITEMS.MOVE_UP);
  if (groupIndex < tasksLength - 1) items.push(CONTEXT_MENU_ITEMS.MOVE_DOWN);

  if (items.length) items.push(CONTEXT_MENU_ITEMS.DIVIDER);

  if (isParallelGroup) {
    items.push(CONTEXT_MENU_ITEMS.UNGROUP_ALL, CONTEXT_MENU_ITEMS.SPLIT_TASK, CONTEXT_MENU_ITEMS.DIVIDER, CONTEXT_MENU_ITEMS.REMOVE_GROUP);
  } else {
    if (groupIndex > 0) {
      items.push(isAboveParallel ? CONTEXT_MENU_ITEMS.ADD_TO_PARALLEL_GROUP_ABOVE : CONTEXT_MENU_ITEMS.CREATE_PARALLEL_GROUP_ABOVE);
    }

    if (groupIndex < tasksLength - 1) {
      items.push(isBelowParallel ? CONTEXT_MENU_ITEMS.ADD_TO_PARALLEL_GROUP_BELOW : CONTEXT_MENU_ITEMS.CREATE_PARALLEL_GROUP_BELOW);
    }

    if (items.length) items.push(CONTEXT_MENU_ITEMS.DIVIDER);

    items.push(CONTEXT_MENU_ITEMS.REMOVE_TASK);
  }

  return items;
};

export function getMenuItem(id: string = "id", label: string = "label", onClick: () => void, isDisabled = false): NodeMenuItem {
  return { id, label, onClick, disabled: isDisabled };
}

const getDivider = (): NodeMenuItem => {
  return {
    type: "divider" as const,
  };
};
