import { Padding, Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import { CanvasIcon } from '../../../../utils/icon-registry';
import { CanvasTooltip } from '../../../CanvasTooltip';
import { ExecutionStatusIcon } from '../../../ExecutionStatusIcon';
import { getExecutionStatusColor } from '../../../ExecutionStatusIcon/ExecutionStatusIcon';
import type { StageNodeBaseProps, StageStatus } from '../../StageNode.types';
import { StageTitleInput } from '../../StageTitleInput';
import { useExecutionStatusLabel } from '../../useExecutionStatusLabel';
import { useStageNodeLabels } from '../../useStageNodeLabels';

interface StageNodeHeaderTopRowInnerProps {
  id: string;
  stageLabel: string;
  stageIcon?: React.ReactElement;
  statusLabel?: string;
  loadingTaskIds?: ReadonlySet<string>;
  isReadOnly: boolean;
  status?: StageStatus;
  onStatusClick: StageNodeBaseProps['onStatusClick'];
  onTaskAdd: StageNodeBaseProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeBaseProps['onAddTaskFromToolbox'];
  onStageTitleChange: StageNodeBaseProps['onStageTitleChange'];
  handleTaskAddClick: (event: React.MouseEvent) => void;
}

const StageNodeHeaderTopRowInner = ({
  id,
  stageLabel,
  stageIcon,
  statusLabel,
  loadingTaskIds,
  isReadOnly,
  status,
  onStatusClick,
  onTaskAdd,
  onAddTaskFromToolbox,
  onStageTitleChange,
  handleTaskAddClick,
}: StageNodeHeaderTopRowInnerProps) => {
  const labels = useStageNodeLabels();
  const getStatusName = useExecutionStatusLabel();

  const isAddTaskDisabled = (loadingTaskIds?.size ?? 0) > 0;

  const icon = stageIcon;
  const statusFallbackName = status ? getStatusName(status) : '';
  const statusTooltip = statusLabel || statusFallbackName;

  return (
    <div className="flex items-start justify-between gap-1">
      <Row gap={Spacing.SpacingMicro} align="center" flex={1} minW={0}>
        {icon}
        <StageTitleInput
          stageId={id}
          label={stageLabel}
          onChange={isReadOnly ? undefined : onStageTitleChange}
          className="flex-1 min-w-0"
        />
      </Row>
      <Row gap={Spacing.SpacingMicro} align="start" py={Padding.PadS}>
        {status && (
          <CanvasTooltip content={statusTooltip} placement="top">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label={statusTooltip}
              data-testid={`stage-status-${id}`}
              onClick={
                onStatusClick
                  ? (e) => {
                      e.stopPropagation();
                      onStatusClick();
                    }
                  : undefined
              }
            >
              {status === 'NotExecuted' ? (
                <CanvasIcon
                  icon="hourglass"
                  size={20}
                  color={getExecutionStatusColor('NotExecuted')}
                />
              ) : (
                <ExecutionStatusIcon status={status} size={20} />
              )}
            </Button>
          </CanvasTooltip>
        )}
        {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly && (
          <CanvasTooltip content={labels.addTask} placement="top">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleTaskAddClick}
              aria-label={labels.addTask}
              disabled={isAddTaskDisabled}
              data-testid={`add-task-button-${id}`}
            >
              <CanvasIcon icon="plus" size={20} />
            </Button>
          </CanvasTooltip>
        )}
      </Row>
    </div>
  );
};

export const StageNodeHeaderTopRow = memo(StageNodeHeaderTopRowInner);
