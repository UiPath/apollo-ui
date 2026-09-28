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
      {/* The positioned wrapper is the tooltip trigger: the tooltip needs a ref-forwarding anchor element. */}
      <div className="absolute -top-1.5 -right-1.5 z-10 flex">
        <Badge
          variant="outline"
          role="img"
          aria-label={label}
          className="h-3.5 w-3.5 justify-center rounded-full border-0 bg-primary p-0 text-primary-foreground [&>svg]:size-2.5"
          data-testid={`stage-task-mocked-${taskId}`}
        >
          <FlaskConical size={10} aria-hidden />
        </Badge>
      </div>
    </CanvasTooltip>
  );
}

export const TaskMockedChip = memo(TaskMockedChipInner);
