import type { DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { useStoreApi } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { StageTaskItem } from '../StageNode.types';
import { flattenTasks, getProjection, reorderTasks } from '../StageNode.utils';

export const useStageTaskDragHandler = ({
  sequentialTaskGroups,
  onTaskReorder,
}: {
  sequentialTaskGroups: StageTaskItem[][];
  onTaskReorder: (newTasks: StageTaskItem[][]) => void;
}) => {
  const storeApi = useStoreApi();

  // Horizontal travel is the only live drag state still needed: the projection it feeds is
  // resolved once on drop, so nothing re-renders mid-drag to preview the landing depth.
  const [offsetLeft, setOffsetLeft] = useState(0);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      setOffsetLeft(event.delta.x / storeApi.getState().transform[2]);
    },
    [storeApi]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentOffsetLeft = offsetLeft;
      setOffsetLeft(0);

      if (!over) {
        return;
      }

      const projection = getProjection(
        sequentialTaskGroups,
        active.id as string,
        over.id as string,
        currentOffsetLeft
      );
      if (!projection) {
        return;
      }

      // For in-place movement, skip if depth hasn't changed
      if (active.id === over.id) {
        const flattened = flattenTasks(sequentialTaskGroups);
        const activeTask = flattened.find((t) => t.id === active.id);
        if (activeTask && activeTask.depth === projection.depth) {
          return;
        }
      }

      const newTasks = reorderTasks(
        sequentialTaskGroups,
        active.id as string,
        over.id as string,
        projection.depth
      );
      onTaskReorder(newTasks);
    },
    [sequentialTaskGroups, onTaskReorder, offsetLeft]
  );

  const handleDragCancel = useCallback(() => setOffsetLeft(0), []);

  return { handleDragMove, handleDragEnd, handleDragCancel };
};
