import type { StageTaskItem } from '../StageNode.types';
import { StageEntryConditionIcon } from '../shared/StageEntryConditionIcon';

export const StageTaskEntryConditionIcon = ({ task }: { task: StageTaskItem }) => {
  if (!task.hasEntryCondition) {
    return null;
  }
  return (
    <StageEntryConditionIcon dataTestId={`task-entry-condition-icon-${task.id}`} small={true} />
  );
};
