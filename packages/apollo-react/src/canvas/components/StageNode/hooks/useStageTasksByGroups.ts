import { useMemo } from 'react';
import { StageTaskItem } from '../StageNode.types';

export const useStageTasksByGroups = (allTasks: StageTaskItem[][]) => {
  const sequentialTaskGroups = useMemo(
    () =>
      allTasks.filter((group) =>
        group.some((t) => {
          if (t.taskGroupType != null) {
            return t.taskGroupType === 'sequential';
          }
          if (t.isAdhoc != null) {
            return !t.isAdhoc;
          }
          return true;
        })
      ),
    [allTasks]
  );
  const sequentialTasks = useMemo(
    () =>
      sequentialTaskGroups.flatMap((group, groupIndex) =>
        group.map((task, taskIndex) => ({ task, groupIndex, taskIndex }))
      ),
    [sequentialTaskGroups]
  );

  const adhocTaskGroups = useMemo(
    () =>
      allTasks.filter((group) =>
        group.every((t) => {
          if (t.taskGroupType != null) {
            return t.taskGroupType === 'adhoc';
          }
          if (t.isAdhoc != null) {
            return t.isAdhoc;
          }
          return false;
        })
      ),
    [allTasks]
  );
  const adhocTasks = useMemo(
    () =>
      adhocTaskGroups.flatMap((group, groupIndex) =>
        group.map((task, taskIndex) => ({ task, groupIndex, taskIndex }))
      ),
    [adhocTaskGroups]
  );

  const eventDrivenTaskGroups = useMemo(
    () =>
      allTasks.filter((group) =>
        group.every((t) => {
          if (t.taskGroupType != null) {
            return t.taskGroupType === 'event-driven';
          }
          return false;
        })
      ),
    [allTasks]
  );
  const eventDrivenTasks = useMemo(
    () =>
      eventDrivenTaskGroups.flatMap((group, groupIndex) =>
        group.map((task, taskIndex) => ({ task, groupIndex, taskIndex }))
      ),
    [eventDrivenTaskGroups]
  );

  return {
    sequentialTaskGroups,
    sequentialTasks,
    adhocTaskGroups,
    adhocTasks,
    eventDrivenTaskGroups,
    eventDrivenTasks,
  };
};
