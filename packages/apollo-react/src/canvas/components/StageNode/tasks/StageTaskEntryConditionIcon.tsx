import type { StageTaskItem } from '../StageNode.types';
import { StageEntryConditionIcon } from '../shared/StageEntryConditionIcon';

export const StageTaskEntryConditionIcon = ({
  task,
  small,
}: {
  task: StageTaskItem;
  small?: boolean;
}) => {
  if (!task.hasEntryCondition) {
    return null;
  }
  return (
    <StageEntryConditionIcon dataTestId={`task-entry-condition-icon-${task.id}`} small={small} />
  );
};
