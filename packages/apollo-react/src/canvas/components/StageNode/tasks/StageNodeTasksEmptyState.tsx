import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import type { StageNodeProps } from '../StageNode.types';
import { useStageNodeLabels } from '../useStageNodeLabels';

interface StageNodeTasksEmptyStateInnerProps {
  id: string;
  defaultContentMessage?: string;
  onTaskAdd: StageNodeProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeProps['onAddTaskFromToolbox'];
  isReadOnly: boolean;
  handleTaskAddClick: (event: React.MouseEvent) => void;
}

const StageNodeTasksEmptyStateInner = ({
  id,
  defaultContentMessage,
  onTaskAdd,
  onAddTaskFromToolbox,
  isReadOnly,
  handleTaskAddClick,
}: StageNodeTasksEmptyStateInnerProps) => {
  const labels = useStageNodeLabels();
  const defaultContent =
    defaultContentMessage || (isReadOnly ? labels.noTasks : labels.addFirstTask);

  return (
    <>
      {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly ? (
        <Button
          variant="link"
          size="sm"
          onClick={handleTaskAddClick}
          style={{ maxWidth: 'fit-content', padding: 0 }}
          data-testid={`add-task-body-button-${id}`}
        >
          {defaultContent}
        </Button>
      ) : (
        <span
          data-testid={`no-tasks-body-${id}`}
          className="inline-flex items-center h-9 text-sm font-medium text-foreground-muted"
        >
          {defaultContent}
        </span>
      )}
    </>
  );
};

export const StageNodeTasksEmptyState = memo(StageNodeTasksEmptyStateInner);
