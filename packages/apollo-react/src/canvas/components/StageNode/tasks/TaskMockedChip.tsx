import { Badge } from '@uipath/apollo-wind';
import { FlaskConical } from 'lucide-react';
import { memo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { CanvasTooltip } from '../../CanvasTooltip';

export interface TaskMockedChipProps {
  /** Whether this task's outputs are mocked. */
  mocked: boolean;
  /** Task id, used for a stable test id. */
  taskId: string;
}

function TaskMockedChipInner({ mocked, taskId }: TaskMockedChipProps) {
  const { _ } = useSafeLingui();

  if (!mocked) {
    return null;
  }

  const label = _({ id: 'stage-node.task-mocked', message: "This task's outputs are mocked" });

  return (
    <CanvasTooltip content={label} placement="top">
      <Badge
        variant="warning"
        role="img"
        aria-label={label}
        className="absolute -top-1.5 -right-1.5 z-10 h-4 w-4 justify-center rounded-full border-warning bg-chip-warning-background p-0 hover:bg-chip-warning-background [&>svg]:size-2.5"
        data-testid={`stage-task-mocked-${taskId}`}
      >
        <FlaskConical aria-hidden />
      </Badge>
    </CanvasTooltip>
  );
}

export const TaskMockedChip = memo(TaskMockedChipInner);
