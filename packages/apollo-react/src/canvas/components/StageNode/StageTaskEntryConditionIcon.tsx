import { EntryConditionIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import type { StageTaskItem } from './StageNode.types';

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
    <CanvasTooltip content="Entry condition" placement="top">
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-icon-default)',
          flexShrink: 0,
          // Optically centre the diamond; the adjacent play button sits inset (more so when small).
          transform: small ? 'translateX(1px)' : 'translateX(0.5px)',
        }}
      >
        <EntryConditionIcon w={small ? 16 : 20} h={small ? 16 : 20} />
      </span>
    </CanvasTooltip>
  );
};
