import { EntryConditionIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import { StageTaskItem } from './StageNode.types';

export const StageTaskEntryConditionIcon = ({
  task,
  isReadOnly,
}: {
  task: StageTaskItem;
  isReadOnly?: boolean;
}) => {
  if (!task.hasEntryCondition || isReadOnly) {
    return null;
  }
  return (
    <CanvasTooltip content="Entry condition" placement="top">
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--color-icon-default)',
          flexShrink: 0,
        }}
      >
        <EntryConditionIcon w={20} h={20} />
      </span>
    </CanvasTooltip>
  );
};
