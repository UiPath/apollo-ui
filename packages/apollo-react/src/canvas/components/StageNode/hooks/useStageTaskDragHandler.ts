import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { useStoreApi } from '@xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { StageTaskItem } from '../StageNode.types';
import { flattenTasks, getProjection, reorderTasks } from '../StageNode.utils';

export const useStageTaskDragHandler = ({
  taskGroups,
  onTaskReorder,
  allowRegrouping = true,
}: {
  taskGroups: StageTaskItem[][];
  onTaskReorder: (newTasks: StageTaskItem[][]) => void;
  /** Sideways travel can nest a task in a parallel group. Off for the flat sections, which
   * have no nesting: every drop lands at depth 0. */
  allowRegrouping?: boolean;
}) => {
  const storeApi = useStoreApi();

  // In a ref, not state: nothing renders from it mid-drag.
  const offsetLeft = useRef(0);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /** The row in flight; the overlay renders it at the matching width. */
  const activeTask = useMemo(
    () => taskGroups.flat().find((task) => task.id === activeDragId),
    [taskGroups, activeDragId]
  );
  const isActiveTaskParallel = useMemo(
    () => (taskGroups.find((group) => group.some((t) => t.id === activeDragId))?.length ?? 0) > 1,
    [taskGroups, activeDragId]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => setActiveDragId(String(event.active.id)),
    []
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      offsetLeft.current = event.delta.x / storeApi.getState().transform[2];
    },
    [storeApi]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentOffsetLeft = offsetLeft.current;
      offsetLeft.current = 0;
      setActiveDragId(null);

      if (!over) {
        return;
      }

      // Pinned to 0 when regrouping is off, so sideways travel is ignored.
      let depth = 0;
      if (allowRegrouping) {
        const projection = getProjection(
          taskGroups,
          active.id as string,
          over.id as string,
          currentOffsetLeft
        );
        if (!projection) {
          return;
        }
        depth = projection.depth;
      }

      // For in-place movement, skip if depth hasn't changed
      if (active.id === over.id) {
        const flattened = flattenTasks(taskGroups);
        const draggedTask = flattened.find((t) => t.id === active.id);
        if (draggedTask && draggedTask.depth === depth) {
          return;
        }
      }

      onTaskReorder(reorderTasks(taskGroups, active.id as string, over.id as string, depth));
    },
    [taskGroups, onTaskReorder, allowRegrouping]
  );

  const handleDragCancel = useCallback(() => {
    offsetLeft.current = 0;
    setActiveDragId(null);
  }, []);

  return {
    activeTask,
    isActiveTaskParallel,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
};
