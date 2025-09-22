import { GroupModificationType } from "./StageNode.types";
import type { NodeMenuItem } from "../NodeContextMenu";

export function getMenuItem(id: string = "id", label: string = "label", onClick: () => void, isDisabled = false): NodeMenuItem {
  return { id, label, onClick, disabled: isDisabled };
}

const getDivider = (): NodeMenuItem => {
  return {
    type: "divider" as const,
  };
};

// TODO: Add translation for the menu items

export const getContextMenuItems = (
  isParallelGroup: boolean,
  groupIndex: number,
  taskIndex: number,
  reGroupTaskFunction: (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => void
): NodeMenuItem[] => {
  if (isParallelGroup) {
    return [
      getMenuItem("move-up", "Move Up", () => reGroupTaskFunction(GroupModificationType.TASK_GROUP_UP, groupIndex, taskIndex)),
      getMenuItem("move-down", "Move Down", () => reGroupTaskFunction(GroupModificationType.TASK_GROUP_DOWN, groupIndex, taskIndex)),
      getDivider(),
      getMenuItem("ungroup", "Ungroup parallel tasks", () =>
        reGroupTaskFunction(GroupModificationType.UNGROUP_ALL_TASKS, groupIndex, taskIndex)
      ),
      getMenuItem("split", "Remove from parallel group", () =>
        reGroupTaskFunction(GroupModificationType.SPLIT_GROUP, groupIndex, taskIndex)
      ),
      getDivider(),
      getMenuItem("remove-group", "Remove group from stage", () =>
        reGroupTaskFunction(GroupModificationType.REMOVE_GROUP, groupIndex, taskIndex)
      ),
    ];
  } else {
    return [
      getMenuItem("move-task-up", "Move Up", () => reGroupTaskFunction(GroupModificationType.TASK_GROUP_UP, groupIndex, taskIndex)),
      getMenuItem("move-task-down", "Move Down", () => reGroupTaskFunction(GroupModificationType.TASK_GROUP_DOWN, groupIndex, taskIndex)),
      getDivider(),
      getMenuItem("group-with-up", "Create parallel group with task above", () =>
        reGroupTaskFunction(GroupModificationType.MERGE_GROUP_UP, groupIndex, taskIndex)
      ),
      getMenuItem("group-with-down", "Create parallel group with task below", () =>
        reGroupTaskFunction(GroupModificationType.MERGE_GROUP_DOWN, groupIndex, taskIndex)
      ),
      getDivider(),
      getMenuItem("remove-task", "Remove task from stage", () =>
        reGroupTaskFunction(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex)
      ),
    ];
  }
};
