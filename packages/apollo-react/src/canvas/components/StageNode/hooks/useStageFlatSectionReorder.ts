import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';
import { moveGroupDown, moveGroupUp } from '../../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../../NodeContextMenu';
import type { StageTaskItem } from '../StageNode.types';
import { getMenuItem } from '../tasks/StageNodeTaskUtilities';
import { useStageNodeLabels } from '../useStageNodeLabels';

/**
 * Reordering for the stage's flat sections — event-triggered and manually triggered. Neither
 * section's order affects execution (entry rules and manual triggering decide that), so this is
 * arrangement for the user's own benefit, and deliberately weaker than the sequential section's
 * drag: no depth projection, no regrouping. A task stays in the group it was authored into, and
 * each section owns its own DndContext, so it cannot cross into another section either.
 */
export const useStageFlatSectionReorder = ({
  taskGroups,
  isDragDisabled,
  onReorder,
}: {
  taskGroups: StageTaskItem[][];
  isDragDisabled: boolean;
  onReorder: (newTasks: StageTaskItem[][]) => void;
}) => {
  const labels = useStageNodeLabels();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /** The row currently in flight, so the section can render it under the cursor. */
  const activeTask = useMemo(
    () => taskGroups.flat().find((task) => task.id === activeDragId),
    [taskGroups, activeDragId]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => setActiveDragId(String(event.active.id)),
    []
  );

  const handleDragCancel = useCallback(() => setActiveDragId(null), []);

  // Derived from the same array the reorder logic mutates, so the sortable order and the
  // move maths cannot drift apart.
  const taskIds = useMemo(
    () => taskGroups.flatMap((group) => group.map((t) => t.id)),
    [taskGroups]
  );

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
      setActiveDragId(null);
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
              index === from.groupIndex ? arrayMove(group, from.taskIndex, to.taskIndex) : group
            )
          : arrayMove(taskGroups, from.groupIndex, to.groupIndex)
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
      const group = taskGroups[groupIndex] ?? [];
      // Same rule as handleDragEnd: a task with a neighbour inside its own group moves within
      // that group, otherwise the whole group moves. Disabling on groupIndex alone would grey
      // out a row the user can still drag past its group-mate.
      const moveWithinGroup = (targetIndex: number) =>
        taskGroups.map((candidate, index) =>
          index === groupIndex ? arrayMove(candidate, taskIndex, targetIndex) : candidate
        );

      return [
        getMenuItem(
          'move-up',
          labels.contextMenu.moveUp,
          () =>
            onReorder(
              taskIndex > 0
                ? moveWithinGroup(taskIndex - 1)
                : moveGroupUp(taskGroups, groupIndex, taskIndex)
            ),
          groupIndex === 0 && taskIndex === 0
        ),
        getMenuItem(
          'move-down',
          labels.contextMenu.moveDown,
          () =>
            onReorder(
              taskIndex < group.length - 1
                ? moveWithinGroup(taskIndex + 1)
                : moveGroupDown(taskGroups, groupIndex, taskIndex)
            ),
          groupIndex === taskGroups.length - 1 && taskIndex === group.length - 1
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

  return {
    taskIds,
    sensors,
    activeTask,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    getMoveMenuItems,
  };
};
