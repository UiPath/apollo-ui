import { EntryConditionIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import type { StageTaskItem } from './StageNode.types';

export const StageTaskEntryConditionIcon = ({ task }: { task: StageTaskItem }) => {
  if (!task.hasEntryCondition) {
    return null;
  }
  return (
    <CanvasTooltip content="Entry condition" placement="top">
      <span
        data-testid={`task-entry-condition-icon-${task.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-icon-default)',
          flexShrink: 0,
        }}
      >
        <EntryConditionIcon w={13} h={15} tight />
      </span>
    </CanvasTooltip>
  );
};
