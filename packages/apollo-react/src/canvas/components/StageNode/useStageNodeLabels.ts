import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import type { StageContextMenuLabels } from './StageNodeTaskUtilities';

export interface StageNodeLabels {
  addFirstTask: string;
  noTasks: string;
  addTask: string;
  replaceTask: string;
  deleteTask: string;
  adhocTasks: string;
  eventDrivenTasks: string;
  sequentialTasks: string;
  parallel: string;
  untitledStage: string;
  contextMenu: StageContextMenuLabels;
}

export function useStageNodeLabels(): StageNodeLabels {
  const { _ } = useSafeLingui();

  return useMemo(
    () => ({
      addFirstTask: _({ id: 'stage-node.add-first-task', message: 'Add first task' }),
      noTasks: _({ id: 'stage-node.no-tasks', message: 'No tasks' }),
      addTask: _({ id: 'stage-node.add-task', message: 'Add task' }),
      replaceTask: _({ id: 'stage-node.replace-task', message: 'Replace task' }),
      deleteTask: _({ id: 'stage-node.delete-task', message: 'Delete task' }),
      adhocTasks: _({ id: 'stage-node.adhoc-tasks', message: 'Manually triggered tasks' }),
      eventDrivenTasks: _({
        id: 'stage-node.event-driven-tasks',
        message: 'Event-triggered tasks',
      }),
      sequentialTasks: _({ id: 'stage-node.sequential-tasks', message: 'Sequential tasks' }),
      parallel: _({ id: 'stage-node.parallel', message: 'Parallel' }),
      untitledStage: _({ id: 'stage-node.untitled-stage', message: 'Untitled stage' }),
      contextMenu: {
        moveUp: _({ id: 'stage-node.move-up', message: 'Move up' }),
        moveDown: _({ id: 'stage-node.move-down', message: 'Move down' }),
        ungroupParallelTasks: _({
          id: 'stage-node.ungroup-parallel-tasks',
          message: 'Ungroup parallel tasks',
        }),
        removeFromParallelGroup: _({
          id: 'stage-node.remove-from-parallel-group',
          message: 'Remove from parallel group',
        }),
        removeGroupFromStage: _({
          id: 'stage-node.remove-group-from-stage',
          message: 'Remove group from stage',
        }),
        deleteTask: _({ id: 'stage-node.delete-task', message: 'Delete task' }),
        createParallelGroupWithTaskAbove: _({
          id: 'stage-node.create-parallel-group-with-task-above',
          message: 'Create parallel group with task above',
        }),
        createParallelGroupWithTaskBelow: _({
          id: 'stage-node.create-parallel-group-with-task-below',
          message: 'Create parallel group with task below',
        }),
        addTaskToParallelGroupAbove: _({
          id: 'stage-node.add-task-to-parallel-group-above',
          message: 'Add task to parallel group above',
        }),
        addTaskToParallelGroupBelow: _({
          id: 'stage-node.add-task-to-parallel-group-below',
          message: 'Add task to parallel group below',
        }),
      },
    }),
    [_]
  );
}
