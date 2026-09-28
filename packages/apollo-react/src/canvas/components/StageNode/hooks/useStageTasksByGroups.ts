import { useMemo } from 'react';
import type { StageTaskItem } from '../StageNode.types';

type TaskGroupType = 'sequential' | 'adhoc' | 'event-driven';

const typeOf = (task: StageTaskItem): TaskGroupType => {
  if (task.taskGroupType != null) {
    return task.taskGroupType;
  }
  return task.isAdhoc ? 'adhoc' : 'sequential';
};

/** Splits a stage's tasks into its three sections by each task's own type, so a task nested in the
 * wrong group by hand-edited JSON is recovered into the section it belongs to. */
export const useStageTasksByGroups = (allTasks: StageTaskItem[][]) => {
  const sequentialTaskGroups = useMemo(
    () =>
      allTasks
        .map((group) => group.filter((task) => typeOf(task) === 'sequential'))
        .filter((group) => group.length > 0),
    [allTasks]
  );

  // One group per task: neither section nests, so grouping carries no meaning here.
  const adhocTaskGroups = useMemo(
    () =>
      allTasks
        .flat()
        .filter((task) => typeOf(task) === 'adhoc')
        .map((task) => [task]),
    [allTasks]
  );

  const eventDrivenTaskGroups = useMemo(
    () =>
      allTasks
        .flat()
        .filter((task) => typeOf(task) === 'event-driven')
        .map((task) => [task]),
    [allTasks]
  );

  return {
    sequentialTaskGroups,
    adhocTaskGroups,
    eventDrivenTaskGroups,
  };
};
