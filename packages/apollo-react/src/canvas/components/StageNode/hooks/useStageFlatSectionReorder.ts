import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useMemo } from 'react';
import { moveGroupDown, moveGroupUp } from '../../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../../NodeContextMenu';
import type { StageTaskGroup, StageTaskItem } from '../StageNode.types';
import { getMenuItem } from '../tasks/StageNodeTaskUtilities';
import { useStageNodeLabels } from '../useStageNodeLabels';

const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

/**
 * Reordering for the stage's flat sections — event-triggered and manually triggered. Neither
 * section's order affects execution (entry rules and manual triggering decide that), so this is
 * arrangement for the user's own benefit, and deliberately weaker than the sequential section's
 * drag: no depth projection, no regrouping. A task stays in the group it was authored into, and
 * each section owns its own DndContext, so it cannot cross into another section either.
 */
export const useStageFlatSectionReorder = ({
  taskGroups,
  tasks,
  isDragDisabled,
  onReorder,
}: {
  taskGroups: StageTaskItem[][];
  tasks: StageTaskGroup[];
  isDragDisabled: boolean;
  onReorder: (newTasks: StageTaskItem[][]) => void;
}) => {
  const labels = useStageNodeLabels();

  const taskIds = useMemo(() => tasks.map(({ task }) => task.id), [tasks]);

  /** Position of the group holding a task, plus that task's index inside it. */
  const findPosition = useCallback(
    (taskId: string) => {
      for (const [groupIndex, group] of taskGroups.entries()) {
        const taskIndex = group.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          return { groupIndex, taskIndex };
        }
      }
      return undefined;
    },
    [taskGroups]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const from = findPosition(String(active.id));
      const to = findPosition(String(over.id));
      if (!from || !to) {
        return;
      }
      // Rows in one group are drawn without any grouping affordance, so a drop between two of
      // them has to reorder inside that group — moving the whole group would look like nothing
      // happened. Across groups the whole group moves, which is what keeps membership intact.
      onReorder(
        from.groupIndex === to.groupIndex
          ? taskGroups.map((group, index) =>
              index === from.groupIndex ? moveItem(group, from.taskIndex, to.taskIndex) : group
            )
          : moveItem(taskGroups, from.groupIndex, to.groupIndex)
      );
    },
    [taskGroups, findPosition, onReorder]
  );

  /**
   * The same pair the sequential section offers, disabled at the ends of the list rather than
   * dropped — a task that silently loses its reorder entries reads as "reordering is gone"
   * (MST-13609). Empty when the section cannot be reordered at all.
   */
  const getMoveMenuItems = useCallback(
    (task: StageTaskItem): NodeMenuItem[] => {
      const position = isDragDisabled ? undefined : findPosition(task.id);
      if (!position) {
        return [];
      }
      const { groupIndex, taskIndex } = position;
      return [
        getMenuItem(
          'move-up',
          labels.contextMenu.moveUp,
          () => onReorder(moveGroupUp(taskGroups, groupIndex, taskIndex)),
          groupIndex === 0
        ),
        getMenuItem(
          'move-down',
          labels.contextMenu.moveDown,
          () => onReorder(moveGroupDown(taskGroups, groupIndex, taskIndex)),
          groupIndex === taskGroups.length - 1
        ),
      ];
    },
    [
      isDragDisabled,
      findPosition,
      taskGroups,
      onReorder,
      labels.contextMenu.moveUp,
      labels.contextMenu.moveDown,
    ]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return { taskIds, sensors, handleDragEnd, getMoveMenuItems };
};
