import { useMemo } from 'react';
import type { StageTaskItem } from '../StageNode.types';

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
  return {
    sequentialTaskGroups,
    adhocTaskGroups,
    eventDrivenTaskGroups,
  };
};
