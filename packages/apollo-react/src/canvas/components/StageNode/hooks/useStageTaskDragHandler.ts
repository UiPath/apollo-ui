import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useStoreApi } from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import type { StageTaskGroup, StageTaskItem } from '../StageNode.types';
import { flattenTasks, getProjection, reorderTasks } from '../StageNode.utils';

export const useStageTaskDragHandler = ({
  sequentialTaskGroups,
  sequentialTasks,
  onTaskReorder,
}: {
  sequentialTaskGroups: StageTaskItem[][];
  sequentialTasks: StageTaskGroup[];
  onTaskReorder: (newTasks: StageTaskItem[][]) => void;
}) => {
  const storeApi = useStoreApi();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [overId, setOverId] = useState<string | null>(null);
  const activeSequentialTask = useMemo(
    () => sequentialTasks.find(({ task }) => task.id === activeDragId),
    [sequentialTasks, activeDragId]
  );
  const isActiveTaskParallel = useMemo(() => {
    if (!activeDragId) {
      return false;
    }
    const group = sequentialTaskGroups.find((g) => g.some((t) => t.id === activeDragId));
    return group ? group.length > 1 : false;
  }, [sequentialTaskGroups, activeDragId]);

  const projected = useMemo(() => {
    if (!activeDragId || !overId) return null;
    return getProjection(sequentialTaskGroups, activeDragId, overId, offsetLeft);
  }, [sequentialTaskGroups, activeDragId, overId, offsetLeft]);

  const resetState = useCallback(() => {
    setActiveDragId(null);
    setOffsetLeft(0);
    setOverId(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      setOffsetLeft(event.delta.x / storeApi.getState().transform[2]);
    },
    [storeApi]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId((event.over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentOffsetLeft = offsetLeft;
      resetState();

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
    [sequentialTaskGroups, onTaskReorder, offsetLeft, resetState]
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  return {
    activeDragId,
    activeSequentialTask,
    isActiveTaskParallel,
    projected,
    handleDragMove,
    handleDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
};
