import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { useStoreApi } from '@xyflow/react';
import { useCallback, useMemo, useRef, useState } from 'react';
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

  // Horizontal travel decides the landing depth, but nothing renders from it mid-drag any more —
  // so it lives in a ref. In state it would re-render the whole section on every pointer move.
  const offsetLeft = useRef(0);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /** The row in flight, plus whether it belongs to a parallel group — the overlay renders it at
   * the matching width. */
  const activeTask = useMemo(
    () => sequentialTaskGroups.flat().find((task) => task.id === activeDragId),
    [sequentialTaskGroups, activeDragId]
  );
  const isActiveTaskParallel = useMemo(
    () =>
      (sequentialTaskGroups.find((group) => group.some((t) => t.id === activeDragId))?.length ??
        0) > 1,
    [sequentialTaskGroups, activeDragId]
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
    [sequentialTaskGroups, onTaskReorder]
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
